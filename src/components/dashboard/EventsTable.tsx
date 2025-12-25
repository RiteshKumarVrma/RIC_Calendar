"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Event } from "@/types"
import { DataTable } from "@/components/ui/DataTable"
import { format } from "date-fns"
import Link from "next/link"
import { Edit, Trash2, Eye } from "lucide-react"

const categoryColors: Record<string, string> = {
    'Theatre Plays': 'bg-[#FFCC99]',
    'Dance & Music Events': 'bg-[#99CC00]',
    'Talks & Seminars': 'bg-[#99CCFF]',
    'Exhibitions': 'bg-[#FFFF99]',
    'Master class /Lecture / Workshops / Others': 'bg-[#CC99FF]',
    'Film Festival': 'bg-[#CCFFFF]',
}

const getCategoryClass = (category: string) => {
    if (!category) return 'bg-white'
    const catLower = category.toLowerCase()
    const key = Object.keys(categoryColors).find(k => k.toLowerCase().includes(catLower) || catLower.includes(k.toLowerCase()))
    return categoryColors[key || ''] || 'bg-white'
}

export const columns: ColumnDef<Event>[] = [
    {
        accessorKey: "title",
        header: "Event Name",
        cell: ({ row }) => (
            <div>
                <div className="font-medium text-gray-900">{row.getValue("title")}</div>
            </div>
        )
    },
    {
        accessorKey: "category",
        header: "Category",
    },
    {
        accessorKey: "venue",
        header: "Location",
    },
    {
        id: "hours",
        header: "Hours",
        cell: ({ row }) => {
            const start = row.original.start_time
            const end = row.original.end_time
            return `${start} - ${end}`
        }
    },
    {
        accessorKey: "event_date",
        header: "Date",
        cell: ({ row }) => {
            const date = new Date(row.getValue("event_date"))
            return format(date, "dd.MM.yyyy")
        },
    },
    {
        accessorKey: "is_published",
        header: "Status",
        cell: ({ row }) => {
            const isPublished = row.getValue("is_published") as boolean
            return (
                <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                >
                    {isPublished ? "Published" : "Draft"}
                </span>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <div className="flex gap-2 justify-end">
                    <Link href={`/events/${row.original.id}`} target="_blank">
                        <button className="text-gray-400 hover:text-green-600" title="View Public Page">
                            <Eye className="h-4 w-4" />
                        </button>
                    </Link>
                    <Link href={`/dashboard/events/edit/${row.original.id}`}>
                        <button className="text-gray-400 hover:text-[#2d5bff]" title="Edit Event">
                            <Edit className="h-4 w-4" />
                        </button>
                    </Link>
                    <button className="text-gray-400 hover:text-red-500" title="Delete Event">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            )
        },
    },
]

interface EventsTableProps {
    data: Event[]
}

export function EventsTable({ data }: EventsTableProps) {
    return <DataTable
        columns={columns}
        data={data}
        getRowClass={(row) => getCategoryClass(row.category)}
    />
}
