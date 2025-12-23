'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Calendar,
    Ticket,
    Users,
    MessageSquare,
    CreditCard,
    AlertCircle,
    LayoutDashboard
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/auth/actions'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Events', href: '/dashboard/events', icon: Calendar },
    { name: 'Tickets', href: '/dashboard/tickets', icon: Ticket, disabled: false },
    { name: 'Vendors', href: '/dashboard/vendors', icon: Users, disabled: true },
    { name: 'Staff Management', href: '/dashboard/staff', icon: Users, disabled: false },
    { name: 'Subscription Plan', href: '/dashboard/subscription', icon: CreditCard, disabled: true },
    { name: 'Message', href: '/dashboard/messages', icon: MessageSquare, disabled: true },
    { name: 'Finance', href: '/dashboard/finance', icon: CreditCard, disabled: true },
    { name: 'Dispute', href: '/dashboard/dispute', icon: AlertCircle, disabled: true },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#0d1b3e] px-6 pb-4 h-full text-white">
            <div className="flex h-16 shrink-0 items-center">
                <h1 className="text-xl font-bold tracking-wider">EVENT PORTAL</h1>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-1">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => (
                                <li key={item.name}>
                                    {item.disabled ? (
                                        <span className="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-500 cursor-not-allowed opacity-60">
                                            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                            {item.name}
                                        </span>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                pathname === item.href || pathname.startsWith(item.href) && item.href !== '/dashboard'
                                                    ? 'bg-[#2d5bff] text-white shadow-lg'
                                                    : 'text-gray-300 hover:bg-[#1a2b5e] hover:text-white',
                                                'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-all'
                                            )}
                                        >
                                            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                            {item.name}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </li>
                    <li className="mt-auto">
                        <button
                            onClick={() => logout()}
                            className="group -mx-2 flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-[#1a2b5e] hover:text-white"
                        >
                            Sign out
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    )
}
