'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Event } from '@/types'
import { useRouter } from 'next/navigation'

export function CalendarComponent({ events }: { events: Event[] }) {
    const router = useRouter()

    // Map events
    const calendarEvents = events.map(e => ({
        id: e.id,
        title: e.title,
        start: e.event_date ? `${e.event_date}T${e.start_time}` : undefined,
        end: e.event_date ? `${e.event_date}T${e.end_time}` : undefined,
        backgroundColor: getColor(e.category),
        borderColor: getColor(e.category),
        extendedProps: {
            category: e.category,
        }
    }))

    const handleEventClick = (info: any) => {
        router.push(`/dashboard/events/edit/${info.event.id}`)
    }

    return (
        <div className="bg-white p-4 rounded shadow h-[80vh]">
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={calendarEvents}
                eventClick={handleEventClick}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth'
                }}
                height="100%"
            />
        </div>
    )
}

function getColor(category: string) {
    switch (category) {
        case 'Seminar': return '#4F46E5'; // indigo
        case 'Workshop': return '#10B981'; // green
        case 'Cultural': return '#EC4899'; // pink
        case 'Exhibition': return '#F59E0B'; // amber
        case 'Conference': return '#3B82F6'; // blue
        default: return '#6B7280'; // gray
    }
}
