import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, MapPin, User, ArrowLeft, Clock } from 'lucide-react'
import { AgendaItem } from '@/types'
import { BookingButton } from '@/components/events/BookingButton'

export async function generateMetadata({ params }: { params: { id: string } }) {
    const { id } = await params
    return { title: 'Event Details' }
}

export default async function PublicEventDetailPage({ params }: { params: { id: string } }) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { id } = await params

    const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

    if (!event || !event.is_published) {
        notFound()
    }

    // Parse agenda if string (should be object from DB, but handle case)
    let agenda: AgendaItem[] = []
    if (event.agenda) {
        agenda = typeof event.agenda === 'string' ? JSON.parse(event.agenda) : event.agenda
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <Link href="/events" className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Events
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="overflow-hidden bg-white rounded-lg shadow-lg lg:grid lg:grid-cols-2 lg:gap-8">
                    <div className="p-8 lg:p-12">
                        <div className="flex items-center gap-x-4 text-xs">
                            <span className={`rounded-full px-3 py-1.5 font-medium ${getCategoryColor(event.category)}`}>
                                {event.category}
                            </span>
                        </div>
                        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{event.title}</h1>
                        <div className="mt-6 flex flex-col gap-y-4 text-sm text-gray-700">
                            <div className="flex items-center">
                                <Calendar className="mr-2 h-5 w-5 text-gray-400" />
                                <span className="font-medium text-gray-900 mr-1">Date:</span>
                                {event.event_date ? format(new Date(event.event_date), 'PPP') : 'TBA'}
                            </div>
                            <div className="flex items-center">
                                <Clock className="mr-2 h-5 w-5 text-gray-400" />
                                <span className="font-medium text-gray-900 mr-1">Time:</span>
                                {event.start_time} - {event.end_time}
                            </div>
                            <div className="flex items-center">
                                <MapPin className="mr-2 h-5 w-5 text-gray-400" />
                                <span className="font-medium text-gray-900 mr-1">Venue:</span>
                                {event.venue}
                            </div>
                            <div className="flex items-center">
                                <User className="mr-2 h-5 w-5 text-gray-400" />
                                <span className="font-medium text-gray-900 mr-1">Presented By:</span>
                                {event.organizer}
                            </div>
                        </div>

                        <div className="mt-10 border-t border-gray-200 pt-10">
                            <h3 className="text-lg font-medium text-gray-900">Description</h3>
                            <div className="mt-4 prose text-gray-500">
                                <p className="whitespace-pre-wrap">{event.description}</p>
                            </div>
                        </div>

                        <div className="mt-6 border-t pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Registration</h3>
                            </div>
                            {/* Add Booking Component */}
                            <BookingButton eventId={event.id} />
                        </div>

                        {/* Agenda Section */}
                        {agenda && agenda.length > 0 && (
                            <div className="mt-10 border-t border-gray-200 pt-10">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Agenda</h3>
                                <div className="flow-root">
                                    <ul role="list" className="-mb-8">
                                        {agenda.map((item, itemIdx) => (
                                            <li key={itemIdx}>
                                                <div className="relative pb-8">
                                                    {itemIdx !== agenda.length - 1 ? (
                                                        <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                                    ) : null}
                                                    <div className="relative flex space-x-3">
                                                        <div>
                                                            <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
                                                                <Clock className="h-4 w-4 text-white" aria-hidden="true" />
                                                            </span>
                                                        </div>
                                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                            <div>
                                                                <p className="font-medium text-gray-900">{item.activity}</p>
                                                            </div>
                                                            <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                                                <time>{item.time}</time>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Poster Section */}
                    <div className="bg-gray-50 flex items-center justify-center p-8 lg:h-full">
                        {event.poster_url ? (
                            <img
                                src={event.poster_url}
                                alt={event.title}
                                className="w-full max-w-md rounded-lg shadow-md object-cover max-h-[80vh]"
                            />
                        ) : (
                            <div className="text-gray-400 flex flex-col items-center">
                                <span className="text-lg">No Poster</span>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

function getCategoryColor(category: string) {
    switch (category) {
        case 'Theatre Plays': return 'bg-pink-100 text-pink-800';
        case 'Exhibitions': return 'bg-yellow-100 text-yellow-800';
        case 'Dance & Music Events': return 'bg-green-100 text-green-800';
        case 'Master class/ lecture / Workshops/Others': return 'bg-purple-100 text-purple-800';
        case 'Talks & Seminars': return 'bg-blue-100 text-blue-800';
        case 'Film Festival': return 'bg-cyan-100 text-cyan-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}
