import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { CalendarComponent } from '@/components/calendar/CalendarComponent'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: events } = await supabase.from('events').select('*')

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Calendar</h2>
            <CalendarComponent events={events || []} />
        </div>
    )
}
