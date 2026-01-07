import { getContacts } from '@/app/dashboard/actions/broadcasts'
import ContactsClient from '@/components/broadcasts/ContactsClient'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
    const contacts = await getContacts()

    return (
        <div className="max-w-7xl mx-auto">
            <ContactsClient initialContacts={contacts || []} />
        </div>
    )
}
