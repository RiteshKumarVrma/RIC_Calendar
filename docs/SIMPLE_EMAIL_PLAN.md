# Simple Email Marketing (Excel Upload + Timer)

## 1. Architecture: Single Page + Background Worker (MCP)
We will switch from the complex wizard to a **Single Page App** approach located at `/dashboard/email/simple`.

-   **Frontend**: Next.js Page.
    -   File Upload (XLSX).
    -   Countdown Timer (React State).
    -   Progress Bar.
-   **Backend**: Supabase.
    -   Table `simple_campaigns` (id, status, created_at).
    -   Table `simple_emails` (id, campaign_id, email, status).
-   **Worker**: MCP Server (`email-worker.ts`).
    -   Updated to handle "Simple Mode".
    -   Logic: "If status is 'scheduled', wait 60s, then start loop."

## 2. Implementation Steps

### A. Database Schema (New Migration)
Create a simpler structure for this feature (or adapt existing). Let's keep it separate to avoid breaking the complex wizard.
```sql
create table simple_emails (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  status text default 'pending', -- pending, sent, failed
  sent_at timestamptz,
  created_at timestamptz default now()
);
```
*(For simplicity, we might just wipe/reuse `simple_emails` for now, or just use one table)*.

### B. UI Layout (`/dashboard/email/simple/page.tsx`)
1.  **Zone 1: Upload**:
    -   Input type="file" (accept .xlsx).
    -   `xlsx` library to parse client-side or server-side.
    -   Display "Found 54 emails".
2.  **Zone 2: Controls**:
    -   Big "START CAMPAIGN" button.
3.  **Zone 3: The Countdown**:
    -   Hidden until start.
    -   "Sending in 60... 59..."
    -   (Once 0): "Sending... 4/54"

### C. The Worker Logic (MCP)
We update `email-worker.ts` to include a new tool `start-simple-campaign`.

```typescript
// MCP Tool
server.tool("start-simple-run", { emails: z.array(z.string()) }, async ({ emails }) => {
   // 1. Clear previous simple_emails
   // 2. Insert new emails to simple_emails
   // 3. Set global STATE variable: isSimpleMode = true; startTime = Now + 60s
   return { text: "Queue loaded. Timer started." }
});

// Worker Loop Update
// If isSimpleMode && Now > startTime:
//    Pop one email from simple_emails (status=pending)
//    Send it
//    Sleep 5-10s
```

## 3. Plan
1.  **Create Migration**: `simple_emails` table.
2.  **Update MCP Worker**: Add the simple logic.
3.  **Build Page**: File upload + Timer UI.

Let's start by modifying the **MCP Worker** to support this simpler, more direct flow.
