import { z } from 'zod'

export const eventSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    event_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
    start_time: z.string(),
    end_time: z.string(),
    venue: z.string().min(3, 'Venue is required'),
    category: z.string().min(1, 'Category is required'),
    organizer: z.string().min(3, 'Organizer is required'),
    is_published: z.boolean().default(false),
    poster_url: z.string().optional(),
})

export type EventFormValues = z.infer<typeof eventSchema>
