import { getOverviewStats, getCampaigns } from '@/app/dashboard/actions/broadcasts'
import CampaignsClient from '@/components/broadcasts/CampaignsClient'
import { BarChart, Users, MessageCircle, CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WhatsAppPage() {
    const stats = await getOverviewStats('whatsapp')
    const campaigns = await getCampaigns('whatsapp')

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">WhatsApp Marketing</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 text-center border-t-4 border-indigo-500">
                    <dt className="truncate text-sm font-medium text-gray-500 flex justify-center items-center gap-2">
                        <Users className="h-4 w-4" /> Total Contacts
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.contacts}</dd>
                </div>
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 text-center border-t-4 border-green-500">
                    <dt className="truncate text-sm font-medium text-gray-500 flex justify-center items-center gap-2">
                        <BarChart className="h-4 w-4" /> WA Campaigns
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.campaigns}</dd>
                </div>
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 text-center border-t-4 border-teal-500">
                    <dt className="truncate text-sm font-medium text-gray-500 flex justify-center items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> WA Sent
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.sent}</dd>
                </div>
            </div>

            <CampaignsClient initialCampaigns={campaigns} type="whatsapp" />
        </div>
    )
}
