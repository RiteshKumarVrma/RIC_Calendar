import { cn } from '@/lib/utils'
import { LabelHTMLAttributes } from 'react'

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
    return (
        <label className={cn("block text-sm font-medium leading-6 text-gray-900", className)} {...props} />
    )
}
