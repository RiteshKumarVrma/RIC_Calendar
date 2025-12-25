import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { TicketsTable } from '@/components/dashboard/TicketsTable'
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

    const totalTickets = tickets ? tickets.length : 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-2xl font-semibold text-gray-800">Tickets Management</h2>
            </div>

            {/* Summary Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Total Tickets Booked</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{totalTickets}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {tickets && tickets.length > 0 ? (
                    <TicketsTable tickets={tickets as any} />
                ) : (
                    <div className="text-center py-10 text-gray-500">No tickets found.</div>
                )}
            </div>
        </div>
    )
}
