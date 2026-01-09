# Email Marketing Architecture & Implementation Plan

## 1. Recommended Architecture
To meet the safety, throttling, and compliance requirements using a **Personal Gmail Account**, I recommend a **Hybrid Architecture**:

-   **Frontend (Next.js)**: Dashboard for composing emails, selecting recipients, and viewing real-time status.
-   **Database (Supabase)**: Acts as the persistent **Job Queue**.
    -   Table `campaign_messages` serves as the queue.
    -   Statuses: `pending` -> `processing` -> `sent` / `failed`.
-   **Execution Engine (Local MCP Server)**:
    -   This is a Node.js process running locally on your machine.
    -   **Why Local?**
        1.  **Safety**: Keeps your Gmail credentials (App Password) on your local machine, never on a cloud server.
        2.  **IP Reputation**: Sending from your residential IP is often safer for personal Gmail accounts than cloud data center IPs (AWS/Vercel) which are often flagged.
        3.  **Process Control**: Allows perfect control over timing (e.g., "wait 43 seconds") which is difficult in serverless environments like Vercel.

## 2. UI/UX Layout Description
We will implement a **Multi-Step Wizard** for the Campaign Create page (`/dashboard/email/create`).

### Step 1: Content Editor
-   **Component**: Rich Text Editor (using `tiptap` or `react-quill`).
-   **Features**:
    -   Variable injection (e.g., `Hello {{name}}`).
    -   Live Preview toggle (Desktop, Mobile view).
    -   Save Draft functionality (auto-save).

### Step 2: Recipient Selection
-   **Interface**: Split view.
    -   Left: Filter controls (Tags: "VIP", "Lead", "New").
    -   Right: Live list of matching contacts with a count (e.g., "Matches 142 contacts").
-   **Safety Check**: Display warning if recipient count exceeds daily safe limits.

### Step 3: Scheduling & safety
-   **Controls**:
    -   **Start Time**: "Send Now" vs "Schedule for Later".
    -   **Throttling**: Slider or Input for "Delay between emails" (Default: 30s - 60s randomized).
    -   **Daily Limit**: Input for "Max emails today" (stays persistent).

### Step 4: Review & Confirm
-   **Summary Card**:
    -   "Sending to **142** contacts."
    -   "Estimated completion time: **2 hours 15 mins**."
    -   "Sending from: **your.email@gmail.com**."
-   **Action**: "Launch Campaign" button with a confirmation modal.

## 3. Safe Email Sending Strategy (The "Human Behavior" Protocol)
To avoid Gmail blocking your personal account, the MCP Server will implement the following logic:

1.  **Randomized Delays**: Never send efficiently.
    -   Instead of exactly 30s, sleep for `Reading + Typing Time` simulation (e.g., `30s + Math.random() * 30s`).
2.  **Warm-Up Ramp**:
    -   Day 1: Max 50 emails.
    -   Day 2: Max 100 emails.
    -   Day 3: Max 200 emails. (Cap at ~400/day for personal Gmail).
3.  **Headers & Content**:
    -   Include `List-Unsubscribe` header (even if mailto).
    -   Avoid spam trigger words in Subject (e.g., "FREE", "URGENT", "WIN").
    -   Text-to-HTML ratio should be balanced (don't send just one giant image).

## 4. MCP Server Design
The MCP Server (`gmail-marketing-worker`) will have two roles: **Passive Tools** and **Active Worker**.

### A. The Active Worker (Background Loop)
A background loop that starts when the server runs:
```typescript
interface WorkerConfig {
  minDelay: 30000; // 30s
  maxDelay: 60000; // 60s
  dailyLimit: 400;
}

// Pseudo-code loop
while(true) {
  if (dailyCount >= dailyLimit) { wait_until_tomorrow(); continue; }
  
  const job = await supabase.from('campaign_messages').select().eq('status', 'pending').single();
  
  if (!job) { sleep(10000); continue; } // No work
  
  try {
    await sendGmail(job);
    await markAsSent(job.id);
    dailyCount++;
  } catch (e) {
    await markAsFailed(job.id, e);
  }
  
  // The key safety feature
  const delay = random(config.minDelay, config.maxDelay);
  await sleep(delay); 
}
```

### B. Exposed MCP Tools (For AI Agent)
These tools allow you (via Claude/Cursor) to supervise the worker.

1.  **`start_campaign(campaign_id)`**:
    -   Updates campaign status from `draft` to `processing`.
    -   Kicks the worker to check for new jobs immediately.
2.  **`get_worker_status()`**:
    -   Returns: `{ status: "running", dailySent: 42, currentDelay: "45s", queueLength: 150 }`.
3.  **`update_safety_settings(minDelay, maxDelay, dailyLimit)`**:
    -   Allows dynamic adjustment if you suspect issues.
4.  **`analyze_campaign_logs(campaign_id)`**:
    -   Reads Supabase logs and returns a summary for AI analysis (Open rates, bounce reasons).

## 5. Next Steps
1.  **Scaffold MCP Server**: Create `packages/mcp-email-worker`.
2.  **Database Migration**: Ensure `campaign_messages` track detailed status and timestamps.
3.  **Frontend**: Build the Wizard UI in user dashboard.
