export type Role = 'super_admin' | 'institute_admin' | 'staff' | 'viewer'

export interface Profile {
    id: string
    name: string | null
    role: Role
    created_at: string
}

export interface AgendaItem {
    time: string
    activity: string
}

export type Ticket = {
    id: string
    event_id: string
    user_id: string
    ticket_code: string
    status: 'confirmed' | 'cancelled' | 'checked_in'
    created_at: string
    events?: Event // Join
    profiles?: Profile // Join
}

export interface Event {
    id: string
    title: string
    description: string | null
    event_date: string // YYYY-MM-DD
    start_time: string // HH:MM:SS
    end_time: string // HH:MM:SS
    venue: string
    category: string
    organizer: string
    poster_url: string | null
    is_published: boolean
    agenda: AgendaItem[] | null // New field
    created_by: string
    created_at: string
}
