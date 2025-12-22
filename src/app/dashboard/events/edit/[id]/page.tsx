import { EventForm } from '@/components/forms/EventForm'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

export default async function EditEventPage({ params }: { params: { id: string } }) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { id } = await params // Next.js 15: params is async

    const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

    if (!event) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Edit Event</h2>
                <p className="text-sm text-gray-500">Update event details.</p>
            </div>
            <div className="max-w-2xl">
                <EventForm initialData={event} />
            </div>
        </div>
    )
}
