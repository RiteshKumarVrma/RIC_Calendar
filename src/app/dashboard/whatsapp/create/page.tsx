import CreateCampaignForm from '@/components/broadcasts/CreateCampaignForm'
import { getTemplates } from '@/app/dashboard/actions/broadcasts'

export const dynamic = 'force-dynamic'

export default async function CreateWhatsAppCampaignPage() {
    const templates = await getTemplates()

    return <CreateCampaignForm templates={templates} fixedType="whatsapp" />
}
