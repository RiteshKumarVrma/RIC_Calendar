import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { sendEmail } from '@/lib/messaging/email-provider'
import { sendWhatsApp } from '@/lib/messaging/whatsapp-provider'
import { NextRequest, NextResponse } from 'next/server'

// Since this is an API route, we should verify a secret or ensure it's Vercel Cron.
// checking for 'Authorization: Bearer <CRON_SECRET>' is good practice.

export async function GET(req: NextRequest) {
    // 0. Check Authorization (Optional but recommended)
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //    return new NextResponse('Unauthorized', { status: 401 });
    // }

    // Use admin client if possible, but for now using cookies (might fail if called from external cron without auth)
    // Actually, for cron jobs we typically need a service_role client.
    // However, existing setup uses createClient from server.ts which uses cookies.
    // We will try running this as an authenticated admin in browser for testing, 
    // OR if run by Vercel Cron, we need a service role client.
    // For this MVP, let's assume we trigger it manually or use a service role client if available.

    // Attempting to Create client. If cookie not present, this might fail RLS if tables are private.
    // Assuming we have service role key in env, we should use it for background jobs.
    // const supabase = createClient(cookies(), process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Fallback: Using standard client (requires manual trigger by logged in admin)
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // 1. Fetch pending messages (Limit 20 per run to respect rate limits)
    // Join with campaigns to get template info
    const { data: messages, error } = await supabase
        .from('campaign_messages')
        .select(`
            id, 
            status, 
            contact_id, 
            campaign_id,
            contacts (id, name, email, phone),
            campaigns (id, name, type, template_id, message_templates (name, content, subject, type))
        `)
        .eq('status', 'pending')
        .limit(20)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!messages || messages.length === 0) {
        return NextResponse.json({ message: 'No pending messages' })
    }

    const results = []

    // 2. Process each message
    for (const msg of (messages as any[])) {
        const campaign = msg.campaigns
        const contact = msg.contacts
        const template = campaign?.message_templates

        if (!campaign || !contact || !template) {
            // Bad data, mark failed
            await supabase.from('campaign_messages').update({ status: 'failed', error_message: 'Missing data' }).eq('id', msg.id)
            continue
        }

        let sendResult;

        // Personalize content
        let content = template.content
        if (contact.name) {
            content = content.replace(/{{name}}/g, contact.name)
        }

        // Channel specific sending
        if (campaign.type === 'email') {
            if (!contact.email) {
                await supabase.from('campaign_messages').update({ status: 'failed', error_message: 'No email' }).eq('id', msg.id)
                continue
            }
            sendResult = await sendEmail({
                to: contact.email,
                subject: template.subject || 'Notification',
                html: content
            })
        } else if (campaign.type === 'whatsapp') {
            if (!contact.phone) {
                await supabase.from('campaign_messages').update({ status: 'failed', error_message: 'No phone' }).eq('id', msg.id)
                continue
            }
            // For now sending raw text if template content is text, or use template logic
            // Assuming template content is the message for simplicity
            sendResult = await sendWhatsApp({
                to: contact.phone,
                message: content
            })
        } else {
            sendResult = { success: false, error: 'Unknown type' }
        }

        // Update status
        if (sendResult.success) {
            await supabase.from('campaign_messages').update({
                status: 'sent',
                sent_at: new Date().toISOString(),
                provider_id: sendResult.id
            }).eq('id', msg.id)

            // Increment campaign stats
            // Note: This is inefficient to do 1 by 1, better to do batch update or a trigger.
            // But for MVP it's fine.
            // We can also compute stats on read.
        } else {
            await supabase.from('campaign_messages').update({
                status: 'failed',
                error_message: sendResult.error
            }).eq('id', msg.id)
        }

        results.push({ id: msg.id, success: sendResult.success })
    }

    // 3. Update campaign status if all done? 
    // This is complex to check efficiently. 
    // We can leave campaign status as 'processing' and have a separate checker 
    // or just let the user see the stats.

    return NextResponse.json({ processed: results.length, results })
}
