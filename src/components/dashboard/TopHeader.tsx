'use client'

import { Bell, Search, Globe, ChevronDown } from 'lucide-react'

export function TopHeader() {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">

            {/* Search */}
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <form className="relative flex flex-1" action="#" method="GET">
                    <label htmlFor="search-field" className="sr-only">
                        Search
                    </label>
                    <div className="relative w-full max-w-md my-auto">
                        <Search
                            className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                            aria-hidden="true"
                        />
                        <input
                            id="search-field"
                            className="block w-full h-10 rounded-md border-0 bg-gray-50 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                            placeholder="Search for event, vendor, etc"
                            type="search"
                            name="search"
                        />
                    </div>
                </form>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
                <div className="text-sm font-medium text-gray-700 hidden sm:block">
                    DATE: {new Date().toLocaleDateString()}
                </div>

                <div className="h-6 w-px bg-gray-200" aria-hidden="true" />

                <button type="button" className="flex items-center gap-x-1 text-sm text-gray-700">
                    <Globe className="h-4 w-4 text-pink-600" />
                    English
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative">
                    <span className="sr-only">View notifications</span>
                    <Bell className="h-6 w-6" aria-hidden="true" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                </button>

                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <div className="h-6 w-px bg-gray-200" aria-hidden="true" />
                    <div className="flex items-center gap-x-4 px-6 py-3">
                        <div className="flex items-center">
                            <span className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                US
                            </span>
                            <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                                Admin User
                            </span>
                            <ChevronDown className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
