'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Download, FileText } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Event } from '@/types'
import { format } from 'date-fns'
import { PDFExportDialog } from './PDFExportDialog'

export function EventsExportButton({ events }: { events: Event[] }) {
    const [isPDFDialogOpen, setIsPDFDialogOpen] = useState(false)

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(events.map(e => ({
            Title: e.title,
            Category: e.category,
            Date: format(new Date(e.event_date), 'dd.MM.yyyy'),
            Start: e.start_time,
            End: e.end_time,
            Venue: e.venue,
            Organizer: e.organizer,
            Status: e.is_published ? 'Published' : 'Draft'
        })))
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Events')
        XLSX.writeFile(workbook, 'Events_Export.xlsx')
    }

    return (
        <div className="flex gap-2">
            <Button
                variant="outline"
                className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50"
                onClick={handleExportExcel}
            >
                <Download className="h-4 w-4" /> Excel
            </Button>
            <Button
                variant="outline"
                className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => setIsPDFDialogOpen(true)}
            >
                <FileText className="h-4 w-4" /> PDF
            </Button>

            <PDFExportDialog
                isOpen={isPDFDialogOpen}
                onClose={() => setIsPDFDialogOpen(false)}
                events={events}
            />
        </div>
    )
}
