import EmailCampaignWizard from '@/components/broadcasts/EmailCampaignWizard'
import { getTemplates } from '@/app/dashboard/actions/broadcasts'

export const dynamic = 'force-dynamic'

export default async function CreateEmailCampaignPage() {
    const templates = await getTemplates()

    return <EmailCampaignWizard templates={templates} />
}
