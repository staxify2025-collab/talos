// Firestore Multi-Tenant Schema — TypeScript Interfaces
// v3: Added executionPath for WebMCP vs Vision tracking

export interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: 'active' | 'suspended' | 'trial';
  createdAt: Date;
  updatedAt: Date;
}

export interface MappingEntry {
  /** Field name in the source document (e.g., "Invoice Total") */
  sourceField: string;
  /** Label of the target input in the destination app (e.g., "Total Amount") */
  targetLabel: string;
  /** Optional bounding region hint for the target field */
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FieldMappingSchema {
  id: string;
  tenantId: string;
  name: string;
  targetApp: string;
  description: string;
  mappings: MappingEntry[];
  createdAt: Date;
  updatedAt: Date;
}

/** Pixel-precise bounding box in [ymin, xmin, ymax, xmax] format */
export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface MappedAction {
  field: string;
  value: string;
  boundingBox: BoundingBox;
  confidence: number;
}

/** Token usage metadata for ROI tracking on context caching */
export interface JobUsageMetadata {
  /** Tokens served from cache (90% discount) */
  cachedContentTokenCount: number;
  /** Total tokens in the request */
  totalTokenCount: number;
  /** Prompt tokens (non-cached input) */
  promptTokenCount: number;
  /** Output tokens */
  candidatesTokenCount: number;
  /** Thinking/reasoning tokens used by the model */
  thoughtsTokenCount: number;
}

/** Metadata for a cached context entry */
export interface CacheMetadata {
  cachedContentName: string;
  schemaId: string;
  tenantId: string;
  model: string;
  createdAt: Date;
  expiresAt: Date;
  tokenCount: number;
}

export interface Job {
  id: string;
  tenantId: string;
  schemaId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sourceFileUrl: string;
  sourceFileName: string;
  targetScreenshotUrl: string | null;
  extractedData: Record<string, string>;
  mappedActions: MappedAction[];
  usageMetadata: JobUsageMetadata | null;
  cacheStatus: 'HIT' | 'CREATED' | 'NONE';
  /** Whether this job used WebMCP structured mode or Vision AI fallback */
  executionPath: 'WEBMCP' | 'VISION';
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

/** Performance log entry stored in tenants/{tenantId}/runs */
export interface RunLog {
  schemaId: string;
  model: string;
  success: boolean;
  cacheStatus: 'HIT' | 'CREATED';
  usageMetadata: JobUsageMetadata;
  tokenSavingsPercent: number;
  /** Whether this run used WebMCP structured mode or Vision AI fallback */
  executionPath: 'WEBMCP' | 'VISION';
  createdAt: Date;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: Date;
}

/** 
 * Data Migration Session
 * Track bulk "Source App -> Target App" operations
 */
export interface MigrationSession {
  id: string;
  tenantId: string;
  name: string;
  sourceApp: string;
  targetApp: string;
  schemaId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'paused' | 'failed';
  totalRecords: number;
  migratedCount: number;
  exceptionCount: number;
  totalTokensSaved: number;
  lastRecordID: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Individual record being migrated in a session
 */
export interface MigrationJob {
  id: string;
  sessionId: string;
  tenantId: string;
  recordID: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'verified' | 'override';
  sourceScreenshotUrl: string;
  targetScreenshotUrl: string | null;
  validationScreenshotUrl: string | null;
  extractedData: Record<string, string>;
  mappedActions: MappedAction[];
  userCorrection?: Record<string, string>;
  isVerified: boolean;
  usageMetadata?: JobUsageMetadata;
  cacheStatus?: 'HIT' | 'CREATED' | 'NONE';
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}
