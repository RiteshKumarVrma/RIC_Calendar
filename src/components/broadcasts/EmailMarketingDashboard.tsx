'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Send,
    Users,
    Settings,
    Play,
    Pause,
    RefreshCw,
    Terminal,
    AlertCircle,
    CheckCircle,
    Mail
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { createClient } from '@/lib/supabase/client'
import { startSimpleCampaign } from '@/app/dashboard/actions/broadcasts'

export default function EmailMarketingDashboard() {
    // --- STATE ---
    const [mode, setMode] = useState<'compose' | 'running'>('compose')

    // Config
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [audienceType, setAudienceType] = useState<'manual' | 'tags'>('manual')
    const [manualEmails, setManualEmails] = useState('')
    const [tags, setTags] = useState('')

    // Safety
    const [dailyLimit, setDailyLimit] = useState(100)
    const [delayRange, setDelayRange] = useState([30, 60]) // Seconds

    // Live Stats
    const [logs, setLogs] = useState<{ time: string, msg: string, type: 'info' | 'success' | 'error' }[]>([])
    const [stats, setStats] = useState({ sent: 0, pending: 0, failed: 0 })
    const [workerStatus, setWorkerStatus] = useState<'idle' | 'active' | 'paused'>('idle')

    // --- HELPERS ---
    const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        const time = new Date().toLocaleTimeString()
        setLogs(prev => [{ time, msg, type }, ...prev].slice(0, 100))
    }

    // --- ACTIONS ---
    const handleStart = async () => {
        if (!subject || !body) {
            addLog('Missing Subject or Body', 'error')
            return
        }

        let targetEmails: string[] = []

        if (audienceType === 'manual') {
            targetEmails = manualEmails.split(/[\n,]+/)
                .map(e => e.trim())
                .filter(e => e.includes('@'))

            if (targetEmails.length === 0) {
                addLog('No valid emails found in list', 'error')
                return
            }
        }
        // Note: 'tags' support would require fetching contacts first. 
        // For this "Best Way" reset, let's focus on Manual List first as it's most transparent.

        setMode('running')
        setWorkerStatus('active')
        addLog(`Initializing campaign for ${targetEmails.length} recipients...`)

        // 1. Send to Backend (to insert into DB)
        // We will repurpose 'simple_emails' table or similar for this unified view
        // Ideally we pass subject/body to the DB row or a parent campaign row. 
        // For the "Simple" approach, let's assume the Worker reads the LATEST configuration 
        // OR we include the content in the INSERT payload if we modified the table.
        // Let's stick to the "Simple" action we made, but pass the content?
        // Wait, the previous simple action only took emails. 
        // We need to update the action to handle Subject/Body.

        const result = await startSimpleCampaign(targetEmails, subject, body)
        if (result.error) {
            addLog(`Failed to start: ${result.error}`, 'error')
            setMode('compose')
            return
        }

        addLog('Queue loaded into Database.', 'success')
        addLog('Worker should pick this up shortly...')
    }

    const handleStop = () => {
        setWorkerStatus('paused')
        addLog('Campaign paused by user.', 'info')
        // In real app, call Server Action to flip a "paused" flag in DB
    }

    // --- LIVE POLLING ---
    useEffect(() => {
        if (mode === 'running') {
            const supabase = createClient()
            const interval = setInterval(async () => {
                // 1. Fetch Stats
                const { count: sent } = await supabase.from('simple_emails').select('*', { count: 'exact', head: true }).eq('status', 'sent')
                const { count: pending } = await supabase.from('simple_emails').select('*', { count: 'exact', head: true }).eq('status', 'pending')
                const { count: failed } = await supabase.from('simple_emails').select('*', { count: 'exact', head: true }).eq('status', 'failed')

                setStats({ sent: sent || 0, pending: pending || 0, failed: failed || 0 })

                // 2. Fetch Recent Sends (for logs) - Optional, or just rely on local simulation for now
                // Real implementation would subscribe to Postgres Changes

                if (pending === 0 && (sent || 0) > 0) {
                    setWorkerStatus('idle')
                    addLog('All emails processed!', 'success')
                    clearInterval(interval)
                }

            }, 2000)
            return () => clearInterval(interval)
        }
    }, [mode])

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto h-[calc(100vh-100px)]">

            {/* LEFT COLUMN: SETUP */}
            <div className="lg:col-span-7 space-y-6 overflow-y-auto pr-2">

                {/* 1. CONFIGURATION CARD */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Settings className="h-5 w-5 text-indigo-600" />
                            Campaign Setup
                        </h2>
                        <div className="text-xs text-gray-500 font-mono">
                            Daily Limit: {dailyLimit}
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Audience */}
                        <div className="space-y-3">
                            <Label className="text-gray-700 font-medium">1. Audience</Label>
                            <div className="flex gap-4 mb-2">
                                <button
                                    onClick={() => setAudienceType('manual')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${audienceType === 'manual' ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Manual List
                                </button>
                                <button
                                    onClick={() => setAudienceType('tags')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${audienceType === 'tags' ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Database Tags
                                </button>
                            </div>

                            {audienceType === 'manual' ? (
                                <div className="space-y-1">
                                    <textarea
                                        value={manualEmails}
                                        onChange={e => setManualEmails(e.target.value)}
                                        placeholder="paste@emails.com, here@example.com..."
                                        className="w-full h-32 rounded-md border-gray-300 text-sm p-3 font-mono text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <p className="text-xs text-gray-500 text-right">
                                        {manualEmails.split('@').length - 1} Valid Emails
                                    </p>
                                </div>
                            ) : (
                                <Input
                                    placeholder="Enter tags (e.g. vip, lead)..."
                                    value={tags}
                                    onChange={e => setTags(e.target.value)}
                                />
                            )}
                        </div>

                        {/* Content */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <Label className="text-gray-700 font-medium">2. Content</Label>

                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">Subject Line</Label>
                                <Input
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    placeholder="e.g. Special Invitation"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">Email Body (HTML supported)</Label>
                                <textarea
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    placeholder="Hello {{name}}, I wanted to reach out..."
                                    className="w-full h-48 rounded-md border-gray-300 text-sm p-3 text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <div className="text-xs text-gray-400">Available Variables: {'{{name}}'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                        <div className="flex items-center gap-2 mr-auto text-xs text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                            <AlertCircle className="h-3 w-3" />
                            Sending via Gmail (Safety Delay: {delayRange[0]}-{delayRange[1]}s)
                        </div>

                        {mode === 'compose' ? (
                            <Button
                                onClick={handleStart}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                            >
                                <Play className="h-4 w-4 mr-2" />
                                Start Campaign
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setMode('compose')}
                                variant="outline"
                            >
                                Edit / Reset
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: TERMINAL & STATUS */}
            <div className="lg:col-span-5 space-y-6">

                {/* 1. STATUS CARD */}
                <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 text-white overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-950">
                        <h2 className="font-semibold flex items-center gap-2 text-gray-200">
                            <Terminal className="h-5 w-5 text-green-400" />
                            Live Console
                        </h2>
                        <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${workerStatus === 'active' ? 'bg-green-900/30 text-green-400 animate-pulse' :
                                workerStatus === 'paused' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-gray-800 text-gray-500'
                            }`}>
                            {workerStatus === 'active' ? '● System Active' : '● System Idle'}
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-3 gap-4 border-b border-gray-800 bg-gray-900/50">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-100">{stats.sent}</div>
                            <div className="text-xs text-gray-500 uppercase">Sent</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">{stats.pending}</div>
                            <div className="text-xs text-gray-500 uppercase">Pending</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
                            <div className="text-xs text-gray-500 uppercase">Failed</div>
                        </div>
                    </div>

                    <div className="h-96 p-4 overflow-y-auto font-mono text-xs space-y-1 bg-black/50 scrollbar-thin scrollbar-thumb-gray-700">
                        {logs.length === 0 && (
                            <div className="text-gray-600 italic p-2">Ready to initialize...</div>
                        )}
                        {logs.map((log, i) => (
                            <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' :
                                    log.type === 'success' ? 'text-green-400' : 'text-gray-300'
                                }`}>
                                <span className="text-gray-600 select-none">[{log.time}]</span>
                                <span>{log.msg}</span>
                            </div>
                        ))}
                        {mode === 'running' && stats.pending > 0 && (
                            <div className="text-gray-500 animate-pulse pt-2">_ Worker is processing queue...</div>
                        )}
                    </div>
                </div>

                {/* 2. ACTIONS */}
                {mode === 'running' && (
                    <div className="flex gap-2 justify-end">
                        <Button variant="destructive" onClick={handleStop} className="w-full">
                            <Pause className="h-4 w-4 mr-2" />
                            Pause Processing
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
