import Link from 'next/link'
import { Plus, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Event } from '@/types'
import { Button } from '@/components/ui/Button'
import { EventsTable } from '@/components/dashboard/EventsTable'
import { EventsExportButton } from '@/components/dashboard/EventsExportButton'
import { EventsTabFilter } from '@/components/dashboard/EventsTabFilter'

export const dynamic = 'force-dynamic'

export default async function EventsPage({
    searchParams,
}: {
    searchParams: { filter?: string }
}) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const filter = (await searchParams).filter || 'all'

    let query = supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })

    const { data: allDataRaw, error: err } = await query

    if (err) {
        return <div>Error loading events</div>
    }

    const allData = allDataRaw as Event[]

    // Client-side filtering for simplicity and to handle "Completed" (date-based) easily
    // Or we could do more distinct server filters, but list size is likely manageable.
    let filteredEvents = allData

    if (filter === 'published') {
        filteredEvents = allData.filter(e => e.is_published)
    } else if (filter === 'draft') {
        filteredEvents = allData.filter(e => !e.is_published)
    } else if (filter === 'completed') {
        filteredEvents = allData.filter(e => new Date(e.event_date) < new Date())
    }

    const totalEvents = allData.length
    const completedEvents = allData.filter(e => new Date(e.event_date) < new Date()).length
    const inProcessEvents = totalEvents - completedEvents

    return (
        <div className="space-y-6">

            {/* Page Title */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">Events</h2>
                <EventsExportButton events={filteredEvents} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="bg-white p-6 rounded-lg shadow-sm flex items-center border-l-4 border-blue-600">
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{totalEvents.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Total Events</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm flex items-center border-l-4 border-green-500">
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{completedEvents.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Completed events</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm flex items-center border-l-4 border-yellow-500">
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{inProcessEvents.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">In Process</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">

                {/* Tabs and Actions Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">

                    {/* Tabs */}
                    <EventsTabFilter />

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/events/add">
                            <Button className="bg-[#2d5bff] hover:bg-blue-700 text-white flex items-center gap-2">
                                <Plus className="h-4 w-4" /> CREATE EVENT
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* TanStack Table */}
                <EventsTable data={filteredEvents} />

            </div>
        </div>
    )
}
