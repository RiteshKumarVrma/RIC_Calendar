'use client'

import { useState, useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, ModuleRegistry, ClientSideRowModelModule, ValidationModule } from 'ag-grid-community'
import { Profile } from '@/types'
import { format } from 'date-fns'
import { Edit } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Styles
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule]);

type StaffGridProps = {
    profiles: Profile[]
}

export function StaffAgGrid({ profiles }: StaffGridProps) {
    const [rowData] = useState<Profile[]>(profiles)

    // Simple role editor via prompt for now (can be enhanced to modal)
    const handleEditRole = async (id: string, currentRole: string) => {
        const newRole = prompt("Enter new role (super_admin, institute_admin, staff, viewer):", currentRole)
        if (newRole && ['super_admin', 'institute_admin', 'staff', 'viewer'].includes(newRole)) {
            const supabase = createClient()
            const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id)
            if (error) alert('Error updating role')
            else window.location.reload()
        } else if (newRole) {
            alert('Invalid role.')
        }
    }

    const [columnDefs] = useState<ColDef<Profile>[]>([
        { field: 'name', headerName: 'Name', flex: 2, filter: true },
        {
            field: 'role',
            headerName: 'Role',
            flex: 1,
            cellRenderer: (p: any) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${p.value === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                        p.value === 'staff' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {p.value}
                </span>
            )
        },
        {
            field: 'created_at',
            headerName: 'Joined',
            valueFormatter: (p) => format(new Date(p.value), 'PP'),
            flex: 1
        },
        {
            headerName: 'Actions',
            cellRenderer: (p: any) => (
                <button
                    onClick={() => handleEditRole(p.data.id, p.data.role)}
                    className="text-indigo-600 hover:text-indigo-900 border rounded px-2 py-1 text-xs"
                >
                    Change Role
                </button>
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
            />
        </div>
    )
}
