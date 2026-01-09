'use client'

import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Upload, Play, Ban, Trash2, StopCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { startSimpleCampaign } from '@/app/dashboard/actions/broadcasts'

export default function DirectSenderPage() {
    // State
    const [emails, setEmails] = useState<string[]>([])
    const [status, setStatus] = useState<'idle' | 'countdown' | 'running' | 'paused' | 'done'>('idle')
    const [countdown, setCountdown] = useState(60)
    const [nextSendTimer, setNextSendTimer] = useState(0)
    const [progress, setProgress] = useState({ sent: 0, pending: 0, failed: 0 })
    const [logs, setLogs] = useState<{ time: string, email: string, status: string }[]>([])

    // Refs for intervals to clear them properly
    const countdownRef = useRef<NodeJS.Timeout | null>(null)
    const pollRef = useRef<NodeJS.Timeout | null>(null)

    // 1. Excel Upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (evt) => {
            const bstr = evt.target?.result
            const wb = XLSX.read(bstr, { type: 'binary' })
            const ws = wb.Sheets[wb.SheetNames[0]]
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]

            const extracted: string[] = []
            data.flat().forEach(cell => {
                if (typeof cell === 'string' && cell.includes('@')) {
                    extracted.push(cell.trim().toLowerCase())
                }
            })
            const unique = [...new Set(extracted)]
            setEmails(unique)
        }
        reader.readAsBinaryString(file)
    }

    // 2. Start Logic
    const handleStart = async () => {
        if (emails.length === 0) return

        // Insert into DB for worker (using existing action for simplicity/reusability)
        // Note: We ignore subject/body as per strict requirement "No templates"
        // But our robust backend expects them. We will pass hardcoded placeholders.
        await startSimpleCampaign(emails, "Update", "Please see attachment.")

        setStatus('countdown')
        setCountdown(60)

        // Countdown Timer
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (countdownRef.current) clearInterval(countdownRef.current)
                    setStatus('running')
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    const handleStop = () => {
        setStatus('paused')
        if (pollRef.current) clearInterval(pollRef.current)
        if (countdownRef.current) clearInterval(countdownRef.current)
    }

    const handleReset = () => {
        handleStop()
        setEmails([])
        setStatus('idle')
        setLogs([])
        setProgress({ sent: 0, pending: 0, failed: 0 })
    }

    // 3. Status Polling (Live Updates)
    useEffect(() => {
        if (status === 'running') {
            const supabase = createClient()

            pollRef.current = setInterval(async () => {
                // Fetch Counts
                const { count: sent } = await supabase.from('simple_emails').select('*', { count: 'exact', head: true }).eq('status', 'sent')
                const { count: pending } = await supabase.from('simple_emails').select('*', { count: 'exact', head: true }).eq('status', 'pending')
                const { count: failed } = await supabase.from('simple_emails').select('*', { count: 'exact', head: true }).eq('status', 'failed')

                setProgress({
                    sent: sent || 0,
                    pending: pending || 0,
                    failed: failed || 0
                })

                // Completion Check
                if (pending === 0 && (sent || 0) > 0) {
                    setStatus('done')
                }

                // Simulating "Time until next send" visual since exact worker timing is server-side
                // We restart a 10s countdown visual every time 'sent' increases? 
                // Too complex for reliable client-side sync. 
                // Let's just show status.

            }, 2000)

            return () => {
                if (pollRef.current) clearInterval(pollRef.current)
            }
        }
    }, [status])

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8 border-b pb-4">Direct Email Sender</h1>

            <div className="grid gap-8">

                {/* 1. EXCEL UPLOAD */}
                <section className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        1. Upload List
                        {status !== 'idle' && <span className="text-xs font-normal text-gray-500">(Locked while running)</span>}
                    </h2>

                    {emails.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <label className="cursor-pointer">
                                <span className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-800 transition">Select Excel File</span>
                                <input type="file" className="hidden" accept=".xlsx,.csv" onChange={handleFileUpload} disabled={status !== 'idle'} />
                            </label>
                            <p className="mt-2 text-xs text-gray-500">.xlsx or .csv (one column only)</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-green-50 p-4 rounded border border-green-200">
                            <div>
                                <div className="text-2xl font-bold text-green-800">{emails.length}</div>
                                <div className="text-xs text-green-700">Valid Emails Ready</div>
                            </div>
                            {status === 'idle' && (
                                <Button variant="ghost" onClick={handleReset} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4 mr-2" /> Clear
                                </Button>
                            )}
                        </div>
                    )}
                </section>

                {/* 2. CONTROLS */}
                {emails.length > 0 && (
                    <section className="flex gap-4">
                        {status === 'idle' && (
                            <Button onClick={handleStart} className="w-full h-14 text-lg bg-green-600 hover:bg-green-700">
                                <Play className="mr-2" /> Start Sending Sequence
                            </Button>
                        )}
                        {(status === 'countdown' || status === 'running') && (
                            <Button onClick={handleStop} variant="destructive" className="w-full h-14 text-lg">
                                <StopCircle className="mr-2" /> Stop Immediately
                            </Button>
                        )}
                        {status === 'done' && (
                            <Button onClick={handleReset} variant="outline" className="w-full h-14 text-lg">
                                Start New Batch
                            </Button>
                        )}
                    </section>
                )}

                {/* 3. COUNTDOWN & PROGRESS */}
                {(status !== 'idle') && (
                    <section className="bg-gray-900 text-white p-6 rounded-lg font-mono">
                        <div className="grid grid-cols-2 gap-8 mb-6">
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Status</div>
                                <div className="text-xl font-bold text-yellow-500 uppercase">{status}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Next Action In</div>
                                <div className="text-3xl font-bold">
                                    {status === 'countdown' ? `${countdown}s` : 'Processing...'}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-6">
                            <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase">Live Progress</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end text-sm">
                                    <span className="text-gray-400">Total Progress</span>
                                    <span className="text-green-400 font-bold">{Math.round(((progress.sent + progress.failed) / (emails.length || 1)) * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${((progress.sent + progress.failed) / (emails.length || 1)) * 100}%` }}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-4 text-center text-sm">
                                    <div className="bg-gray-800 rounded p-2">
                                        <div className="text-gray-400 text-xs">PENDING</div>
                                        <div className="font-bold text-white">{progress.pending}</div>
                                    </div>
                                    <div className="bg-green-900/30 rounded p-2 border border-green-900">
                                        <div className="text-green-400 text-xs">SENT</div>
                                        <div className="font-bold text-white">{progress.sent}</div>
                                    </div>
                                    <div className="bg-red-900/30 rounded p-2 border border-red-900">
                                        <div className="text-red-400 text-xs">FAILED</div>
                                        <div className="font-bold text-white">{progress.failed}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                <div className="text-xs text-gray-400 text-center">
                    <p>⚠️ Strict Limit: Max 80 emails/day via Personal Gmail.</p>
                </div>

            </div>
        </div>
    )
}
