'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
    { name: 'Overview', href: '/dashboard/broadcasts' },
    { name: 'Campaigns', href: '/dashboard/broadcasts/campaigns' },
    { name: 'Contacts', href: '/dashboard/broadcasts/contacts' },
    { name: 'Templates', href: '/dashboard/broadcasts/templates' },
]

export default function BroadcastsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Broadcasts & Marketing</h1>
                <p className="text-gray-500">Manage email and WhatsApp campaigns, contacts, and templates.</p>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={cn(
                                    isActive
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                                    'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
                                )}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {tab.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <main>
                {children}
            </main>
        </div>
    )
}
