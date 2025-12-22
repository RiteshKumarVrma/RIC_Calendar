'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventSchema, type EventFormValues } from '@/lib/schemas'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { createEvent, updateEvent } from '@/app/dashboard/events/actions'
import { Event } from '@/types'

type EventFormProps = {
    initialData?: Event
}

export function EventForm({ initialData }: EventFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        defaultValues: initialData ? {
            title: initialData.title,
            description: initialData.description || '',
            event_date: initialData.event_date,
            start_time: initialData.start_time,
            end_time: initialData.end_time,
            venue: initialData.venue,
            category: initialData.category,
            organizer: initialData.organizer,
            is_published: initialData.is_published,
            poster_url: initialData.poster_url || '',
        } : undefined
    })

    const onSubmit = async (data: EventFormValues) => {
        const formData = new FormData()
        const append = (k: string, v: any) => {
            if (v !== undefined && v !== null) formData.append(k, v.toString())
        }

        append('title', data.title)
        append('description', data.description || '')
        append('event_date', data.event_date)
        append('start_time', data.start_time)
        append('end_time', data.end_time)
        append('venue', data.venue)
        append('category', data.category)
        append('organizer', data.organizer)
        if (data.is_published) formData.append('is_published', 'on')

        if (initialData) {
            await updateEvent(initialData.id, formData)
        } else {
            await createEvent(formData)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl bg-white p-6 rounded-lg shadow">
            <div>
                <Label htmlFor="title">Event Title</Label>
                <div className="mt-2">
                    <Input id="title" {...register('title')} />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                <div>
                    <Label htmlFor="event_date">Date</Label>
                    <div className="mt-2">
                        <Input id="event_date" type="date" {...register('event_date')} />
                        {errors.event_date && <p className="text-red-500 text-xs mt-1">{errors.event_date.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="start_time">Start Time</Label>
                        <div className="mt-2">
                            <Input id="start_time" type="time" {...register('start_time')} />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="end_time">End Time</Label>
                        <div className="mt-2">
                            <Input id="end_time" type="time" {...register('end_time')} />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <Label htmlFor="venue">Venue</Label>
                <div className="mt-2">
                    <Input id="venue" {...register('venue')} />
                    {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                <div>
                    <Label htmlFor="category">Category</Label>
                    <div className="mt-2">
                        <select
                            id="category"
                            {...register('category')}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        >
                            <option value="">Select Category</option>
                            <option value="Seminar">Seminar</option>
                            <option value="Workshop">Workshop</option>
                            <option value="Cultural">Cultural</option>
                            <option value="Exhibition">Exhibition</option>
                            <option value="Conference">Conference</option>
                        </select>
                        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                    </div>
                </div>

                <div>
                    <Label htmlFor="organizer">Organizer</Label>
                    <div className="mt-2">
                        <Input id="organizer" {...register('organizer')} />
                        {errors.organizer && <p className="text-red-500 text-xs mt-1">{errors.organizer.message}</p>}
                    </div>
                </div>
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <div className="mt-2">
                    <textarea
                        id="description"
                        rows={3}
                        {...register('description')}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
                    />
                </div>
            </div>

            <div className="relative flex gap-x-3">
                <div className="flex h-6 items-center">
                    <input
                        id="is_published"
                        type="checkbox"
                        {...register('is_published')}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                </div>
                <div className="text-sm leading-6">
                    <label htmlFor="is_published" className="font-medium text-gray-900">
                        Publish Event
                    </label>
                    <p className="text-gray-500">Visible to public immediately.</p>
                </div>
            </div>

            <div>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? 'Saving...' : initialData ? 'Update Event' : 'Save Event'}
                </Button>
            </div>
        </form>
    )
}
