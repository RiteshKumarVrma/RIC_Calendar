'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { bookTicket } from '@/app/dashboard/actions/tickets'
import { Ticket } from 'lucide-react'

export function BookingButton({ eventId }: { eventId: string }) {
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [guests, setGuests] = useState(0)

    const handleBook = async () => {
        setLoading(true)
        const result = await bookTicket(eventId, guests)
        setLoading(false)

        if (result.error) {
            alert(result.error)
        } else {
            alert('Ticket booked successfully! Check the Tickets tab.')
            setIsOpen(false)
        }
    }

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="bg-[#2d5bff] hover:bg-blue-700 text-white flex items-center gap-2"
            >
                <Ticket className="h-4 w-4" /> Book Ticket
            </Button>
        )
    }

    return (
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 animate-in fade-in zoom-in duration-300">
            <h4 className="font-semibold text-gray-800 mb-2">Confirm Booking</h4>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Guests (Optional)
                </label>
                <input
                    type="number"
                    min="0"
                    max="10"
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
            </div>

            <div className="flex gap-2 justify-end">
                <Button
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    disabled={loading}
                    className="text-gray-600 hover:text-gray-900"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleBook}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    {loading ? 'Booking...' : 'Confirm'}
                </Button>
            </div>
        </div>
    )
}
