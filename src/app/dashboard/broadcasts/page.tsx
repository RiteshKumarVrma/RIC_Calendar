

import { getOverviewStats } from '@/app/dashboard/actions/broadcasts'
import { BarChart, Users, Mail, MessageCircle, CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BroadcastsPage() {
    const stats = await getOverviewStats()

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 text-center border-t-4 border-indigo-500">
                    <dt className="truncate text-sm font-medium text-gray-500 flex justify-center items-center gap-2">
                        <Users className="h-4 w-4" /> Total Contacts
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.contacts}</dd>
                </div>
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 text-center border-t-4 border-purple-500">
                    <dt className="truncate text-sm font-medium text-gray-500 flex justify-center items-center gap-2">
                        <BarChart className="h-4 w-4" /> Campaigns Created
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.campaigns}</dd>
                </div>
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 text-center border-t-4 border-green-500">
                    <dt className="truncate text-sm font-medium text-gray-500 flex justify-center items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> Messages Sent
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.sent}</dd>
                </div>
            </div>

            <div className="rounded-lg bg-white shadow p-6 text-center py-12">
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No campaigns yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by importing contacts or creating a template.</p>
                <div className="mt-6">
                    {/* Actions will go here */}
                </div>
            </div>
        </div>
    )
}
