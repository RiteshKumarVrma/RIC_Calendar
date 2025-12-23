"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/DataTable"
import { format } from "date-fns"
import { markAttendance } from '@/app/dashboard/actions/staff'
import { useState } from 'react'
import { createClient } from "@/lib/supabase/client"

function AttendanceAction({ staffId }: { staffId: string }) {
    const [loading, setLoading] = useState(false)

    const handleAction = async (action: 'check_in' | 'check_out') => {
        setLoading(true)
        const res = await markAttendance(staffId, action)
        setLoading(false)
        if (res.error) {
            alert(res.error)
        } else {
            alert(`Successfully ${action === 'check_in' ? 'Checked In' : 'Checked Out'}`)
        }
    }

    return (
        <div className="flex gap-1">
            <button
                onClick={() => handleAction('check_in')}
                disabled={loading}
                className="text-green-600 hover:text-green-800 text-xs border border-green-200 px-2 rounded disabled:opacity-50"
            >
                In
            </button>
            <button
                onClick={() => handleAction('check_out')}
                disabled={loading}
                className="text-red-600 hover:text-red-800 text-xs border border-red-200 px-2 rounded disabled:opacity-50"
            >
                Out
            </button>
        </div>
    )
}

export const columns: ColumnDef<any>[] = [
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
            <div className="font-medium text-gray-900">{row.getValue("name")}</div>
        )
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "phone",
        header: "Phone",
    },
    {
        accessorKey: "role",
        header: "Role",
    },
    {
        accessorKey: "personal_details",
        header: "Details",
        cell: ({ row }) => <div className="max-w-xs truncate">{row.getValue("personal_details")}</div>
    },
    {
        accessorKey: "joining_date",
        header: "Joined",
        cell: ({ row }) => {
            const date = row.getValue("joining_date") as string
            return date ? format(new Date(date), "PP") : '-'
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            return (
                <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>
                    <AttendanceAction staffId={row.original.id} />
                </div>
            )
        },
    },
]

interface StaffTableProps {
    data: any[]
}

export function StaffTable({ data }: StaffTableProps) {
    return <DataTable columns={columns} data={data} />
}
