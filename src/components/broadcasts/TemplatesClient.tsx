'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { createTemplate, deleteTemplate } from '@/app/dashboard/actions/broadcasts'
import { Plus, Trash2, X, FileText, Mail, MessageCircle } from 'lucide-react'

export default function TemplatesClient({ initialTemplates }: { initialTemplates: any[] }) {
    const [templates, setTemplates] = useState(initialTemplates)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const [formData, setFormData] = useState({ name: '', type: 'email', subject: '', content: '' })

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const form = new FormData()
        Object.entries(formData).forEach(([k, v]) => form.append(k, v))

        await createTemplate(form)
        setLoading(false)
        setIsAddOpen(false)
        setFormData({ name: '', type: 'email', subject: '', content: '' })
        router.refresh()
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this template?')) return
        await deleteTemplate(id)
        router.refresh()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Message Templates</h2>
                <Button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white">
                    <Plus className="h-4 w-4" /> Create Template
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                    <div key={template.id} className="bg-white rounded-lg border shadow-sm p-6 relative group">
                        <button
                            onClick={() => handleDelete(template.id)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${template.type === 'email' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                {template.type === 'email' ? <Mail className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                <p className="text-xs text-gray-500 uppercase">{template.type}</p>
                            </div>
                        </div>
                        {template.type === 'email' && (
                            <p className="text-sm font-medium text-gray-700 mb-2 truncate">Subject: {template.subject}</p>
                        )}
                        <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 font-mono h-24 overflow-hidden relative">
                            {template.content}
                            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent"></div>
                        </div>
                    </div>
                ))}
                {templates.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <FileText className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                        <p>No templates yet. Create one to get started.</p>
                    </div>
                )}
            </div>

            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">New Template</h3>
                            <button onClick={() => setIsAddOpen(false)}><X className="h-5 w-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Welcome Email" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <select
                                        className="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="email">Email</option>
                                        <option value="whatsapp">WhatsApp</option>
                                    </select>
                                </div>
                            </div>

                            {formData.type === 'email' && (
                                <div className="space-y-2">
                                    <Label>Subject Line</Label>
                                    <Input required value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="Welcome to our platform!" />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Content</Label>
                                <p className="text-xs text-gray-500">Use <code>{`{{name}}`}</code> for dynamic variables.</p>
                                <textarea
                                    required
                                    className="w-full h-40 border rounded-md p-3 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder={formData.type === 'email' ? "<h1>Hello {{name}}</h1>..." : "Hello {{name}}, check out our offer!"}
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Template'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
