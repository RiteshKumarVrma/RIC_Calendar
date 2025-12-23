'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventSchema, type EventFormValues } from '@/lib/schemas'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { createEvent, updateEvent } from '@/app/dashboard/events/actions'
import { Event } from '@/types'
import { Plus, Trash } from 'lucide-react'

type EventFormProps = {
    initialData?: Event
}

export function EventForm({ initialData }: EventFormProps) {
    const {
        register,
        control,
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
            category: initialData.category as any,
            organizer: initialData.organizer,
            is_published: initialData.is_published,
            poster_url: initialData.poster_url || '',
            agenda: initialData.agenda || []
        } : {
            agenda: []
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "agenda"
    })

    const onSubmit = async (data: EventFormValues) => {
        try {
            const formData = new FormData()
            const appendFd = (k: string, v: any) => {
                if (v !== undefined && v !== null) formData.append(k, v.toString())
            }

            appendFd('title', data.title)
            appendFd('description', data.description || '')
            appendFd('event_date', data.event_date)
            appendFd('start_time', data.start_time)
            appendFd('end_time', data.end_time)
            appendFd('venue', data.venue)
            appendFd('category', data.category)
            appendFd('organizer', data.organizer)
            if (data.is_published) formData.append('is_published', 'on')

            // Serialize agenda to string for form data
            if (data.agenda) {
                formData.append('agenda', JSON.stringify(data.agenda))
            }

            let result
            if (initialData) {
                result = await updateEvent(initialData.id, formData)
            } else {
                result = await createEvent(formData)
            }

            if (result?.error) {
                alert(`Error: ${result.error}`)
            }
        } catch (e) {
            console.error('Form submission error:', e)
            alert('An unexpected error occurred.')
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl bg-white p-6 rounded-lg shadow">

            {/* Basic Info Section */}
            <div className="space-y-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2">Event Details</h3>

                <div>
                    <Label htmlFor="title">Event Title</Label>
                    <div className="mt-2">
                        <Input id="title" {...register('title')} placeholder="e.g. Reflet - Performance from France" />
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

                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="venue">Venue</Label>
                        <div className="mt-2">
                            <Input id="venue" {...register('venue')} placeholder="e.g. Main Audi" />
                            {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue.message}</p>}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="category">Category</Label>
                        <div className="mt-2">
                            <select
                                id="category"
                                {...register('category')}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            >
                                <option value="">Select Category</option>
                                <option value="Theatre Plays">Theatre Plays</option>
                                <option value="Dance & Music Events">Dance & Music Events</option>
                                <option value="Talks & Seminars">Talks & Seminars</option>
                                <option value="Exhibitions">Exhibitions</option>
                                <option value="Master class / Workshops">Master class / Workshops</option>
                                <option value="Film Festival">Film Festival</option>
                                <option value="Other">Other</option>
                            </select>
                            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                        </div>
                    </div>
                </div>

                <div>
                    <Label htmlFor="organizer">Organizer / Presented By</Label>
                    <div className="mt-2">
                        <Input id="organizer" {...register('organizer')} placeholder="e.g. RIC in collaboration with..." />
                        {errors.organizer && <p className="text-red-500 text-xs mt-1">{errors.organizer.message}</p>}
                    </div>
                </div>

                <div>
                    <Label htmlFor="description">Description & Performers</Label>
                    <div className="mt-2">
                        <textarea
                            id="description"
                            rows={5}
                            {...register('description')}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
                            placeholder="Detailed description, list of performers (e.g. Dr. Alka Pande, Mr. Shail Choyal), etc."
                        />
                    </div>
                </div>
            </div>

            {/* Agenda Section */}
            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Agenda / Schedule</h3>
                    <Button type="button" onClick={() => append({ time: '', activity: '' })} variant="outline" className="text-xs">
                        <Plus className="h-3 w-3 mr-1" /> Add Slot
                    </Button>
                </div>

                <div className="space-y-3">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-x-2 items-start">
                            <div className="w-1/3">
                                <Input
                                    placeholder="Time (e.g. 05:30 PM)"
                                    {...register(`agenda.${index}.time` as const)}
                                />
                                {errors.agenda?.[index]?.time && <p className="text-red-500 text-xs">{errors.agenda[index]?.time?.message}</p>}
                            </div>
                            <div className="w-full">
                                <Input
                                    placeholder="Activity (e.g. High Tea)"
                                    {...register(`agenda.${index}.activity` as const)}
                                />
                                {errors.agenda?.[index]?.activity && <p className="text-red-500 text-xs">{errors.agenda[index]?.activity?.message}</p>}
                            </div>
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="p-2 text-red-500 hover:text-red-700"
                            >
                                <Trash className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {fields.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No agenda slots added. Use this for detailed timelines (e.g. High Tea, Q-A Session).</p>
                    )}
                </div>
            </div>

            <div className="relative flex gap-x-3 pt-4 border-t">
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
