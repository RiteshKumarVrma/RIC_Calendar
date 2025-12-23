import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { StaffTable } from '@/components/dashboard/StaffTable'
import { StaffExcelImport } from '@/components/dashboard/StaffExcelImport'

export const dynamic = 'force-dynamic'

export default async function StaffPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Using new staff_members table
    const { data: staff, error } = await supabase
        .from('staff_members')
        .select('*')
        .order('created_at', { ascending: false })

    const staffData = staff || []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">Staff Management</h2>
                <StaffExcelImport />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <StaffTable data={staffData as any} />
            </div>
        </div>
    )
}
