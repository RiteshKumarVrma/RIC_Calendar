'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function markAttendance(staffId: string, action: 'check_in' | 'check_out') {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const today = new Date().toISOString().split('T')[0]

    // Check if record exists for today
    const { data: attendance } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('staff_id', staffId)
        .eq('date', today)
        .single()

    if (action === 'check_in') {
        if (attendance) {
            return { error: 'Already checked in today.' }
        }
        const { error } = await supabase.from('staff_attendance').insert({
            staff_id: staffId,
            check_in_time: new Date().toISOString(),
            date: today
        })
        if (error) return { error: error.message }
    } else {
        if (!attendance) {
            return { error: 'No check-in record found for today.' }
        }
        const { error } = await supabase.from('staff_attendance').update({
            check_out_time: new Date().toISOString()
        }).eq('id', attendance.id)
        if (error) return { error: error.message }
    }

    revalidatePath('/dashboard/staff')
    return { success: true }
}
