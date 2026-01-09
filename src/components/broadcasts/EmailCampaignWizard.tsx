'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
    Check,
    ChevronRight,
    ChevronLeft,
    Mail,
    Users,
    Clock,
    Send,
    AlertTriangle,
    Eye
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { createCampaign } from '@/app/dashboard/actions/broadcasts'

// Types
type Step = 'content' | 'recipients' | 'schedule' | 'review'

export default function EmailCampaignWizard({ templates }: { templates: any[] }) {
    const router = useRouter()
    const [step, setStep] = useState<Step>('content')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        type: 'email',
        template_id: '',
        subject: '',
        content: '',
        filter_tags: '',
        scheduled_at: '',
        audience_source: 'database', // 'database' | 'manual'
        manual_emails: ''
    })

    // Filter email templates
    const emailTemplates = useMemo(() => templates.filter(t => t.type === 'email'), [templates])

    // Mock count of recipients (In real app, fetch from server based on filter_tags)
    const recipientCount = 142 // Placeholder

    const handleTemplateChange = (templateId: string) => {
        const tmpl = emailTemplates.find(t => t.id === templateId)
        if (tmpl) {
            setFormData(prev => ({
                ...prev,
                template_id: templateId,
                subject: tmpl.subject || prev.subject,
                content: tmpl.content || prev.content
            }))
        } else {
            setFormData(prev => ({ ...prev, template_id: templateId }))
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError('')

        const form = new FormData()
        Object.entries(formData).forEach(([k, v]) => form.append(k, v))

        // Append fixed type
        form.set('type', 'email')

        const result = await createCampaign(form)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            router.push('/dashboard/email')
            router.refresh()
        }
    }

    // Wizard Steps
    const steps = [
        { id: 'content', label: 'Content', icon: Mail },
        { id: 'recipients', label: 'Audience', icon: Users },
        { id: 'schedule', label: 'Schedule', icon: Clock },
        { id: 'review', label: 'Review', icon: Send },
    ]

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">

            {/* Progress Bar */}
            <nav aria-label="Progress" className="mb-10">
                <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
                    {steps.map((s, index) => {
                        const isCurrent = s.id === step
                        const isCompleted = steps.findIndex(x => x.id === step) > index

                        return (
                            <li key={s.id} className="md:flex-1">
                                <div className={`group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 ${isCompleted ? 'border-indigo-600' : isCurrent ? 'border-indigo-600' : 'border-gray-200'
                                    }`}>
                                    <span className={`text-sm font-medium ${isCompleted || isCurrent ? 'text-indigo-600' : 'text-gray-500'}`}>
                                        Step {index + 1}
                                    </span>
                                    <span className="text-sm font-medium">{s.label}</span>
                                </div>
                            </li>
                        )
                    })}
                </ol>
            </nav>

            <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
                            <div className="flex">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Content */}
                    {step === 'content' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Campaign Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. January Newsletter"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Load Template (Optional)</Label>
                                    <select
                                        className="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm"
                                        value={formData.template_id}
                                        onChange={e => handleTemplateChange(e.target.value)}
                                    >
                                        <option value="">-- Clean Slate --</option>
                                        {emailTemplates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Subject Line</Label>
                                    <Input
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="Enter your subject line..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Email Content</Label>
                                <textarea
                                    className="min-h-[300px] w-full rounded-md border border-gray-300 p-4 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Write your email content here. Use {{name}} for dynamic names."
                                />
                                <p className="text-xs text-gray-500">Supported variables: {'{{name}}'}</p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Recipients */}
                    {step === 'recipients' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <Label>Audience Source</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        className={`p-4 border rounded-lg cursor-pointer flex items-center gap-3 ${formData.audience_source === 'database' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-50'}`}
                                        onClick={() => setFormData({ ...formData, audience_source: 'database' })}
                                    >
                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Users className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">Existing Contacts</p>
                                            <p className="text-xs text-gray-500">Filter from your database</p>
                                        </div>
                                    </div>
                                    <div
                                        className={`p-4 border rounded-lg cursor-pointer flex items-center gap-3 ${formData.audience_source === 'manual' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-50'}`}
                                        onClick={() => setFormData({ ...formData, audience_source: 'manual' })}
                                    >
                                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Eye className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">Manual Input</p>
                                            <p className="text-xs text-gray-500">Paste a list of emails</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {formData.audience_source === 'database' ? (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
                                        <h3 className="text-sm font-medium text-blue-900 mb-2">Filter Database</h3>
                                        <p className="text-sm text-blue-700">
                                            Select tags to filter your audience. Leaving this blank will send to ALL subscribed contacts.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Filter by Tags</Label>
                                        <Input
                                            value={formData.filter_tags}
                                            onChange={e => setFormData({ ...formData, filter_tags: e.target.value })}
                                            placeholder="vip, lead, customer..."
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="bg-orange-50 border border-orange-100 rounded-md p-4">
                                        <h3 className="text-sm font-medium text-orange-900 mb-2">Paste Emails</h3>
                                        <p className="text-sm text-orange-700">
                                            Enter email addresses separated by commas or new lines. These will be added to your contacts automatically.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Email List</Label>
                                        <textarea
                                            className="min-h-[200px] w-full rounded-md border border-gray-300 p-4 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                            value={formData.manual_emails}
                                            onChange={e => setFormData({ ...formData, manual_emails: e.target.value })}
                                            placeholder="john@example.com, jane@example.com..."
                                        />
                                        <p className="text-xs text-gray-500">
                                            Count: {formData.manual_emails ? formData.manual_emails.split(/[\n,]+/).filter(e => e.trim().includes('@')).length : 0} emails
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 border-t pt-6">
                                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Estimated Recipients</p>
                                            <p className="text-xs text-gray-500">
                                                {formData.audience_source === 'manual' ? 'From pasted list' : 'Based on your filters'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {formData.audience_source === 'manual'
                                            ? (formData.manual_emails ? formData.manual_emails.split(/[\n,]+/).filter(e => e.trim().includes('@')).length : 0)
                                            : `~${recipientCount}`
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Schedule */}
                    {step === 'schedule' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <Label>When should we send this?</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        className={`p-4 border rounded-lg cursor-pointer flex items-center gap-3 ${!formData.scheduled_at ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                                        onClick={() => setFormData({ ...formData, scheduled_at: '' })}
                                    >
                                        <Send className="h-5 w-5 text-indigo-600" />
                                        <div>
                                            <p className="font-medium text-sm">Send Immediately</p>
                                            <p className="text-xs text-gray-500">Start processing queue now</p>
                                        </div>
                                    </div>
                                    <div
                                        className={`p-4 border rounded-lg cursor-pointer flex items-center gap-3 ${formData.scheduled_at ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                                        onClick={() => {
                                            const now = new Date()
                                            now.setMinutes(now.getMinutes() + 60)
                                            setFormData({ ...formData, scheduled_at: now.toISOString().slice(0, 16) })
                                        }}
                                    >
                                        <Clock className="h-5 w-5 text-indigo-600" />
                                        <div>
                                            <p className="font-medium text-sm">Schedule for Later</p>
                                            <p className="text-xs text-gray-500">Pick a specific date & time</p>
                                        </div>
                                    </div>
                                </div>

                                {formData.scheduled_at && (
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                        <Label>Start Time</Label>
                                        <Input
                                            type="datetime-local"
                                            value={formData.scheduled_at}
                                            onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
                                            className="mt-1"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mt-6">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-yellow-800">
                                    <AlertTriangle className="h-4 w-4" />
                                    Safety & Compliance
                                </h4>
                                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                                    <li>Emails will be sent using your <strong>personal Gmail</strong>.</li>
                                    <li>A randomized delay (30s - 60s) will be applied between each email.</li>
                                    <li>Daily limit is dynamically managed by the worker.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 'review' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900">Review Campaign Details</h3>

                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Campaign Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{formData.name}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Subject Line</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{formData.subject || '(No Subject)'}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Audience</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {formData.audience_source === 'manual'
                                            ? `Manual Import (${formData.manual_emails.split(/[\n,]+/).filter(e => e.trim().includes('@')).length} emails)`
                                            : (formData.filter_tags ? `Tags: ${formData.filter_tags}` : 'All Contacts')
                                        }
                                    </dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Schedule</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {formData.scheduled_at ? new Date(formData.scheduled_at).toLocaleString() : 'Immediately'}
                                    </dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Content Preview</dt>
                                    <dd className="mt-1 text-sm text-gray-900 border p-4 rounded-md bg-gray-50 whitespace-pre-wrap max-h-60 overflow-y-auto">
                                        {formData.content}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (step === 'recipients') setStep('content')
                            if (step === 'schedule') setStep('recipients')
                            if (step === 'review') setStep('schedule')
                        }}
                        disabled={step === 'content'}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    {step !== 'review' ? (
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => {
                                if (step === 'content') setStep('recipients')
                                else if (step === 'recipients') setStep('schedule')
                                else if (step === 'schedule') setStep('review')
                            }}
                            disabled={!formData.name}
                        >
                            Next Step
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Launching...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Send className="h-4 w-4" />
                                    Launch Campaign
                                </span>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
