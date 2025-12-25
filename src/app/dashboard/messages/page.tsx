import { WhatsAppBulkSender } from '@/components/dashboard/WhatsAppBulkSender'

export default function MessagesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Communication Center</h1>
                <p className="text-gray-500">Manage your messaging and announcements.</p>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <div className="lg:col-span-2">
                    <WhatsAppBulkSender />
                </div>
            </div>
        </div>
    )
}
