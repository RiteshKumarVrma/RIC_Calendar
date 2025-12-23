'use client'

import { ChangeEvent, useState } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/Button'
import { Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function StaffExcelImport() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)

        const reader = new FileReader()
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                // Expect columns: name, email, phone, personal_details, joining_date (YYYY-MM-DD or date object handled by xlsx), role
                const data = XLSX.utils.sheet_to_json(ws) as any[]

                if (data.length === 0) {
                    alert('No data found in Excel file.')
                    setLoading(false)
                    return
                }

                const staffToInsert = data.map(row => ({
                    name: row.name || row.Name,
                    email: row.email || row.Email,
                    phone: row.phone || row.Phone,
                    role: row.role || row.Role || 'staff',
                    personal_details: row.personal_details || row['Personal Details'] || '',
                    joining_date: row.joining_date || row['Joining Date'] ? new Date(row.joining_date || row['Joining Date']).toISOString() : null,
                }))

                const { error } = await supabase.from('staff_members').insert(staffToInsert)

                if (error) {
                    console.error('Upload Error:', error)
                    alert('Failed to upload some records. Check console for details.')
                } else {
                    alert('Staff imported successfully!')
                    router.refresh()
                }

            } catch (err) {
                console.error(err)
                alert('Error parsing Excel file.')
            } finally {
                setLoading(false)
            }
        }
        reader.readAsBinaryString(file)
    }

    return (
        <label className="cursor-pointer">
            <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleFileUpload}
                disabled={loading}
            />
            <div className={`flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors ${loading ? 'opacity-50' : ''}`}>
                <Upload className="h-4 w-4" />
                {loading ? 'Importing...' : 'Import Staff Excel'}
            </div>
        </label>
    )
}
