'use client'

import { Button } from '@/components/ui/Button'
import { Download, FileText } from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Event } from '@/types'
import { format } from 'date-fns'
import { useSearchParams } from 'next/navigation'

// Colors representing the categories from the image
// Using simpler array format for RGB
const categoryColors: Record<string, [number, number, number]> = {
    'Theatre Plays': [255, 204, 153], // Pinkish/Orange buffer
    'Dance & Music Events': [153, 204, 0], // Green
    'Talks & Seminars': [153, 204, 255], // Blue
    'Exhibitions': [255, 255, 153], // Yellow
    'Master class /Lecture / Workshops/Others': [204, 153, 255], // Purple
    'Film Festival': [204, 255, 255], // Cyan
    'default': [245, 245, 245] // Light Gray default
}

const getCategoryColor = (category: string) => {
    // Simple partial match or exact match case insensitive
    const catLower = category.toLowerCase()
    const key = Object.keys(categoryColors).find(k => {
        if (k === 'default') return false
        // Check if the long category string from map is inside the event category or vice versa
        // Actually the map keys are likely the "official" ones.
        return catLower.includes(k.toLowerCase()) || k.toLowerCase().includes(catLower)
    })
    return categoryColors[key || 'default']
}

export function EventsExportButton({ events }: { events: Event[] }) {

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

    const handleExportPDF = () => {
        const doc = new jsPDF()

        // Title
        doc.setFontSize(16)
        doc.text("Rajasthan International Centre", 105, 15, { align: "center" })
        doc.setFontSize(14)
        doc.setTextColor(200, 0, 0)
        doc.text("Calendar of Events", 105, 22, { align: "center" })

        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        doc.text(`As on ${format(new Date(), 'dd.MM.yyyy')}`, 105, 30, { align: "center" })

        const tableData = events.map((e, index) => [
            index + 1,
            `${format(new Date(e.event_date), 'EEEE')}\n${format(new Date(e.event_date), 'dd.MM.yyyy')}\n\n${e.start_time.slice(0, 5)} TO\n${e.end_time.slice(0, 5)}`,
            `${e.title}\n\n${e.description || '-'}`,
            e.venue
        ])

        autoTable(doc, {
            head: [['S.N.', 'DAY, DATE &\nTIME', 'EVENT', 'VENUE']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 4,
                valign: 'middle',
                lineWidth: 0.1,
                lineColor: [0, 0, 0],
                textColor: [0, 0, 0]
            },
            headStyles: {
                fillColor: [220, 220, 220],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },
                1: { cellWidth: 35, halign: 'center' },
                2: { cellWidth: 'auto' },
                3: { cellWidth: 30, halign: 'center' }
            },
            didParseCell: function (data) {
                if (data.section === 'body') {
                    const rowEvent = events[data.row.index]
                    const color = getCategoryColor(rowEvent.category || '')
                    data.cell.styles.fillColor = color
                }
            }
        })

        doc.save('Events_Calendar.pdf')
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
                onClick={handleExportPDF}
            >
                <FileText className="h-4 w-4" /> PDF
            </Button>
        </div>
    )
}
