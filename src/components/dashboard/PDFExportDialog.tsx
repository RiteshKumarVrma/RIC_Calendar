'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Event } from '@/types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, parseISO } from 'date-fns'
import { X, Calendar as CalendarIcon, CheckSquare, Palette, Save } from 'lucide-react'

// Default Colors
const defaultCategoryColors: Record<string, [number, number, number]> = {
    'Theatre Plays': [255, 204, 153],
    'Dance & Music Events': [153, 204, 0],
    'Talks & Seminars': [153, 204, 255],
    'Exhibitions': [255, 255, 153],
    'Master class /Lecture / Workshops / Others': [204, 153, 255],
    'Film Festival': [204, 255, 255],
    'default': [245, 245, 245]
}

// Helper to convert hex to rgb array
const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return [r, g, b]
}

// Helper to convert rgb array to hex
const rgbToHex = (rgb: [number, number, number]): string => {
    return "#" + rgb.map(x => x.toString(16).padStart(2, '0')).join('')
}

interface PDFExportDialogProps {
    isOpen: boolean
    onClose: () => void
    events: Event[]
}

export function PDFExportDialog({ isOpen, onClose, events }: PDFExportDialogProps) {
    // Customization State
    const [mainTitle, setMainTitle] = useState('Rajasthan International Centre')
    const [subTitle, setSubTitle] = useState('Calendar of Events (Revised)')
    const [subTitleColor, setSubTitleColor] = useState('#DC2626')
    const [additionalDetails, setAdditionalDetails] = useState('')
    const [showOrganizer, setShowOrganizer] = useState(true)

    // Selection State
    const [selectedMonth, setSelectedMonth] = useState<string>('all')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set(events.map(e => e.id)))

    // Color State
    const [customColors, setCustomColors] = useState(defaultCategoryColors)

    // Load saved settings
    useEffect(() => {
        const saved = localStorage.getItem('RIC_PDF_SETTINGS')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                // Only update if value exists to keep specific defaults if needed, 
                // but usually user wants full persistence.
                if (parsed.mainTitle) setMainTitle(parsed.mainTitle)
                if (parsed.subTitle) setSubTitle(parsed.subTitle)
                if (parsed.subTitleColor) setSubTitleColor(parsed.subTitleColor)
                // We don't overwrite additionalDetails here if we want dynamic month behavior, 
                // but let's stick to user preference or default. 
                // If the user saves a generic description, we load it.
                if (parsed.additionalDetails !== undefined) setAdditionalDetails(parsed.additionalDetails)
                if (parsed.customColors) setCustomColors(parsed.customColors)
                if (parsed.showOrganizer !== undefined) setShowOrganizer(parsed.showOrganizer)
            } catch (e) {
                console.error("Failed to parse saved settings", e)
            }
        }
    }, [])

    const handleSaveDefaults = () => {
        const settings = {
            mainTitle,
            subTitle,
            subTitleColor,
            additionalDetails,
            customColors,
            showOrganizer
        }
        localStorage.setItem('RIC_PDF_SETTINGS', JSON.stringify(settings))
        alert('Settings saved as default!')
    }

    // Derived Data
    const availableMonths = useMemo(() => {
        const months = new Set<string>()
        events.forEach(e => {
            const date = new Date(e.event_date)
            months.add(format(date, 'yyyy-MM'))
        })
        return Array.from(months).sort().reverse()
    }, [events])

    const availableCategories = useMemo(() => {
        const cats = new Set<string>()
        events.forEach(e => {
            if (e.category) cats.add(e.category)
        })
        return Array.from(cats).sort()
    }, [events])

    const filteredEvents = useMemo(() => {
        let filtered = events
        if (selectedMonth !== 'all') {
            filtered = filtered.filter(e => format(new Date(e.event_date), 'yyyy-MM') === selectedMonth)
        }
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(e => e.category === selectedCategory)
        }
        return filtered
    }, [events, selectedMonth, selectedCategory])

    // Effect to update Additional Details when month changes
    useEffect(() => {
        if (selectedMonth !== 'all') {
            const date = parseISO(`${selectedMonth}-01`)
            setAdditionalDetails(format(date, 'MMMM yyyy'))
        } else {
            // If "All" is selected, show range of visible events
            if (filteredEvents.length > 0) {
                const timestamps = filteredEvents.map(e => new Date(e.event_date).getTime())
                const minDate = new Date(Math.min(...timestamps))
                const maxDate = new Date(Math.max(...timestamps))

                const startStr = format(minDate, 'MMMM yyyy')
                const endStr = format(maxDate, 'MMMM yyyy')

                if (startStr === endStr) {
                    setAdditionalDetails(startStr)
                } else {
                    setAdditionalDetails(`${startStr} - ${endStr}`)
                }
            } else {
                setAdditionalDetails('')
            }
        }
    }, [selectedMonth, filteredEvents]) // Added filteredEvents to dependencies for 'all' case

    // Update selected events when filtering changes (optional, but good UX to default select visible)
    // actually, let's auto-select all filtered events when filter changes, otherwise user has to manually select new ones
    useEffect(() => {
        setSelectedEventIds(new Set(filteredEvents.map(e => e.id)))
    }, [filteredEvents])

    const finalEventsToExport = filteredEvents.filter(e => selectedEventIds.has(e.id))

    // Handlers
    const toggleEventSelection = (id: string) => {
        const newSet = new Set(selectedEventIds)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setSelectedEventIds(newSet)
    }

    const handleColorChange = (category: string, hex: string) => {
        setCustomColors(prev => ({
            ...prev,
            [category]: hexToRgb(hex)
        }))
    }

    const getCategoryColor = (category: string) => {
        const catLower = category.toLowerCase()
        const key = Object.keys(customColors).find(k => {
            if (k === 'default') return false
            return catLower.includes(k.toLowerCase()) || k.toLowerCase().includes(catLower)
        })
        return customColors[key || 'default']
    }

    const handleGeneratePDF = () => {
        const doc = new jsPDF()

        const [r, g, b] = hexToRgb(subTitleColor)

        // Header
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text(mainTitle, 105, 15, { align: "center" })

        doc.setFontSize(14)
        doc.setTextColor(r, g, b)
        doc.text(subTitle, 105, 23, { align: "center" })

        let currentY = 30

        // Additional Details
        if (additionalDetails) {
            doc.setFontSize(10)
            doc.setTextColor(80, 80, 80)
            const splitText = doc.splitTextToSize(additionalDetails, 180)
            doc.text(splitText, 105, currentY, { align: "center" })
            currentY += (splitText.length * 5) + 5
        }

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(`As on ${format(new Date(), 'dd.MM.yyyy')}`, 105, currentY, { align: "center" })
        currentY += 10

        // Legend
        const boxSize = 5
        let currentX = 15

        doc.setFontSize(9)
        doc.setTextColor(0, 0, 0)

        const legendItems = Object.keys(customColors).filter(k => k !== 'default')

        legendItems.forEach((category, i) => {
            const color = customColors[category]
            doc.setFillColor(color[0], color[1], color[2])
            doc.rect(currentX, currentY, boxSize, boxSize, 'F')
            doc.setDrawColor(0)
            doc.rect(currentX, currentY, boxSize, boxSize, 'S')
            doc.text(category, currentX + boxSize + 3, currentY + 4)

            if (i % 2 === 0) {
                currentX = 105
            } else {
                currentX = 15
                currentY += 8
            }
        })

        if (legendItems.length % 2 !== 0) {
            currentY += 8
        }

        const tableData = finalEventsToExport.map((e, index) => [
            index + 1,
            `${format(new Date(e.event_date), 'EEEE')}\n${format(new Date(e.event_date), 'dd.MM.yyyy')}\n\n${e.start_time.slice(0, 5)} TO\n${e.end_time.slice(0, 5)}`,
            `${e.title}\n\n${e.description || '-'}${showOrganizer ? `\n\nOrganizer: ${e.organizer}` : ''}`,
            e.venue
        ])

        autoTable(doc, {
            head: [['S.N.', 'DAY, DATE &\nTIME', 'EVENT', 'VENUE']],
            body: tableData,
            startY: currentY + 10,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 5,
                valign: 'middle',
                lineWidth: 0.1,
                lineColor: [0, 0, 0],
                textColor: [0, 0, 0]
            },
            headStyles: {
                fillColor: [200, 200, 200],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
                minCellHeight: 12
            },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },
                1: { cellWidth: 35, halign: 'center' },
                2: { cellWidth: 'auto' },
                3: { cellWidth: 30, halign: 'center' }
            },
            didParseCell: function (data) {
                if (data.section === 'body') {
                    const rowEvent = finalEventsToExport[data.row.index]
                    const color = getCategoryColor(rowEvent.category || '')
                    data.cell.styles.fillColor = color
                }
            }
        })

        doc.save('Events_Calendar.pdf')
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col relative animate-in fade-in zoom-in duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10">
                    <X className="h-6 w-6" />
                </button>

                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Export Management Tool</h2>
                    <p className="text-sm text-gray-500">Customize your PDF export details, selection, and appearance.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left Column: Settings */}
                    <div className="space-y-6">
                        {/* Header Settings */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Header Details</h3>
                            <div className="space-y-3">
                                <div>
                                    <Label>Main Title</Label>
                                    <Input value={mainTitle} onChange={e => setMainTitle(e.target.value)} className="mt-1 bg-white text-gray-900" />
                                </div>
                                <div>
                                    <Label>Sub Title</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input value={subTitle} onChange={e => setSubTitle(e.target.value)} className="bg-white text-gray-900" />
                                        <Input type="color" value={subTitleColor} onChange={e => setSubTitleColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                                    </div>
                                </div>
                                <div>
                                    <Label>Additional Description</Label>
                                    <textarea
                                        className="w-full mt-1 p-2 border rounded-md text-sm bg-white text-gray-900 min-h-[80px]"
                                        value={additionalDetails}
                                        onChange={e => setAdditionalDetails(e.target.value)}
                                        placeholder="Enter any extra details, notes, or disclaimers..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Filtering */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Filter & Select</h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Month</Label>
                                        <select
                                            className="w-full mt-1 p-2 border rounded-md text-sm bg-white text-gray-900"
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                        >
                                            <option value="all">All Months</option>
                                            {availableMonths.map(m => (
                                                <option key={m} value={m}>{format(parseISO(`${m}-01`), 'MMM yyyy')}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Category</Label>
                                        <select
                                            className="w-full mt-1 p-2 border rounded-md text-sm bg-white text-gray-900"
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                        >
                                            <option value="all">All Categories</option>
                                            {availableCategories.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-2 bg-white">
                                    <div className="flex items-center justify-between pb-2 border-b mb-2">
                                        <span className="text-xs font-medium text-gray-500">{filteredEvents.length} events found</span>
                                        <button
                                            onClick={() => {
                                                if (selectedEventIds.size === filteredEvents.length) setSelectedEventIds(new Set())
                                                else setSelectedEventIds(new Set(filteredEvents.map(e => e.id)))
                                            }}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            {selectedEventIds.size === filteredEvents.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    {filteredEvents.map(event => (
                                        <div key={event.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded text-sm">
                                            <input
                                                type="checkbox"
                                                checked={selectedEventIds.has(event.id)}
                                                onChange={() => toggleEventSelection(event.id)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-800 line-clamp-1">{event.title}</p>
                                                <p className="text-xs text-gray-500">{format(new Date(event.event_date), 'dd MMM')} • {event.category}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Colors & Preview(ish) */}
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Palette className="h-4 w-4" /> Category Colors</h3>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {Object.keys(defaultCategoryColors).filter(k => k !== 'default').map(cat => (
                                    <div key={cat} className="flex items-center justify-between bg-white p-2 rounded shadow-sm">
                                        <span className="text-sm text-gray-600 truncate max-w-[200px]" title={cat}>{cat}</span>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="color"
                                                value={rgbToHex(customColors[cat] || defaultCategoryColors[cat])}
                                                onChange={(e) => handleColorChange(cat, e.target.value)}
                                                className="w-16 h-8 p-1 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h3 className="font-semibold text-blue-800 mb-2">Summary</h3>
                            <ul className="text-sm text-blue-600 space-y-1">
                                <li>• Title: {mainTitle}</li>
                                <li>• Additional Text: {additionalDetails ? 'Yes' : 'No'}</li>
                                <li>• Events Selected: {finalEventsToExport.length}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t flex justify-between gap-3 bg-gray-50 rounded-b-lg">
                    <Button variant="ghost" onClick={handleSaveDefaults} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                        <Save className="h-4 w-4" /> Save Defaults
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button
                            onClick={handleGeneratePDF}
                            className="bg-red-600 hover:bg-red-700 text-white min-w-[150px]"
                            disabled={finalEventsToExport.length === 0}
                        >
                            Export PDF ({finalEventsToExport.length})
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
