'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Home, List, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/auth/actions'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Events', href: '/dashboard/events', icon: List },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 h-full">
            <div className="flex h-16 shrink-0 items-center">
                <h1 className="text-xl font-bold text-white">Institute Events</h1>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            pathname === item.href
                                                ? 'bg-gray-800 text-white'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                                            'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
                                        )}
                                    >
                                        <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </li>
                    <li className="mt-auto">
                        <button
                            onClick={() => logout()}
                            className="group -mx-2 flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white"
                        >
                            <LogOut className="h-6 w-6 shrink-0" aria-hidden="true" />
                            Sign out
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    )
}
