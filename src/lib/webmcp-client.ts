/**
 * WebMCP Client — Protocol Handshake & Tool Discovery
 *
 * Detects the emerging `navigator.modelContext` (Web Model Context Protocol)
 * API on target URLs. When available, Talos can execute structured actions
 * directly — bypassing Vision AI entirely for massive cost savings.
 *
 * Fallback: When WebMCP is not available (the common case today), Talos
 * uses Gemini 3 Flash Vision mapping with bounding-box coordinate detection.
 */

// ─── Type Declarations (WebMCP is not in standard lib yet) ──

export interface WebMCPToolParameter {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
}

export interface WebMCPTool {
  name: string;
  description?: string;
  parameters?: WebMCPToolParameter[];
  /** Metadata tags the site may expose (e.g. "invoice", "form") */
  tags?: string[];
}

export interface WebMCPExecutionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

interface ModelContext {
  listTools(): Promise<WebMCPTool[]>;
  execute(toolName: string, params: Record<string, unknown>): Promise<WebMCPExecutionResult>;
}

// Extend Navigator for the WebMCP API
declare global {
  interface Navigator {
    modelContext?: ModelContext;
  }
}

export type ExecutionPath = 'WEBMCP' | 'VISION';

export interface DiscoveryResult {
  available: boolean;
  tools: WebMCPTool[];
  matchedTool: WebMCPTool | null;
  executionPath: ExecutionPath;
}

// ─── Detection ──────────────────────────────────────────────

/** Check if the browser exposes the WebMCP API */
export function detectWebMCP(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'modelContext' in navigator &&
    navigator.modelContext !== undefined &&
    typeof navigator.modelContext.listTools === 'function'
  );
}

// ─── Tool Discovery ─────────────────────────────────────────

/** List all WebMCP tools available on the current page */
export async function discoverTools(): Promise<WebMCPTool[]> {
  if (!detectWebMCP()) return [];
  try {
    return await navigator.modelContext!.listTools();
  } catch (err) {
    console.warn('[Talos WebMCP] Tool discovery failed:', err);
    return [];
  }
}

/**
 * Attempt to match a WebMCP tool to a Talos field mapping schema.
 *
 * Matching heuristic (priority order):
 * 1. Exact tool name match against schema.targetApp
 * 2. Tag-based match (tool tags contain the schema name)
 * 3. Parameter overlap — if ≥50% of schema source fields appear as tool params
 */
export function matchTool(
  tools: WebMCPTool[],
  schemaName: string,
  targetApp: string,
  sourceFields: string[]
): WebMCPTool | null {
  if (tools.length === 0) return null;

  // 1. Exact name match
  const nameMatch = tools.find(
    (t) => t.name.toLowerCase() === targetApp.toLowerCase()
  );
  if (nameMatch) return nameMatch;

  // 2. Tag match
  const tagMatch = tools.find((t) =>
    t.tags?.some(
      (tag) =>
        tag.toLowerCase().includes(schemaName.toLowerCase()) ||
        tag.toLowerCase().includes(targetApp.toLowerCase())
    )
  );
  if (tagMatch) return tagMatch;

  // 3. Parameter overlap (≥50%)
  const fieldsLower = sourceFields.map((f) => f.toLowerCase());
  for (const tool of tools) {
    if (!tool.parameters?.length) continue;
    const paramNames = tool.parameters.map((p) => p.name.toLowerCase());
    const overlap = fieldsLower.filter((f) =>
      paramNames.some((p) => p.includes(f) || f.includes(p))
    ).length;
    if (overlap / fieldsLower.length >= 0.5) return tool;
  }

  return null;
}

// ─── Execution ──────────────────────────────────────────────

/** Execute a WebMCP tool with extracted field data */
export async function executeTool(
  toolName: string,
  data: Record<string, string>
): Promise<WebMCPExecutionResult> {
  if (!detectWebMCP()) {
    return { success: false, error: 'WebMCP not available' };
  }

  try {
    return await navigator.modelContext!.execute(toolName, data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Talos WebMCP] Execution failed:', msg);
    return { success: false, error: msg };
  }
}

// ─── Full Discovery Flow ────────────────────────────────────

/**
 * Run the complete WebMCP discovery: detect → list tools → match schema.
 * Returns the execution path the agent should use.
 */
export async function runDiscovery(
  schemaName: string,
  targetApp: string,
  sourceFields: string[]
): Promise<DiscoveryResult> {
  const available = detectWebMCP();

  if (!available) {
    return { available: false, tools: [], matchedTool: null, executionPath: 'VISION' };
  }

  const tools = await discoverTools();
  const matchedTool = matchTool(tools, schemaName, targetApp, sourceFields);

  return {
    available: true,
    tools,
    matchedTool,
    executionPath: matchedTool ? 'WEBMCP' : 'VISION',
  };
}
