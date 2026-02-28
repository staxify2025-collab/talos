# Talos Tenant Onboarding & Agent Setup Guide

This guide provides the official step-by-step process for provisioning new tenants and configuring AI agents within the Talos platform.

## Phase 1: Tenant Provisioning

1.  **Access Admin Portal**: Navigate to the `/admin/tenants` dashboard.
2.  **Register New Tenant**:
    - Click **"New Tenant"**.
    - Enter the **Organization Name**.
    - Specify the **Owner Name** and **Owner Email**.
    - Select the **Subscription Tier** (Starter, Professional, or Enterprise).
3.  **Complete Registration**: Click **"Complete Registration"**. This initializes the multi-tenant Firestore structure and creates the base tenant record.

## Phase 2: Onboarding Wizard

After registration, you will be redirected to the **Setup Wizard** (`/admin/tenants/[id]/setup`).

1.  **Step 1: Identity Verification**: Verify the tenant metadata and subscription tier.
2.  **Step 3: Knowledge Base Grounding**:
    - Upload training documentation (PDF, JSON, CSV).
    - **Pro Tip**: Include UI field definitions or business rules that the agent should follow during migration.
3.  **Step 3: Define Your Target Application**:
    - Enter the **Application Name** (e.g., "SAP S/4HANA").
    - Enter the **Process Name** (e.g., "Vendor Invoice Entry").
4.  **Step 4: Launch**: Confirm the configuration and proceed to the dashboard.

## Phase 3: Setting Up & Testing an Agent (Migration Session)

To test the agent, you must create a **Migration Session**.

1.  **Navigate to Migrations**: Go to `/admin/migrations` for the specific tenant.
2.  **Create Session**: Click **"New Migration Session"** and select the Schema created during onboarding.
3.  **Open Dual-Surface Controller**: Click on the new session to open the controller.
4.  **Upload Test Screenshots**:
    - **Source Application**: Upload a screenshot of the "Source" data view.
    - **Target Application**: Upload a screenshot of the "Destination" form.
5.  **Run Migration Loop**:
    - Click **"Process Next"**.
    - Watch the and automate the **READ → MAP → WRITE → VALIDATE** loop.
6.  **Verify Results**:
    - Review the **Accuracy Circle** on the dashboard.
    - Check for any **Exceptions** in the sidebar.
    - Click **"Download Proof"** to generate the official Migration Certificate.

---

> [!TIP]
> **Enterprise Tip**: For high-volume migrations (10,000+ records), ensure you have uploaded a comprehensive "UI Mapping Guide" to the Knowledge Base during Phase 2 to minimize exceptions.
