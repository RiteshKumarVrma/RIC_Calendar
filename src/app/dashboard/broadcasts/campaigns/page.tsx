import { getCampaigns } from '@/app/dashboard/actions/broadcasts'
import CampaignsClient from '@/components/broadcasts/CampaignsClient'

export const dynamic = 'force-dynamic'

export default async function CampaignsPage() {
    const campaigns = await getCampaigns()

    return (
        <div className="max-w-7xl mx-auto">
            <CampaignsClient initialCampaigns={campaigns || []} />
        </div>
    )
}
