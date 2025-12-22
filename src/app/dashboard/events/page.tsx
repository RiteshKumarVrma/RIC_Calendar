import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Event } from '@/types'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })

    if (error) {
        console.error('Error fetching events:', error)
        return <div>Error loading events</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Events</h2>
                <Link href="/dashboard/events/add">
                    <Button className="flex items-center gap-x-2">
                        <Plus className="h-4 w-4" />
                        Add Event
                    </Button>
                </Link>
            </div>

            <div className="overflow-hidden bg-white shadow sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {(events as Event[])?.map((event) => (
                        <li key={event.id}>
                            <div className="block hover:bg-gray-50">
                                <div className="flex items-center px-4 py-4 sm:px-6">
                                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div className="truncate">
                                            <div className="flex text-sm">
                                                <p className="font-medium text-indigo-600 truncate">{event.title}</p>
                                                <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                                                    in {event.category}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    {event.event_date ? format(new Date(event.event_date), 'PPP') : 'No Date'} at {event.start_time}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                                            <p className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${event.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {event.is_published ? 'Published' : 'Draft'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="ml-5 flex-shrink-0">
                                        <Link href={`/dashboard/events/edit/${event.id}`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                                            Edit
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {events?.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            No events found. Get started by adding one.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    )
}
