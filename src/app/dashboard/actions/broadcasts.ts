'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// CONTACTS
const ContactSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    tags: z.string().optional(), // Comma separated string from form
})

export async function getContacts() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching contacts:', error)
        return []
    }

    return data
}

export async function createContact(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const rawData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        tags: formData.get('tags'),
    }

    const validated = ContactSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: 'Invalid data' }
    }

    const { name, email, phone, tags } = validated.data

    const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []

    const { error } = await supabase.from('contacts').insert({
        name,
        email: email || null,
        phone: phone || null,
        tags: tagsArray,
    })

    if (error) {
        console.error('Error creating contact:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/broadcasts/contacts')
    return { success: true }
}

export async function deleteContact(id: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.from('contacts').delete().eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/broadcasts/contacts')
    return { success: true }
}

export async function bulkImportContacts(contacts: any[]) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const chunkSize = 100
    for (let i = 0; i < contacts.length; i += chunkSize) {
        const chunk = contacts.slice(i, i + chunkSize)
        const { error } = await supabase.from('contacts').insert(chunk)
        if (error) {
            console.error('Error importing contacts chunk:', error)
            return { error: error.message }
        }
    }

    revalidatePath('/dashboard/broadcasts/contacts')
    return { success: true }
}

export async function startSimpleCampaign(emails: string[], subject: string, body: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // 1. Insert
    // We will duplicate subject/body for each row. efficient? no. Simple? Yes. 
    // Ideally we use a parent table, but let's stick to the "Simple Emails" table structure request.
    const rows = emails.map(e => ({
        email: e,
        status: 'pending',
        subject: subject,
        body: body // We need to add these columns!
    }))

    if (rows.length > 0) {
        const { error } = await supabase.from('simple_emails').insert(rows)
        if (error) {
            console.error('Error starting simple campaign:', error)
            return { error: error.message }
        }
    }

    return { success: true }
}

// TEMPLATES
const TemplateSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['email', 'whatsapp']),
    content: z.string().min(1),
    subject: z.string().optional(),
})

export async function getTemplates() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching templates:', error)
        return []
    }
    return data
}

export async function createTemplate(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const rawData = {
        name: formData.get('name'),
        type: formData.get('type'),
        content: formData.get('content'),
        subject: formData.get('subject'),
    }

    const validated = TemplateSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: 'Invalid template data' }
    }

    const { name, type, content, subject } = validated.data

    const { error } = await supabase.from('message_templates').insert({
        name,
        type,
        content,
        subject: subject || null,
        is_active: true
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/broadcasts/templates')
    return { success: true }
}

export async function deleteTemplate(id: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.from('message_templates').delete().eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/broadcasts/templates')
    return { success: true }
}

// CAMPAIGNS
const CampaignSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['email', 'whatsapp']),
    template_id: z.string().min(1),
    scheduled_at: z.string().optional(), // ISO string or empty
    filter_tags: z.string().optional(),
    audience_source: z.string().optional(),
    manual_emails: z.string().optional(),
})

export async function getCampaigns(type?: 'email' | 'whatsapp') {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    let query = supabase
        .from('campaigns')
        .select('*, message_templates(name)')
        .order('created_at', { ascending: false })

    if (type) {
        query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching campaigns:', error)
        return []
    }
    return data
}

export async function createCampaign(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const rawData = {
        name: formData.get('name'),
        type: formData.get('type'),
        template_id: formData.get('template_id'),
        scheduled_at: formData.get('scheduled_at'),
        filter_tags: formData.get('filter_tags'),
        audience_source: formData.get('audience_source'),
        manual_emails: formData.get('manual_emails'),
    }

    const validated = CampaignSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: 'Invalid campaign data' }
    }

    const { name, type, template_id, scheduled_at, filter_tags, audience_source, manual_emails } = validated.data

    const tagsArray = filter_tags ? filter_tags.split(',').map(t => t.trim()).filter(Boolean) : []

    // 1. Create Campaign
    const { data: campaign, error: campaignError } = await supabase.from('campaigns').insert({
        name,
        type,
        template_id,
        scheduled_at: scheduled_at || null,
        status: 'draft',
        filter_tags: tagsArray
    }).select().single()

    if (campaignError) {
        return { error: campaignError.message }
    }

    // 2. Generate Campaign Messages (Queue)
    let finalContactIds: string[] = []

    if (audience_source === 'manual' && manual_emails) {
        // Handle Manual Emails
        const emailList = manual_emails.split(/[\n,]+/)
            .map(e => e.trim())
            .filter(e => e.includes('@') && e.length > 3)

        const uniqueEmails = [...new Set(emailList)]

        if (uniqueEmails.length === 0) {
            return { success: true, warning: 'No valid emails in manual list' }
        }

        // Upsert Contacs
        const contactsToUpsert = uniqueEmails.map(email => ({
            email,
            name: email.split('@')[0], // Fallback name
            tags: ['manual-import', `campaign-${campaign.id}`],
            is_subscribed: true
        }))

        // We can't easily return IDs from upsert in Supabase JS in one go if onConflict is needed heavily
        // A simple loop or ignoreDuplicates might work.
        // Let's use upsert with onConflict email.

        const { data: upsertedContacts, error: upsertError } = await supabase
            .from('contacts')
            .upsert(contactsToUpsert, { onConflict: 'email', ignoreDuplicates: false })
            .select('id')

        if (upsertError) {
            console.error('Upsert contacts error:', upsertError)
            // Fallback: try to fetch existing by email
        }

        // Fetch IDs again to be sure (since upsert might not return all if not modified? actually it should with select)
        const { data: fetchedContacts } = await supabase.from('contacts').select('id').in('email', uniqueEmails)
        if (fetchedContacts) {
            finalContactIds = fetchedContacts.map(c => c.id)
        }

    } else {
        // Handle Database Query
        let query = supabase.from('contacts').select('id').eq('is_subscribed', true)
        if (tagsArray.length > 0) {
            query = query.overlaps('tags', tagsArray)
        }
        const { data: contacts, error: contactsError } = await query

        if (contactsError) {
            return { error: 'Error fetching contacts for campaign' }
        }
        if (contacts) {
            finalContactIds = contacts.map(c => c.id)
        }
    }

    if (finalContactIds.length === 0) {
        return { success: true, warning: 'No contacts matched filters or import failed' }
    }

    // Insert messages
    const messages = finalContactIds.map(cid => ({
        campaign_id: campaign.id,
        contact_id: cid,
        status: 'pending'
    }))

    // Batch insert 
    const chunkSize = 100
    for (let i = 0; i < messages.length; i += chunkSize) {
        const { error } = await supabase.from('campaign_messages').insert(messages.slice(i, i + chunkSize))
        if (error) {
            console.error('Error creating campaign messages:', error)
        }
    }

    // Update status from draft to scheduled/processing
    await supabase.from('campaigns').update({
        status: scheduled_at ? 'scheduled' : 'processing',
        stats: { total: finalContactIds.length, sent: 0, failed: 0, pending: finalContactIds.length }
    }).eq('id', campaign.id)


    revalidatePath('/dashboard/email')
    revalidatePath('/dashboard/whatsapp')
    return { success: true }
}

export async function getOverviewStats(type?: 'email' | 'whatsapp') {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { count: contactsCount } = await supabase.from('contacts').select('*', { count: 'exact', head: true })

    let campaignsQuery = supabase.from('campaigns').select('*', { count: 'exact', head: true })
    if (type) {
        campaignsQuery = campaignsQuery.eq('type', type)
    }
    const { count: campaignsCount } = await campaignsQuery

    // For sent messages, this is harder as messages are linked to campaigns
    // We would need to join campaign_messages with campaigns table and filter by type
    // OR we can just sum the 'stats->sent' from campaigns table?
    // Let's rely on campaigns stats for faster query if possible, or do a join

    // Simple join approach (might be slow if millions)
    let messagesSent = 0
    if (type) {
        // Get all campaign IDs of that type
        const { data: campaigns } = await supabase.from('campaigns').select('id').eq('type', type)
        if (campaigns && campaigns.length > 0) {
            const ids = campaigns.map(c => c.id)
            const { count } = await supabase.from('campaign_messages')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'sent')
                .in('campaign_id', ids) // Limit this?
            messagesSent = count || 0
        }
    } else {
        const { count } = await supabase.from('campaign_messages').select('*', { count: 'exact', head: true }).eq('status', 'sent')
        messagesSent = count || 0
    }

    return {
        contacts: contactsCount || 0,
        campaigns: campaignsCount || 0,
        sent: messagesSent || 0
    }
}
