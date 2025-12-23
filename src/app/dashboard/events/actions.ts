'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { eventSchema } from '@/lib/schemas'

export async function createEvent(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const rawData: any = {
        title: formData.get('title'),
        description: formData.get('description'),
        event_date: formData.get('event_date'),
        start_time: formData.get('start_time'),
        end_time: formData.get('end_time'),
        venue: formData.get('venue'),
        category: formData.get('category'),
        organizer: formData.get('organizer'),
        is_published: formData.get('is_published') === 'on',
        poster_url: formData.get('poster_url') || null,
    }

    // Parse Agenda
    const agendaJson = formData.get('agenda') as string
    if (agendaJson) {
        try {
            rawData.agenda = JSON.parse(agendaJson)
        } catch (e) {
            rawData.agenda = []
        }
    }

    const result = eventSchema.safeParse(rawData)

    if (!result.success) {
        console.log(result.error)
        return { error: 'Validation failed' }
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase.from('events').insert({
        ...result.data,
        created_by: user.id,
    })

    if (error) {
        console.error('Error creating event:', error)
        return { error: 'Failed to create event' }
    }

    revalidatePath('/dashboard/events')
    revalidatePath('/dashboard/calendar')
    redirect('/dashboard/events')
}

export async function updateEvent(id: string, formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const rawData: any = {
        title: formData.get('title'),
        description: formData.get('description'),
        event_date: formData.get('event_date'),
        start_time: formData.get('start_time'),
        end_time: formData.get('end_time'),
        venue: formData.get('venue'),
        category: formData.get('category'),
        organizer: formData.get('organizer'),
        is_published: formData.get('is_published') === 'on',
        poster_url: formData.get('poster_url') || null,
    }

    // Parse Agenda
    const agendaJson = formData.get('agenda') as string
    if (agendaJson) {
        try {
            rawData.agenda = JSON.parse(agendaJson)
        } catch (e) {
            rawData.agenda = []
        }
    }

    const result = eventSchema.safeParse(rawData)

    if (!result.success) {
        return { error: 'Validation failed' }
    }

    const { error } = await supabase.from('events').update(result.data).eq('id', id)

    if (error) {
        console.error('Error updating event:', error)
        return { error: 'Failed to update event' }
    }

    revalidatePath('/dashboard/events')
    revalidatePath('/dashboard/calendar')
    redirect('/dashboard/events')
}

export async function deleteEvent(id: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.from('events').delete().eq('id', id)

    if (error) {
        return { error: 'Failed to delete event' }
    }

    revalidatePath('/dashboard/events')
    revalidatePath('/dashboard/calendar')
}
