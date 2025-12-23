'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
    { name: 'All', value: 'all' },
    { name: 'Published', value: 'published' },
    { name: 'Draft', value: 'draft' },
    { name: 'Completed', value: 'completed' }
]

export function EventsTabFilter() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const currentFilter = searchParams.get('filter') || 'all'

    const handleTabClick = (filter: string) => {
        const params = new URLSearchParams(searchParams)
        if (filter === 'all') {
            params.delete('filter')
        } else {
            params.set('filter', filter)
        }
        router.replace(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
            {tabs.map((tab) => (
                <button
                    key={tab.value}
                    onClick={() => handleTabClick(tab.value)}
                    className={cn(
                        "px-4 py-1.5 text-sm font-medium rounded transition-all",
                        currentFilter === tab.value
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                    )}
                >
                    {tab.name}
                </button>
            ))}
        </div>
    )
}
