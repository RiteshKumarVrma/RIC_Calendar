'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { createContact, deleteContact, bulkImportContacts } from '@/app/dashboard/actions/broadcasts'
import { Plus, Trash2, Upload, X, Search, FileText } from 'lucide-react'

// Simple interactions for Contacts
export default function ContactsClient({ initialContacts }: { initialContacts: any[] }) {
    const [contacts, setContacts] = useState(initialContacts)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const router = useRouter()

    // Add Form State
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', tags: '' })

    // Import State
    const [csvContent, setCsvContent] = useState('')

    const filteredContacts = contacts.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    )

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const form = new FormData()
        Object.entries(formData).forEach(([k, v]) => form.append(k, v))

        await createContact(form)
        setLoading(false)
        setIsAddOpen(false)
        setFormData({ name: '', email: '', phone: '', tags: '' })
        router.refresh()
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this contact?')) return
        await deleteContact(id)
        router.refresh()
    }

    async function handleImport() {
        setLoading(true)
        // Parse CSV
        const lines = csvContent.split('\n').filter(l => l.trim())
        const parsed = lines.map(line => {
            const [name, email, phone, ...tags] = line.split(',').map(s => s.trim())
            return {
                name: name || '',
                email: email && email.includes('@') ? email : '',
                phone: phone || (email && !email.includes('@') ? email : ''), // handle offset
                tags: tags
            }
        })

        await bulkImportContacts(parsed)
        setLoading(false)
        setIsImportOpen(false)
        setCsvContent('')
        router.refresh()
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative max-w-xs w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search contacts..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsImportOpen(true)} className="flex items-center gap-2">
                        <Upload className="h-4 w-4" /> Import CSV
                    </Button>
                    <Button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="h-4 w-4" /> Add Contact
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Contact Info</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tags</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredContacts.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">
                                    No contacts found. Add or import some to get started.
                                </td>
                            </tr>
                        ) : (
                            filteredContacts.map((contact) => (
                                <tr key={contact.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                        {contact.name || 'Unknown'}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                        <div className="flex flex-col text-xs">
                                            {contact.email && <span>{contact.email}</span>}
                                            {contact.phone && <span>{contact.phone}</span>}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                        <div className="flex flex-wrap gap-1">
                                            {contact.tags && contact.tags.map((tag: string, i: number) => (
                                                <span key={i} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                        <button onClick={() => handleDelete(contact.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Dialog (Simple Modal) */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Add New Contact</h3>
                            <button onClick={() => setIsAddOpen(false)}><X className="h-5 w-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1234567890" />
                            </div>
                            <div className="space-y-2">
                                <Label>Tags (comma separated)</Label>
                                <Input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="vip, lead, 2024" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Contact'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Dialog */}
            {isImportOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Import Contacts (CSV)</h3>
                            <button onClick={() => setIsImportOpen(false)}><X className="h-5 w-5 text-gray-500" /></button>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">Paste your CSV data below. Format: <code>Name, Email, Phone, Tag1, Tag2...</code></p>
                            <textarea
                                className="w-full h-40 border rounded-md p-2 text-sm font-mono"
                                placeholder={`John Doe, john@test.com, 1234567890, vip\nJane Smith, jane@test.com,, lead`}
                                value={csvContent}
                                onChange={e => setCsvContent(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsImportOpen(false)}>Cancel</Button>
                            <Button onClick={handleImport} disabled={loading}>{loading ? 'Importing...' : 'Import Contacts'}</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
