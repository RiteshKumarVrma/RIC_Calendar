import { getTemplates } from '@/app/dashboard/actions/broadcasts'
import CreateCampaignForm from '@/components/broadcasts/CreateCampaignForm'

export const dynamic = 'force-dynamic'

export default async function CreateCampaignPage() {
    const templates = await getTemplates()

    return <CreateCampaignForm templates={templates || []} />
}
