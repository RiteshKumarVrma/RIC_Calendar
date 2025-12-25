'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { MessageSquare, Send, CheckCircle, Smartphone, Bold, Italic, Strikethrough, Code, Trash2, UserPlus, Save, FileText } from 'lucide-react'

interface MessageQueueItem {
    id: number
    phoneNumber: string
    name?: string
    status: 'pending' | 'sent'
}

interface SavedTemplate {
    name: string
    content: string
}

export function WhatsAppBulkSender() {
    const [inputNumbers, setInputNumbers] = useState('')
    const [message, setMessage] = useState('')
    const [queue, setQueue] = useState<MessageQueueItem[]>([])
    const [isQueueReady, setIsQueueReady] = useState(false)
    const [showTemplates, setShowTemplates] = useState(false)
    const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([])

    // Load templates on mount
    useEffect(() => {
        const saved = localStorage.getItem('WA_TEMPLATES')
        if (saved) {
            try {
                setSavedTemplates(JSON.parse(saved))
            } catch (e) { console.error(e) }
        }
    }, [])

    const saveTemplate = () => {
        const name = prompt('Enter a name for this template:')
        if (name && message) {
            const newTemplates = [...savedTemplates, { name, content: message }]
            setSavedTemplates(newTemplates)
            localStorage.setItem('WA_TEMPLATES', JSON.stringify(newTemplates))
            alert('Template saved!')
        }
    }

    const loadTemplate = (content: string) => {
        setMessage(content)
        setShowTemplates(false)
    }

    const deleteTemplate = (index: number) => {
        const newTemplates = savedTemplates.filter((_, i) => i !== index)
        setSavedTemplates(newTemplates)
        localStorage.setItem('WA_TEMPLATES', JSON.stringify(newTemplates))
    }

    // Derived states
    const numberCount = inputNumbers.split('\n').filter(s => s.trim().length > 0).length

    const processNumbers = () => {
        // Split by newline to support CSV styled "999999999, Name"
        const lines = inputNumbers.split('\n').filter(line => line.trim().length > 0)

        const cleaned: MessageQueueItem[] = []

        lines.forEach((line, idx) => {
            // Check if line has comma
            const parts = line.split(',')
            const rawNumber = parts[0].trim()
            const name = parts.length > 1 ? parts[1].trim() : undefined

            let cleanNumber = rawNumber.replace(/\D/g, '')
            // Default to India 91 if length is 10
            if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber

            if (cleanNumber.length >= 10) {
                cleaned.push({
                    id: idx,
                    phoneNumber: cleanNumber,
                    name: name,
                    status: 'pending'
                })
            }
        })

        if (cleaned.length === 0) {
            alert('No valid numbers found')
            return
        }

        setQueue(cleaned)
        setIsQueueReady(true)
    }

    const handleSendClick = (id: number, phone: string, name?: string) => {
        // Personalize message
        let finalMessage = message
        if (name) {
            finalMessage = finalMessage.replace(/{name}/gi, name)
        } else {
            // If no name but variable exists, replace with generic or empty
            finalMessage = finalMessage.replace(/{name}/gi, 'Customer')
        }

        const encodedMsg = encodeURIComponent(finalMessage)
        const url = `https://wa.me/${phone}?text=${encodedMsg}`
        window.open(url, '_blank')

        setQueue(prev => prev.map(item =>
            item.id === id ? { ...item, status: 'sent' } : item
        ))
    }

    const insertFormatting = (char: string) => {
        setMessage(prev => prev + char)
    }

    const reset = () => {
        setIsQueueReady(false)
        setQueue([])
        setInputNumbers('')
        setMessage('')
    }

    // Helper to get next pending
    const nextPending = queue.find(q => q.status === 'pending')

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">WhatsApp Bulk Sender (Advanced)</h2>
                        <p className="text-sm text-gray-500">Send personalized messages to a list. Supports "Number, Name" format.</p>
                    </div>
                </div>

                {!isQueueReady ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Phone Numbers Input */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-gray-700 font-medium">Phone Numbers List</Label>
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                        {numberCount} lines
                                    </span>
                                </div>
                                <div className="relative">
                                    <textarea
                                        className="w-full p-4 border rounded-lg text-sm min-h-[250px] font-mono leading-relaxed bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                                        placeholder={`Enter one contact per line:
9876543210
9988776655, John Doe
8877665544, Sarah`}
                                        value={inputNumbers}
                                        onChange={(e) => setInputNumbers(e.target.value)}
                                    />
                                    {inputNumbers && (
                                        <button
                                            onClick={() => setInputNumbers('')}
                                            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-50 transition-colors"
                                            title="Clear List"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Format: <code>Number</code> or <code>Number, Name</code>
                                </p>
                            </div>

                            {/* Message Input */}
                            <div className="space-y-2 flex flex-col relative">
                                <div className="flex justify-between items-center">
                                    <Label className="text-gray-700 font-medium">Message Content</Label>
                                    {savedTemplates.length > 0 && (
                                        <button
                                            onClick={() => setShowTemplates(!showTemplates)}
                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            <FileText className="h-3 w-3" /> Load Template
                                        </button>
                                    )}
                                </div>

                                {showTemplates && (
                                    <div className="absolute top-8 left-0 right-0 z-10 bg-white border shadow-lg rounded-lg p-2 max-h-[200px] overflow-y-auto">
                                        <p className="text-xs font-semibold text-gray-500 px-2 py-1">Saved Templates</p>
                                        {savedTemplates.map((t, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer group">
                                                <span onClick={() => loadTemplate(t.content)} className="text-sm truncate flex-1">{t.name}</span>
                                                <button onClick={() => deleteTemplate(i)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><Trash2 className="h-3 w-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="border rounded-lg flex-1 flex flex-col bg-white overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent z-0">
                                    <div className="bg-gray-50 border-b px-3 py-2 flex flex-wrap gap-1 items-center">
                                        <button onClick={() => insertFormatting('*')} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Bold (*text*)">
                                            <Bold className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => insertFormatting('_')} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Italic (_text_)">
                                            <Italic className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => insertFormatting('~')} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Strikethrough (~text~)">
                                            <Strikethrough className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => insertFormatting('```')} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Monospace (```text```)">
                                            <Code className="h-4 w-4" />
                                        </button>
                                        <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                        <button onClick={() => insertFormatting('{name}')} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium transition-colors" title="Insert Name Variable">
                                            <UserPlus className="h-3 w-3" /> Insert Name
                                        </button>
                                        <div className="flex-1"></div>
                                        <button onClick={saveTemplate} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Save as Template">
                                            <Save className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <textarea
                                        className="w-full flex-1 p-4 text-sm bg-white text-gray-900 border-none outline-none resize-none min-h-[190px]"
                                        placeholder="Type your message here... Use {name} to insert the contact's name."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                    <div className="bg-gray-50 border-t px-3 py-2 text-right">
                                        <span className="text-xs text-gray-500">
                                            {message.length} characters
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button
                                onClick={processNumbers}
                                className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                                disabled={!inputNumbers.trim() || !message.trim()}
                            >
                                Process & Preview ({numberCount})
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg border border-green-100">
                            <div>
                                <h3 className="font-semibold text-green-900">Ready to Send</h3>
                                <p className="text-sm text-green-700">
                                    {queue.filter(q => q.status === 'sent').length} / {queue.length} sent
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={reset}>Start Over</Button>
                        </div>

                        {/* Current Action Item */}
                        {nextPending ? (
                            <div className="bg-blue-50 border border-blue-100 p-8 rounded-xl text-center space-y-6 shadow-sm">
                                <div>
                                    <h4 className="text-gray-500 font-medium uppercase text-sm tracking-wider mb-2">Next recipient</h4>
                                    <div className="text-4xl font-bold text-gray-900 font-mono tracking-wider">
                                        +{nextPending.phoneNumber}
                                    </div>
                                    {nextPending.name && (
                                        <div className="text-sm text-blue-600 mt-1 font-medium bg-blue-100 inline-block px-2 py-0.5 rounded">
                                            For: {nextPending.name}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    size="lg"
                                    onClick={() => handleSendClick(nextPending.id, nextPending.phoneNumber, nextPending.name)}
                                    className="bg-green-600 hover:bg-green-700 text-white w-full max-w-sm gap-3 text-xl h-14 shadow-lg hover:from-green-600 hover:to-green-700 transitionm-all transform hover:scale-105"
                                >
                                    <Send className="h-6 w-6" /> Send WhatsApp
                                </Button>
                                <p className="text-xs text-gray-400">Clicking will open WhatsApp Web/App in a new tab with the pre-filled message.</p>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-100 p-8 rounded-lg text-center space-y-2">
                                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                                    <CheckCircle className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">All Done!</h3>
                                <p className="text-gray-600">All {queue.length} messages have been processed.</p>
                                <Button onClick={reset} className="mt-4">Send New Batch</Button>
                            </div>
                        )}

                        {/* List View */}
                        <div className="border rounded-lg overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-4 py-3 border-b text-xs font-semibold text-gray-500 uppercase flex justify-between items-center">
                                <span>Queue Status</span>
                                <span>{queue.length} Total</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto divide-y">
                                {queue.map((item) => (
                                    <div key={item.id} className={`flex items-center justify-between p-3 ${item.status === 'sent' ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${item.status === 'sent' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                <Smartphone className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`font-mono text-sm ${item.status === 'sent' ? 'text-gray-400 decoration-slate-400 line-through' : 'text-gray-900 font-medium'}`}>
                                                    +{item.phoneNumber}
                                                </span>
                                                {item.name && (
                                                    <span className="text-[10px] text-gray-500 font-medium">
                                                        {item.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {item.status === 'sent' ? (
                                            <span className="text-xs text-green-600 font-medium flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                                                <CheckCircle className="h-3 w-3" /> Sent
                                            </span>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs hover:bg-green-50 hover:text-green-700"
                                                onClick={() => handleSendClick(item.id, item.phoneNumber, item.name)}
                                            >
                                                Send Now
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Preview of Message */}
            {message && (
                <div className="bg-gray-100 p-6 rounded-xl border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Message Preview</p>
                    <div className="bg-white p-4 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl max-w-sm shadow-sm inline-block border border-gray-100">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{message}</p>
                        <div className="mt-2 text-[10px] text-gray-400 text-right">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                </div>
            )}
        </div>
    )
}
