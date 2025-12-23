import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { TicketsAgGrid } from '@/components/dashboard/TicketsAgGrid'
import { Ticket } from '@/types'

export const dynamic = 'force-dynamic'

export default async function TicketsPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Fetch tickets with joins (assuming relations are set or mocked)
    // Since we haven't strictly defined foreign keys in Supabase Types yet locally to TS, we use string queries
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
        *,
        events (title),
        profiles (name)
    `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error(error)
        return <div className="p-4 text-red-500">Error loading tickets. Please ensure the migration 'create_tickets.sql' has been run.</div>
    }

    // Transform data slightly to flatten for grid if needed, but AG Grid dot notation works on deep objects
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Tickets Management</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                {tickets && tickets.length > 0 ? (
                    <TicketsAgGrid tickets={tickets as any} />
                ) : (
                    <div className="text-center py-10 text-gray-500">No tickets found.</div>
                )}
            </div>
        </div>
    )
}
