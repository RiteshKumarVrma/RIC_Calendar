import { EventForm } from '@/components/forms/EventForm'

export default function AddEventPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Add New Event</h2>
                <p className="text-sm text-gray-500">Create a new event for the institute.</p>
            </div>
            <div className="max-w-2xl">
                <EventForm />
            </div>
        </div>
    )
}
