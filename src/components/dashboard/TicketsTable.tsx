"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Ticket } from "@/types"
import { DataTable } from "@/components/ui/DataTable"
import { format } from "date-fns"

export const columns: ColumnDef<Ticket>[] = [
    {
        id: "event",
        header: "Event",
        accessorFn: (row) => row.events?.title,
        cell: ({ row }) => <div className="font-medium">{row.original.events?.title || "N/A"}</div>
    },
    {
        id: "attendee",
        header: "Attendee",
        accessorFn: (row) => row.profiles?.name,
        cell: ({ row }) => <div>{row.original.profiles?.name || "N/A"}</div>
    },
    {
        accessorKey: "ticket_code",
        header: "Ticket Code",
    },
    {
        accessorKey: "guest_count",
        header: "Guests",
        cell: ({ row }) => (
            <div className="pl-4">{row.original.guest_count || 0}</div>
        )
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const val = row.getValue("status") as string
            return (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                ${val === 'confirmed' ? 'bg-green-100 text-green-800' :
                        val === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {val}
                </span>
            )
        }
    },
    {
        accessorKey: "created_at",
        header: "Purchased At",
        cell: ({ row }) => {
            const date = new Date(row.getValue("created_at"))
            return format(date, "PP p")
        },
    },
]

interface TicketsTableProps {
    data: Ticket[]
}

export function TicketsTable({ data }: TicketsTableProps) {
    return <DataTable columns={columns} data={data} />
}
