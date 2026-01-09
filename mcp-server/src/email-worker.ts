import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// --- CONFIGURATION ---
const CONFIG = {
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, // Prefer Service Role for workers

    // Safety Limits
    MIN_DELAY_MS: 30000, // 30s
    MAX_DELAY_MS: 60000, // 60s
    DAILY_LIMIT: 400
};

// Check Config
if (!CONFIG.GMAIL_USER || !CONFIG.GMAIL_APP_PASSWORD || !CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) {
    console.error("Missing required environment variables. Please check .env file.");
    process.exit(1);
}

// --- INITIALIZATION ---
// 1. Supabase Client
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// 2. Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: CONFIG.GMAIL_USER,
        pass: CONFIG.GMAIL_APP_PASSWORD,
    },
});

// 3. MCP Server
const server = new McpServer({
    name: "RIC_Email_Worker",
    version: "1.0.0",
});

// --- STATE ---
let dailySentCount = 0;
let isWorkerRunning = true; // Auto-start for simple mode convenience
let currentDelay = 0;

// Simple Mode State
let simpleRunParams: {
    active: boolean;
    startAt: number; // Timestamp
} = { active: false, startAt: 0 };


// --- HELPERS ---
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const getRandomDelay = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);


// --- WORKER LOOP ---
async function startWorkerResult() {
    console.log("Starting Email Worker Loop (Unified)...");

    (async () => {
        while (true) { // Always run
            try {
                // -----------------------------
                // A. SIMPLE MODE LOGIC
                // -----------------------------
                if (simpleRunParams.active) {
                    const now = Date.now();
                    const waitTime = simpleRunParams.startAt - now;

                    if (waitTime > 0) {
                        // Counting down...
                        await sleep(1000);
                        continue;
                    }

                    // Timer passed, verify Daily Limit
                    if (dailySentCount >= CONFIG.DAILY_LIMIT) {
                        console.log("Daily limit reached in Simple Mode. Stopping.");
                        simpleRunParams.active = false;
                        continue;
                    }

                    // Fetch next pending
                    const { data: job, error } = await supabase
                        .from('simple_emails')
                        .select('*')
                        .eq('status', 'pending')
                        .limit(1)
                        .single();

                    if (!job || error) {
                        // Queue finished?
                        const { count } = await supabase.from('simple_emails').select('*', { count: 'exact', head: true }).eq('status', 'pending');
                        if (count === 0) {
                            console.log("Simple Run Completed.");
                            simpleRunParams.active = false;
                        }
                        await sleep(2000);
                        continue;
                    }

                    // SEND
                    const subject = job.subject || "Update from RIC";
                    let content = job.body || "Here is the update.";

                    // Basic variable replacement
                    content = content.replace('{{name}}', 'Friend'); // simple_emails table doesn't have name col yet, assume email only

                    console.log(`[Simple] Sending to ${job.email}...`);
                    try {
                        await transporter.sendMail({
                            from: `"Ritesh (Simple)" <${CONFIG.GMAIL_USER}>`,
                            to: job.email,
                            subject: subject,
                            html: content
                        });

                        await supabase.from('simple_emails').update({
                            status: 'sent',
                            sent_at: new Date().toISOString()
                        }).eq('id', job.id);

                        dailySentCount++;

                    } catch (sendError: any) {
                        console.error("Send Failed", sendError);
                        await supabase.from('simple_emails').update({
                            status: 'failed',
                            error_message: sendError.message
                        }).eq('id', job.id);
                    }

                    // WAIT 5-10s
                    const delay = getRandomDelay(5000, 10000);
                    console.log(`[Simple] Sleeping ${delay}ms...`);
                    await sleep(delay);

                    continue; // Loop immediately to check next
                }

                // -----------------------------
                // B. STANDARD MODE LOGIC (Fallback)
                // -----------------------------
                // (Existing logic for campaigns if simple mode is off)
                // Check Daily Limit
                if (dailySentCount >= CONFIG.DAILY_LIMIT) {
                    await sleep(60000 * 60);
                    continue;
                }

                // Fetch Next Job
                const { data: job, error } = await supabase
                    .from('campaign_messages')
                    .select('*, contacts(email, name), campaigns(name, message_templates(content, subject))')
                    .eq('status', 'pending')
                    .limit(1)
                    .single();

                if (job && !error && job.contacts?.email) {
                    const template = job.campaigns?.message_templates;
                    const subject = template?.subject || "Update from RIC Calendar";
                    let content = template?.content || "";
                    content = content.replace('{{name}}', job.contacts.name || 'Friend');

                    console.log(`[Campaign] Sending to ${job.contacts.email}...`);
                    await transporter.sendMail({
                        from: `"Ritesh from RIC" <${CONFIG.GMAIL_USER}>`,
                        to: job.contacts.email,
                        subject: subject,
                        html: content,
                        headers: { 'List-Unsubscribe': `<mailto:${CONFIG.GMAIL_USER}?subject=unsubscribe>` }
                    });

                    await supabase.from('campaign_messages').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', job.id);
                    dailySentCount++;

                    const cDelay = getRandomDelay(CONFIG.MIN_DELAY_MS, CONFIG.MAX_DELAY_MS);
                    console.log(`[Campaign] Sleeping ${cDelay}ms...`);
                    await sleep(cDelay);
                } else {
                    await sleep(5000); // Idle
                }

            } catch (err: any) {
                console.error("Worker Error:", err);
                await sleep(5000);
            }
        }
    })();
    return { status: "started" };
}

// Update Start Call
startWorkerResult();

server.tool(
    "prepare-simple-run",
    { emails: z.array(z.string()) },
    async ({ emails }) => {
        // 1. Reset Table
        await supabase.from('simple_emails').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all 

        // 2. Insert
        const cleanEmails = [...new Set(emails)].filter(e => e.includes('@'));
        const rows = cleanEmails.map(e => ({ email: e, status: 'pending' }));

        if (rows.length > 0) {
            await supabase.from('simple_emails').insert(rows);
        }

        // 3. Set State
        simpleRunParams = {
            active: true,
            startAt: Date.now() + 60000 // 60 seconds from now
        };

        return {
            content: [{ type: "text", text: `Loaded ${rows.length} emails. Starting in 60s.` }],
        };
    }
);
server.tool(
    "send-test-email",
    { email: z.string().email(), content: z.string() },
    async ({ email, content }) => {
        try {
            await transporter.sendMail({
                from: CONFIG.GMAIL_USER,
                to: email,
                subject: "Test Email from MCP Worker",
                text: content
            });
            return {
                content: [{ type: "text", text: `Test email sent to ${email}` }],
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `Error sending email: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// --- START SERVER ---
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("RIC Email Worker MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main loop:", error);
    process.exit(1);
});
