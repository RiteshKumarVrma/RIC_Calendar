import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { count: totalEvents } = await supabase.from('events').select('*', { count: 'exact', head: true })
    const { count: publishedEvents } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_published', true)

    const { data: upcomingEvents } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(5)

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h2>
                <p className="text-sm text-gray-500">Overview of institute events.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                    <dt className="truncate text-sm font-medium text-gray-500">Total Events</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{totalEvents || 0}</dd>
                </div>
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                    <dt className="truncate text-sm font-medium text-gray-500">Published Events</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{publishedEvents || 0}</dd>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="p-6">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">Upcoming Events</h3>
                    <div className="mt-6 flow-root">
                        <ul role="list" className="-my-5 divide-y divide-gray-200">
                            {upcomingEvents?.map(event => (
                                <li key={event.id} className="py-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-900">{event.title}</p>
                                            <p className="truncate text-sm text-gray-500">
                                                {event.event_date ? format(new Date(event.event_date), 'PPP') : 'Date TBD'} at {event.start_time}
                                            </p>
                                        </div>
                                        <div>
                                            <Link
                                                href={`/dashboard/events/edit/${event.id}`}
                                                className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                            >
                                                Edit
                                            </Link>
                                        </div>
                                    </div>
                                </li>
                            ))}
                            {!upcomingEvents?.length && (
                                <li className="py-4 text-sm text-gray-500">No upcoming events.</li>
                            )}
                        </ul>
                    </div>
                    <div className="mt-6 border-t border-gray-100 pt-6">
                        <Link href="/dashboard/events/add" className="text-sm font-semibold leading-6 text-indigo-600 hover:text-indigo-500 flex items-center">
                            <Plus className="mr-2 h-4 w-4" />
                            Create new event <span aria-hidden="true"> &rarr;</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
