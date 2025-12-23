'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select" // Assuming you have a Select component, otherwise native

// Separate component for clarity
export function EventsFilterBar() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Get current values
    const currentFilter = searchParams.get('filter') || 'all'
    const currentYear = searchParams.get('year') || new Date().getFullYear().toString()
    const currentMonth = searchParams.get('month') || (new Date().getMonth() + 1).toString()
    const currentWeek = searchParams.get('week') || 'all'

    // Update URL helper
    const updateParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value === 'all' || value === '') {
            params.delete(key)
        } else {
            params.set(key, value)
        }
        router.replace(`${pathname}?${params.toString()}`)
    }

    const tabs = [
        { name: 'All', value: 'all' },
        { name: 'Published', value: 'published' },
        { name: 'Draft', value: 'draft' },
    ]

    const years = ['2024', '2025', '2026']
    const months = [
        { name: 'January', value: '1' },
        { name: 'February', value: '2' },
        { name: 'March', value: '3' },
        { name: 'April', value: '4' },
        { name: 'May', value: '5' },
        { name: 'June', value: '6' },
        { name: 'July', value: '7' },
        { name: 'August', value: '8' },
        { name: 'September', value: '9' },
        { name: 'October', value: '10' },
        { name: 'November', value: '11' },
        { name: 'December', value: '12' },
    ]
    const weeks = [
        { name: 'All Weeks', value: 'all' },
        { name: 'Week 1', value: '1' },
        { name: 'Week 2', value: '2' },
        { name: 'Week 3', value: '3' },
        { name: 'Week 4', value: '4' },
        { name: 'Week 5', value: '5' },
    ]

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-2 rounded-lg border border-gray-200">

            {/* Status Tabs */}
            <div className="flex space-x-1 bg-gray-200 p-1 rounded-md">
                {tabs.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => updateParam('filter', tab.value)}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded transition-all",
                            currentFilter === tab.value
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                        )}
                    >
                        {tab.name}
                    </button>
                ))}
            </div>

            <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>

            {/* Date Filters */}
            <div className="flex items-center gap-2">
                {/* Year */}
                <select
                    className="text-sm bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={currentYear}
                    onChange={(e) => updateParam('year', e.target.value)}
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                {/* Month */}
                <select
                    className="text-sm bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={currentMonth}
                    onChange={(e) => updateParam('month', e.target.value)}
                >
                    <option value="all">All Months</option>
                    {months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                </select>

                {/* Week */}
                <select
                    className="text-sm bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={currentWeek}
                    onChange={(e) => updateParam('week', e.target.value)}
                >
                    {weeks.map(w => <option key={w.value} value={w.value}>{w.name}</option>)}
                </select>
            </div>

        </div>
    )
}
