'use client'

import { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { Upload, Play, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

// Since we cannot call MCP directly from Client, we need a server action or API route.
// For now, let's assume we have a Server Action to trigger the MCP tool or we just insert directly to DB 
// and the MCP worker picks it up (which is safer/simpler).
// BUT the prompt requested MCP Tool integration. 
// A Client Component cannot call MCP. We'll use a Server Action bridge.

import { startSimpleCampaign } from '@/app/dashboard/actions/broadcasts'

export default function SimpleEmailPage() {
    const [emails, setEmails] = useState<string[]>([])
    const [status, setStatus] = useState<'idle' | 'countdown' | 'running' | 'finished'>('idle')
    const [countdown, setCountdown] = useState(60)
    const [progress, setProgress] = useState({ sent: 0, total: 0, failed: 0 })
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (evt) => {
            const bstr = evt.target?.result
            const wb = XLSX.read(bstr, { type: 'binary' })
            const wsName = wb.SheetNames[0]
            const ws = wb.Sheets[wsName]
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]

            // Extract emails (assume column 0 or find '@')
            const extracted: string[] = []
            data.flat().forEach(cell => {
                if (typeof cell === 'string' && cell.includes('@')) {
                    extracted.push(cell.trim())
                }
            })
            const unique = [...new Set(extracted)]
            setEmails(unique)
        }
        reader.readAsBinaryString(file)
    }

    const startCampaign = async () => {
        if (emails.length === 0) return

        // 1. Trigger Server Action to Load MCP
        await startSimpleCampaign(emails)

        // 2. Start Local UI Timer
        setStatus('countdown')
        setCountdown(60)

        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    // Timer done, switch to running
                    if (timerRef.current) clearInterval(timerRef.current)
                    setStatus('running')
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    // Poll for status update when running
    useEffect(() => {
        if (status === 'running') {
            const interval = setInterval(async () => {
                // Fetch progress from Supabase directly for real-time feel
                const supabase = createClient()

                // Get counts
                const { count: sent } = await supabase.from('simple_emails')
                    .select('*', { count: 'exact', head: true }).eq('status', 'sent')
                const { count: failed } = await supabase.from('simple_emails')
                    .select('*', { count: 'exact', head: true }).eq('status', 'failed')
                const { count: total } = await supabase.from('simple_emails')
                    .select('*', { count: 'exact', head: true })

                setProgress({
                    sent: sent || 0,
                    failed: failed || 0,
                    total: total || 0
                })

                if ((sent || 0) + (failed || 0) >= (total || 0) && (total || 0) > 0) {
                    setStatus('finished')
                    clearInterval(interval)
                }

            }, 2000) // Poll every 2s

            return () => clearInterval(interval)
        }
    }, [status])


    return (
        <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">Simple Email Campaign</h1>
                <p className="text-gray-500">Upload Excel &#8594; Wait 60s &#8594; Auto-Send Safeguard</p>
            </div>

            {/* Zone 1: Upload */}
            <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${emails.length > 0 ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-indigo-400'}`}>
                <Upload className={`h-10 w-10 mx-auto mb-4 ${emails.length > 0 ? 'text-green-600' : 'text-gray-400'}`} />

                {emails.length === 0 ? (
                    <>
                        <label className="cursor-pointer">
                            <span className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">Select Excel File</span>
                            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                        </label>
                        <p className="mt-2 text-xs text-gray-500">Only emails columns are extracted.</p>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="text-2xl font-bold text-green-700">{emails.length} Emails Found</div>
                        <p className="text-sm text-green-600">Duplicates removed. Ready to queue.</p>
                        {status === 'idle' && (
                            <Button onClick={() => setEmails([])} variant="outline" className="text-sm">Reset</Button>
                        )}
                    </div>
                )}
            </div>

            {/* Zone 2: Start Button */}
            {emails.length > 0 && status === 'idle' && (
                <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4">
                    <Button onClick={startCampaign} className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-8 py-6 h-auto">
                        <Play className="mr-2 h-5 w-5" /> START CAMPAIGN
                    </Button>
                </div>
            )}

            {/* Zone 3: Countdown & Progress */}
            {(status === 'countdown' || status === 'running' || status === 'finished') && (
                <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center space-y-6 animate-in zoom-in-95">

                    {status === 'countdown' && (
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-500 uppercase tracking-widest">Starting In</div>
                            <div className="text-6xl font-mono font-bold text-indigo-600 tabular-nums">
                                {countdown < 10 ? `0${countdown}` : countdown}
                            </div>
                            <p className="text-xs text-orange-500 flex items-center justify-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> do not close this window
                            </p>
                        </div>
                    )}

                    {status === 'running' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold text-lg animate-pulse">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Sending Emails...
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                <div
                                    className="bg-green-500 h-4 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${(progress.sent / progress.total) * 100}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-gray-50 p-3 rounded">
                                    <div className="text-xs text-gray-500">Total</div>
                                    <div className="font-bold">{progress.total}</div>
                                </div>
                                <div className="bg-green-50 p-3 rounded">
                                    <div className="text-xs text-green-600">Sent</div>
                                    <div className="font-bold text-green-700">{progress.sent}</div>
                                </div>
                                <div className="bg-red-50 p-3 rounded">
                                    <div className="text-xs text-red-600">Failed</div>
                                    <div className="font-bold text-red-700">{progress.failed}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'finished' && (
                        <div className="space-y-4">
                            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="h-8 w-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-green-900">Campaign Complete!</h2>
                            <p className="text-gray-600">Successfully sent {progress.sent} emails.</p>
                            <Button onClick={() => window.location.reload()} variant="outline">Start New Campaign</Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
