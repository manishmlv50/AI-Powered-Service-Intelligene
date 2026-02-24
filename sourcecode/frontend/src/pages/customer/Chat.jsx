import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useAgent } from '../../hooks/useAgent'
import { getEstimateByJob } from '../../api/estimates'
import { getHistory } from '../../api/customers'
import { approveEstimate, rejectEstimate } from '../../api/estimates'
import { Send, CheckCircle, XCircle, ChevronDown, ChevronUp, PartyPopper } from 'lucide-react'

export default function CustomerChat() {
    const { user } = useAuth()
    const { call: agentCall, loading } = useAgent()
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [pendingJob, setPendingJob] = useState(null)
    const [estimate, setEstimate] = useState(null)
    const [expanded, setExpanded] = useState(false)
    const [celebrated, setCelebrated] = useState(false)
    const endRef = useRef()

    const addMsg = (role, content) => setMessages(m => [...m, { role, content, ts: Date.now() }])

    useEffect(() => {
        // Simulate incoming notification from service centre
        const init = async () => {
            addMsg('system', `👋 Welcome back, **${user?.name}**! You have a message from the service centre.`)
            await new Promise(r => setTimeout(r, 800))
            try {
                const hist = await getHistory(user?.user_id)
                const pendingJobs = hist.data?.filter(j => j.status === 'pending_approval')
                if (pendingJobs?.length) {
                    const job = pendingJobs[0]
                    setPendingJob(job)
                    const est = await getEstimateByJob(job.id)
                    setEstimate(est.data)
                    addMsg('system', `🔔 Your estimate for job **${job.id}** (${job.vehicle_make} ${job.vehicle_model}) is ready for review.`)
                } else {
                    addMsg('system', `You have no pending estimates. Use the chat below to ask about your service status.`)
                }
            } catch {
                addMsg('system', `Your estimate for job **J002** is ready. Total: **₹5,900**. Please review and respond.`)
                setEstimate({ id: 'E002', job_card_id: 'J002', status: 'pending_approval', parts_total: 3200, labor_total: 1800, tax: 900, total_amount: 5900 })
                setPendingJob({ id: 'J002', vehicle_make: 'Hyundai', vehicle_model: 'Creta', vehicle_year: 2022, complaint: 'Fuel pressure low' })
            }
        }
        init()
    }, [user])

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

    const send = async () => {
        const msg = input.trim()
        if (!msg) return
        setInput('')
        addMsg('user', msg)
        const res = await agentCall({ action: 'customer_qa', user_input: msg, job_card_id: pendingJob?.id })
        const reply = res?.result?.reply || res?.result?.communication?.message || "Our team is looking into your query. I'll update you shortly!"
        addMsg('system', reply)
    }

    const approve = async () => {
        if (!estimate) return
        try { await approveEstimate(estimate.id) } catch { }
        setEstimate(e => ({ ...e, status: 'approved' }))
        setPendingJob(null)
        addMsg('system', `✅ **Estimate approved!** Great choice. We'll begin work on your vehicle right away. You'll receive updates here.`)
    }

    const reject = async () => {
        if (!estimate) return
        try { await rejectEstimate(estimate.id) } catch { }
        setEstimate(e => ({ ...e, status: 'rejected' }))
        setPendingJob(null)
        addMsg('system', `Your rejection has been noted. Our service advisor will contact you shortly to discuss alternatives.`)
    }

    const renderContent = (content) => content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-h))', background: 'var(--surface)' }}>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20%' }}>
                {messages.map((m, i) => (
                    <div key={m.ts || i} style={{ marginBottom: 16, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        {m.role === 'user' ? (
                            <div className="bubble-user" dangerouslySetInnerHTML={{ __html: renderContent(m.content) }} />
                        ) : (
                            <div style={{ maxWidth: '80%' }}>
                                <div className="bubble-system" dangerouslySetInnerHTML={{ __html: renderContent(m.content) }} />

                                {/* Estimate card — show after notification */}
                                {i === messages.length - 1 && estimate && estimate.status === 'pending_approval' && (
                                    <div className="card anim-slideUp" style={{ marginTop: 12, border: '1px solid var(--border-hover)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{pendingJob?.vehicle_make} {pendingJob?.vehicle_model}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pendingJob?.complaint}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total</div>
                                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>₹{estimate.total_amount?.toLocaleString()}</div>
                                            </div>
                                        </div>

                                        {/* Expand/collapse line items */}
                                        <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
                                            onClick={() => setExpanded(v => !v)}>
                                            {expanded ? <><ChevronUp size={13} /> Hide details</> : <><ChevronDown size={13} /> View full estimate</>}
                                        </button>

                                        {expanded && (
                                            <table className="data-table" style={{ marginBottom: 10 }}>
                                                <thead><tr><th>Item</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                                                <tbody>
                                                    <tr><td>Parts</td><td style={{ textAlign: 'right' }}>₹{estimate.parts_total?.toLocaleString()}</td></tr>
                                                    <tr><td>Labour</td><td style={{ textAlign: 'right' }}>₹{estimate.labor_total?.toLocaleString()}</td></tr>
                                                    <tr><td>Tax (18% GST)</td><td style={{ textAlign: 'right' }}>₹{estimate.tax?.toLocaleString()}</td></tr>
                                                </tbody>
                                            </table>
                                        )}

                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }} onClick={approve}>
                                                <CheckCircle size={15} /> Accept Estimate
                                            </button>
                                            <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={reject}>
                                                <XCircle size={15} /> Reject
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div style={{ display: 'flex', gap: 5, padding: '10px 0' }}>
                        <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* Input bar */}
            <div style={{ padding: '16px 20%', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                    <input className="form-control" value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && send()}
                        placeholder="Ask about your service, invoice, status…" />
                    <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()}>
                        <Send size={15} />
                    </button>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 6, textAlign: 'center' }}>
                    AI responses powered by Azure AI Foundry
                </p>
            </div>
        </div>
    )
}
