import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function PublicEventsPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .order('event_date', { ascending: true })

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight text-indigo-600">Institute Events</h1>
                    <Link href="/auth/login" className="text-sm font-semibold leading-6 text-gray-900 border px-4 py-2 rounded-md hover:bg-gray-50">Log in &rarr;</Link>
                </div>
            </header>
            <main>
                <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {events?.map(event => (
                            <div key={event.id} className="overflow-hidden rounded-lg bg-white shadow hover:shadow-lg transition flex flex-col h-full">
                                <div className="p-6 flex-1">
                                    <div className="flex items-center gap-x-4 text-xs mb-4">
                                        <time dateTime={event.event_date} className="text-gray-500 font-medium">
                                            {event.event_date ? format(new Date(event.event_date), 'PPP') : 'TBA'}
                                        </time>
                                        <span className="relative z-10 rounded-full bg-indigo-50 px-3 py-1.5 font-medium text-indigo-600">{event.category}</span>
                                    </div>
                                    <div className="group relative">
                                        <h3 className="mt-3 text-xl font-semibold leading-6 text-gray-900 group-hover:text-indigo-600">
                                            <Link href={`/events/${event.id}`}>
                                                <span className="absolute inset-0" />
                                                {event.title}
                                            </Link>
                                        </h3>
                                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">{event.description}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 mt-auto">
                                    <div className="text-sm text-gray-500">
                                        <span className="font-medium">Venue:</span> {event.venue}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!events || events.length === 0) && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No upcoming events published yet.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
