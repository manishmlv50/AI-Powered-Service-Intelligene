import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useAgent } from '../../hooks/useAgent'
import { getEstimateByJob } from '../../api/estimates'
import { getLatestJob, getVehicles } from '../../api/customers'
import { approveEstimate, rejectEstimate } from '../../api/estimates'
import { Send, CheckCircle, XCircle, ChevronDown, ChevronUp, PartyPopper } from 'lucide-react'

export default function CustomerChat() {
    const { user } = useAuth()
    const { call: agentCall, loading } = useAgent()
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [pendingJob, setPendingJob] = useState(null)
    const [latestJob, setLatestJob] = useState(null)
    const [vehicleId, setVehicleId] = useState(null)
    const [estimate, setEstimate] = useState(null)
    const [expanded, setExpanded] = useState(false)
    const [celebrated, setCelebrated] = useState(false)
    const endRef = useRef()
    const initForUserRef = useRef(null)

    const addMsg = (role, content) => setMessages(m => [...m, { role, content, ts: Date.now() }])

    useEffect(() => {
        if (!user?.user_id) return
        if (initForUserRef.current === user.user_id) return
        initForUserRef.current = user.user_id

        // Simulate incoming notification from service centre
        const init = async () => {
            addMsg('system', `👋 Welcome back, **${user?.name}**! You have a message from the service centre.`)
            await new Promise(r => setTimeout(r, 800))
            try {
                const [{ data: job }, { data: vehicles }] = await Promise.all([
                    getLatestJob(user?.user_id),
                    getVehicles(user?.user_id),
                ])
                setLatestJob(job || null)
                const vehicleList = Array.isArray(vehicles) ? vehicles : []
                const matchedVehicle = job?.vehicle_id
                    ? vehicleList.find(v => v.id === job.vehicle_id)
                    : null
                const resolvedVehicleId = matchedVehicle?.id || vehicleList[0]?.id || null
                setVehicleId(resolvedVehicleId)
                if (job?.status === 'pending_approval') {
                    setPendingJob(job)
                    const est = await getEstimateByJob(job.id)
                    setEstimate(est.data)
                }

                if (job?.id) {
                    if (job.status !== 'pending_approval') {
                        const statusLabel = (job.status || 'unknown').replace(/_/g, ' ')
                        addMsg('system', `📌 Latest job **${job.id}** (${job.vehicle_make} ${job.vehicle_model}) status: **${statusLabel}**.`)
                    }
                } else {
                    addMsg('system', `You have no active jobs. Use the chat below to ask about your service status.`)
                }
            } catch {
                addMsg('system', `Your estimate for job **J002** is ready. Total: **$5,900**. Please review and respond.`)
                setEstimate({ id: 'E002', job_card_id: 'J002', status: 'pending_approval', parts_total: 3200, labor_total: 1800, tax: 900, total_amount: 5900 })
                const fallbackJob = { id: 'J002', vehicle_make: 'Hyundai', vehicle_model: 'Creta', vehicle_year: 2022, complaint: 'Fuel pressure low' }
                setPendingJob(fallbackJob)
                setLatestJob(fallbackJob)
                setVehicleId(null)
            }
        }
        init()
    }, [user?.user_id, user?.name])

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

    const send = async () => {
        const msg = input.trim()
        if (!msg) return
        setInput('')
        addMsg('user', msg)
        const storedUser = (() => {
            try { return JSON.parse(localStorage.getItem('si_user')) } catch { return null }
        })()
        const customerId = user?.user_id || storedUser?.user_id
        const jobForChat = pendingJob || latestJob
        const resolvedVehicleId = jobForChat?.vehicle_id || vehicleId
        if (!customerId || !jobForChat?.id || !resolvedVehicleId) {
            addMsg('system', "I couldn't find your latest job card details. Please try again in a moment.")
            return
        }
        const res = await agentCall({
            action: 'chat',
            question: msg,
            customer_id: customerId,
            job_card_id: jobForChat.id,
            vehicle_id: resolvedVehicleId,
        })
        const reply =
            res?.result?.reply ||
            res?.result?.communication?.message ||
            res?.message ||
            res?.answer ||
            "Our team is looking into your query. I'll update you shortly!"
        addMsg('system', reply)
    }

    const sendApproval = async (approvalText, fallbackMsg) => {
        const storedUser = (() => {
            try { return JSON.parse(localStorage.getItem('si_user')) } catch { return null }
        })()
        const customerId = user?.user_id || storedUser?.user_id
        const jobForChat = pendingJob || latestJob
        const resolvedVehicleId = jobForChat?.vehicle_id || vehicleId
        if (!customerId || !jobForChat?.id || !resolvedVehicleId) {
            addMsg('system', "I couldn't find your latest job card details. Please try again in a moment.")
            return
        }

        try {
            const res = await agentCall({
                action: 'chat',
                question: approvalText,
                customer_id: customerId,
                job_card_id: jobForChat.id,
                vehicle_id: resolvedVehicleId,
            })
            const reply =
                res?.result?.reply ||
                res?.result?.communication?.message ||
                res?.message ||
                res?.answer ||
                fallbackMsg
            addMsg('system', reply)
        } catch {
            addMsg('system', fallbackMsg)
        }

        setEstimate(e => (e ? { ...e, status: approvalText.includes('reject') ? 'rejected' : 'approved' } : e))
        setPendingJob(null)
    }

    const approve = async () => {
        await sendApproval(
            'I approve the estimate.',
            `✅ **Estimate approved!** Great choice. We'll begin work on your vehicle right away. You'll receive updates here.`
        )
    }

    const reject = async () => {
        await sendApproval(
            'I reject the estimate.',
            `Your rejection has been noted. Our service advisor will contact you shortly to discuss alternatives.`
        )
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
                                {i === messages.length - 1 && estimate && ['pending_approval', 'pending'].includes(estimate.status) && (
                                    <div className="card anim-slideUp" style={{ marginTop: 12, border: '1px solid var(--border-hover)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{pendingJob?.vehicle_make} {pendingJob?.vehicle_model}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pendingJob?.complaint}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total</div>
                                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>${estimate.total_amount?.toLocaleString()}</div>
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
                                                    <tr><td>Parts</td><td style={{ textAlign: 'right' }}>${estimate.parts_total?.toLocaleString()}</td></tr>
                                                    <tr><td>Labour</td><td style={{ textAlign: 'right' }}>${estimate.labor_total?.toLocaleString()}</td></tr>
                                                    <tr><td>Tax (18% GST)</td><td style={{ textAlign: 'right' }}>${estimate.tax?.toLocaleString()}</td></tr>
                                                </tbody>
                                            </table>
                                        )}

                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setExpanded(true)}>
                                                View Estimate
                                            </button>
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
