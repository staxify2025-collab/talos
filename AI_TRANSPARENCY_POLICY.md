# Talos AI Transparency & Ethics Policy

## 1. Transparency Commitment

Staxify is committed to providing full visibility into how Talos (the "Agent") interacts with tenant data during migration. Every action taken by the Agent is logged, timestamped, and attributed to a specific model version (e.g., Gemini 3 Flash).

## 2. Data Processing & Privacy

- **Data Minimization**: Talos only extracts fields defined in the `FieldMappingSchema`.
- **Ephemeral Processing**: Screenshots used for Vision AI mapping are processed in secure, ephemeral Cloud Functions environments.
- **No Model Training**: Tenant data processed by Talos is NOT used to train foundation models.

## 3. Human-in-the-Loop (HITL)

- **Validation**: High-risk actions or low-confidence mappings (Confidence < 0.85) are automatically flagged for "Manual Review."
- **Override Capability**: Human Operators have the final authority to "Override" any Agent-proposed action via the Manual Correction Overlay.

## 4. Auditability

- **Migration Proof**: For every migration session, Talos generates a "Migration Proof" certificate. This document serves as the official audit trail, documenting successful transfers and exceptions.
- **Record Level Logging**: Each record has a dedicated log entry in Firestore, including the original source screenshot and the final target data state.

## 5. Limitation of Liability

Talos is a productivity tool. While we aim for 100% accuracy, the "Operator" (Client) is responsible for the final "Audit Compliant" check before finalizing large-scale data commits.

---

_Last Updated: February 2026_
