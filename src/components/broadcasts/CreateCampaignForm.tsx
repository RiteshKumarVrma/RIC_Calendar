'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { createCampaign } from '@/app/dashboard/actions/broadcasts'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateCampaignForm({ templates, fixedType }: { templates: any[], fixedType?: 'email' | 'whatsapp' }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Step 1: Basics
    const [formData, setFormData] = useState({
        name: '',
        type: fixedType || 'email',
        template_id: '',
        filter_tags: '',
        scheduled_at: ''
    })

    const filteredTemplates = templates.filter(t => t.type === formData.type)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const form = new FormData()
        Object.entries(formData).forEach(([k, v]) => form.append(k, v))

        const result = await createCampaign(form)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            // Success
            if (fixedType) {
                router.push(`/dashboard/${fixedType}`)
            } else {
                router.push('/dashboard/broadcasts/campaigns')
            }
            router.refresh()
        }
    }

    return (
        <div className="max-w-2xl mx-auto py-8">
            <Link href={fixedType ? `/dashboard/${fixedType}` : "/dashboard/broadcasts/campaigns"} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="h-4 w-4" /> Back to Campaigns
            </Link>

            <div className="bg-white p-8 rounded-lg shadow border border-gray-200">
                <h1 className="text-xl font-bold mb-6">Create New {fixedType ? (fixedType === 'email' ? 'Email' : 'WhatsApp') : ''} Campaign</h1>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Campaign Name</Label>
                        <Input
                            required
                            placeholder="e.g. Summer Sale Announcement"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {!fixedType && (
                            <div className="space-y-2">
                                <Label>Channel</Label>
                                <select
                                    className="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value, template_id: '' })}
                                >
                                    <option value="email">Email</option>
                                    <option value="whatsapp">WhatsApp</option>
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Select Template</Label>
                            <select
                                required
                                className="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={formData.template_id}
                                onChange={e => setFormData({ ...formData, template_id: e.target.value })}
                            >
                                <option value="">-- Choose Template --</option>
                                {filteredTemplates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            {filteredTemplates.length === 0 && (
                                <p className="text-xs text-orange-600">No {formData.type} templates found. Create one first.</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Audience Filter (Tags)</Label>
                        <Input
                            placeholder="vip, lead (Leave empty to send to ALL subscribers)"
                            value={formData.filter_tags}
                            onChange={e => setFormData({ ...formData, filter_tags: e.target.value })}
                        />
                        <p className="text-xs text-gray-500">Only contacts with ANY of specified tags will receive the message. Leave blank for everyone.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Schedule (Optional)</Label>
                        <Input
                            type="datetime-local"
                            value={formData.scheduled_at}
                            onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
                        />
                        <p className="text-xs text-gray-500">Leave blank to start processing immediately.</p>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
                            {loading ? 'Creating Campaign...' : 'Launch Campaign'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
