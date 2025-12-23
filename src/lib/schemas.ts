import { z } from 'zod'

export const agendaItemSchema = z.object({
    time: z.string().min(1, "Time is required"),
    activity: z.string().min(1, "Activity is required")
})

export const eventSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    event_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
    start_time: z.string(),
    end_time: z.string(),
    venue: z.string().min(3, 'Venue is required'),
    category: z.enum([
        'Theatre Plays',
        'Dance & Music Events',
        'Talks & Seminars',
        'Exhibitions',
        'Master class / Workshops',
        'Film Festival',
        'Other'
    ]),
    organizer: z.string().min(3, 'Organizer is required'),
    is_published: z.boolean().default(false),
    poster_url: z.string().nullable().optional(),
    agenda: z.array(agendaItemSchema).optional()
})

export type EventFormValues = z.infer<typeof eventSchema>
