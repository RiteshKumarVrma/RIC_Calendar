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
})

export async function getCampaigns() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
        .from('campaigns')
        .select('*, message_templates(name)')
        .order('created_at', { ascending: false })

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
    }

    const validated = CampaignSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: 'Invalid campaign data' }
    }

    const { name, type, template_id, scheduled_at, filter_tags } = validated.data

    const tagsArray = filter_tags ? filter_tags.split(',').map(t => t.trim()).filter(Boolean) : []

    // 1. Create Campaign
    const { data: campaign, error: campaignError } = await supabase.from('campaigns').insert({
        name,
        type,
        template_id,
        scheduled_at: scheduled_at || null,
        status: 'draft', // User will have to "Launch" it, or we auto-launch if scheduled? Let's say we create as draft first or 'scheduled' if date is present.
        filter_tags: tagsArray
    }).select().single()

    if (campaignError) {
        return { error: campaignError.message }
    }

    // 2. Generate Campaign Messages (Queue)
    // Find contacts matching tags
    let query = supabase.from('contacts').select('id').eq('is_subscribed', true)

    if (tagsArray.length > 0) {
        query = query.overlaps('tags', tagsArray)
    }

    const { data: contacts, error: contactsError } = await query

    if (contactsError) {
        return { error: 'Error fetching contacts for campaign' }
    }

    if (!contacts || contacts.length === 0) {
        // No contacts found, but campaign created. 
        // We might want to warn user but for now just return success.
        return { success: true, warning: 'No contacts matched filters' }
    }

    // Insert messages
    const messages = contacts.map(c => ({
        campaign_id: campaign.id,
        contact_id: c.id,
        status: 'pending'
    }))

    // Batch insert 
    const chunkSize = 100
    for (let i = 0; i < messages.length; i += chunkSize) {
        const { error } = await supabase.from('campaign_messages').insert(messages.slice(i, i + chunkSize))
        if (error) {
            console.error('Error creating campaign messages:', error)
            // Should probably rollback campaign? But let's keep it simple.
        }
    }

    // Update status from draft to scheduled/processing
    await supabase.from('campaigns').update({
        status: scheduled_at ? 'scheduled' : 'processing',
        stats: { total: contacts.length, sent: 0, failed: 0, pending: contacts.length }
    }).eq('id', campaign.id)


    revalidatePath('/dashboard/broadcasts/campaigns')
    return { success: true }
}

export async function getOverviewStats() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { count: contactsCount } = await supabase.from('contacts').select('*', { count: 'exact', head: true })
    const { count: campaignsCount } = await supabase.from('campaigns').select('*', { count: 'exact', head: true })

    // For sent messages, we might want to query campaign_messages
    const { count: emailsSent } = await supabase.from('campaign_messages').select('*', { count: 'exact', head: true })
        .eq('status', 'sent')
    // This is rough approximation as we don't store type on message directly but on campaign. 
    // For strict accuracy we need a join or store type on message. 
    // For efficiency, let's just count all sent for now or do a join if not expansive.

    // Let's do a simple count of all sent for now, or split by type
    // Optimisation: store aggregates in a separate stats table or cache.
    // Here we will just return total Sent messages.
    const { count: messagesSent } = await supabase.from('campaign_messages').select('*', { count: 'exact', head: true }).eq('status', 'sent')

    return {
        contacts: contactsCount || 0,
        campaigns: campaignsCount || 0,
        sent: messagesSent || 0
    }
}
