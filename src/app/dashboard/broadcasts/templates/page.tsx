import { getTemplates } from '@/app/dashboard/actions/broadcasts'
import TemplatesClient from '@/components/broadcasts/TemplatesClient'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
    const templates = await getTemplates()

    return (
        <div className="max-w-7xl mx-auto">
            <TemplatesClient initialTemplates={templates || []} />
        </div>
    )
}
