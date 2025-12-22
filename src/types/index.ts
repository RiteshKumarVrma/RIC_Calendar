export type Role = 'super_admin' | 'institute_admin' | 'staff' | 'viewer'

export interface Profile {
    id: string
    name: string | null
    role: Role
    created_at: string
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
    created_by: string
    created_at: string
}
