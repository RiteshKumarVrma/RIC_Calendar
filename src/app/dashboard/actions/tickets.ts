'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function bookTicket(eventId: string, guestCount: number) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'You must be logged in to book a ticket.' }
    }

    // Check if user already has a ticket for this event
    const { data: existingTicket } = await supabase
        .from('tickets')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()

    if (existingTicket) {
        return { error: 'You have already booked a ticket for this event.' }
    }

    // Create unique ticket code (Simple Implementation)
    const ticketCode = `TCK-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`

    const { error } = await supabase.from('tickets').insert({
        event_id: eventId,
        user_id: user.id,
        ticket_code: ticketCode,
        status: 'confirmed',
        guest_count: guestCount
    })

    if (error) {
        console.error('Booking error:', error)
        return { error: 'Failed to book ticket.' }
    }

    revalidatePath('/dashboard/events')
    revalidatePath(`/dashboard/events/${eventId}`)
    revalidatePath('/dashboard/tickets')

    return { success: true }
}
