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
        case 'Theatre Plays': return '#EC4899'; // Pink
        case 'Dance & Music Events': return '#10B981'; // Green
        case 'Talks & Seminars': return '#3B82F6'; // Blue
        case 'Exhibitions': return '#F59E0B'; // Amber
        case 'Master class / Workshops': return '#8B5CF6'; // Purple
        case 'Film Festival': return '#06B6D4'; // Cyan
        default: return '#6B7280'; // Gray
    }
}
