import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, MapPin, User, ArrowLeft } from 'lucide-react'

export async function generateMetadata({ params }: { params: { id: string } }) {
    const { id } = await params
    // Fetch title for SEO
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
                            <span className="rounded-full bg-indigo-50 px-3 py-1.5 font-medium text-indigo-600">{event.category}</span>
                        </div>
                        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{event.title}</h1>
                        <div className="mt-6 flex flex-col gap-y-4 text-sm text-gray-700">
                            <div className="flex items-center">
                                <Calendar className="mr-2 h-5 w-5 text-gray-400" />
                                <span className="font-medium text-gray-900 mr-1">Date:</span>
                                {event.event_date ? format(new Date(event.event_date), 'PPP') : 'TBA'} at {event.start_time} - {event.end_time}
                            </div>
                            <div className="flex items-center">
                                <MapPin className="mr-2 h-5 w-5 text-gray-400" />
                                <span className="font-medium text-gray-900 mr-1">Venue:</span>
                                {event.venue}
                            </div>
                            <div className="flex items-center">
                                <User className="mr-2 h-5 w-5 text-gray-400" />
                                <span className="font-medium text-gray-900 mr-1">Organizer:</span>
                                {event.organizer}
                            </div>
                        </div>

                        <div className="mt-10 border-t border-gray-200 pt-10">
                            <h3 className="text-lg font-medium text-gray-900">Description</h3>
                            <div className="mt-4 prose text-gray-500">
                                <p className="whitespace-pre-wrap">{event.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Optional: Poster Image Section */}
                    {event.poster_url && (
                        <div className="bg-gray-50 lg:block flex items-center justify-center p-8">
                            {/* Use next/image for production, but simple img tag for external Supabase storage URL */}
                            <img
                                src={event.poster_url}
                                alt={event.title}
                                className="w-full max-w-md rounded-lg shadow-md object-cover"
                            />
                        </div>
                    )}
                    {!event.poster_url && (
                        <div className="bg-gray-100 flex items-center justify-center p-8 text-gray-400">
                            <span className="text-lg">No Poster Available</span>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
