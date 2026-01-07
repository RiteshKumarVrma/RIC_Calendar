'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Play, Pause, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function CampaignsClient({ initialCampaigns }: { initialCampaigns: any[] }) {

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Campaigns</h2>
                <Link href="/dashboard/broadcasts/campaigns/create">
                    <Button className="flex items-center gap-2 bg-indigo-600 text-white">
                        <Plus className="h-4 w-4" /> New Campaign
                    </Button>
                </Link>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
                <ul role="list" className="divide-y divide-gray-200">
                    {initialCampaigns.length === 0 ? (
                        <li className="px-6 py-12 text-center text-gray-400 text-sm">
                            No campaigns found. Start a new one!
                        </li>
                    ) : (
                        initialCampaigns.map((campaign) => (
                            <li key={campaign.id}>
                                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-sm font-medium text-indigo-600">{campaign.name}</p>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    campaign.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                        campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {campaign.status}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500 gap-4">
                                            <span className="flex items-center gap-1">
                                                {campaign.type === 'email' ? '📧 Email' : '💬 WhatsApp'}
                                            </span>
                                            <span>
                                                Template: {campaign.message_templates?.name || 'Unknown'}
                                            </span>
                                            <span>
                                                {campaign.stats?.total || 0} Recipients
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        {campaign.scheduled_at && (
                                            <div className="flex items-center gap-1 text-orange-600">
                                                <Clock className="h-4 w-4" />
                                                {new Date(campaign.scheduled_at).toLocaleDateString()}
                                            </div>
                                        )}
                                        {/* Future: Add View Details button */}
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    )
}
