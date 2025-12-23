'use client'

import { useState, useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, ModuleRegistry, ClientSideRowModelModule, ValidationModule } from 'ag-grid-community'
import { Ticket } from '@/types'
import { format } from 'date-fns'

// Styles
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule]);

type TicketGridProps = {
    tickets: Ticket[]
}

export function TicketsAgGrid({ tickets }: TicketGridProps) {
    const [rowData] = useState<Ticket[]>(tickets)

    const [columnDefs] = useState<ColDef<Ticket>[]>([
        {
            headerName: 'Event',
            field: 'events.title',
            flex: 2,
            filter: true
        },
        {
            headerName: 'Attendee',
            field: 'profiles.name',
            flex: 1,
            filter: true
        },
        { field: 'ticket_code', headerName: 'Ticket Code', flex: 1, filter: true },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            cellRenderer: (p: any) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${p.value === 'confirmed' ? 'bg-green-100 text-green-800' :
                        p.value === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {p.value}
                </span>
            )
        },
        {
            field: 'created_at',
            headerName: 'Purchased At',
            valueFormatter: (p) => p.value ? format(new Date(p.value), 'PP p') : '',
            flex: 1
        },
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
            />
        </div>
    )
}
