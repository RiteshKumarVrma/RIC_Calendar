import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopHeader } from '@/components/dashboard/TopHeader'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <div className="hidden md:flex md:w-72 md:flex-col">
                <Sidebar />
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                <TopHeader />
                <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    )
}
