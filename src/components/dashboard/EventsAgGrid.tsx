'use client'

import { useState, useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, ModuleRegistry, ClientSideRowModelModule, ValidationModule } from 'ag-grid-community'
import { Event } from '@/types'
import { format } from 'date-fns'
import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
// Styles
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule]);

type EventGridProps = {
    events: Event[]
}

export function EventsAgGrid({ events }: EventGridProps) {
    const [rowData] = useState<Event[]>(events)

    const [columnDefs] = useState<ColDef<Event>[]>([
        { field: 'title', headerName: 'Event Name', flex: 2, filter: true, sortable: true },
        { field: 'category', headerName: 'Category', flex: 1, filter: true },
        { field: 'venue', headerName: 'Location', flex: 1, filter: true },
        {
            headerName: 'Hours',
            valueGetter: (p) => `${p.data?.start_time} - ${p.data?.end_time}`,
            flex: 1
        },
        {
            field: 'event_date',
            headerName: 'Date',
            valueFormatter: (p) => p.value ? format(new Date(p.value), 'dd.MM.yyyy') : '',
            flex: 1,
            sortable: true
        },
        {
            field: 'is_published',
            headerName: 'Status',
            cellRenderer: (p: any) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {p.value ? 'Published' : 'Draft'}
                </span>
            ),
            flex: 1
        },
        {
            headerName: 'Actions',
            cellRenderer: (p: any) => (
                <div className="flex gap-2">
                    <Link href={`/dashboard/events/edit/${p.data.id}`}>
                        <button className="text-gray-400 hover:text-[#2d5bff]">
                            <Edit className="h-4 w-4" />
                        </button>
                    </Link>
                    <button className="text-gray-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
            flex: 1,
            sortable: false,
            filter: false
        }
    ])

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
    }), [])

    return (
        <div className="ag-theme-alpine w-full h-[600px] mt-4">
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                pagination={true}
                paginationPageSize={10}
                paginationPageSizeSelector={[10, 20, 50]}
            />
        </div>
    )
}
