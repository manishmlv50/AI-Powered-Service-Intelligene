import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAgent } from '../../hooks/useAgent'
import { getCustomerJobDetail, getCustomerJobEstimate } from '../../api/customers'
import { approveEstimate, rejectEstimate } from '../../api/estimates'
import StatusBadge from '../../components/ui/StatusBadge'

export default function CustomerJobCardDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { call: agentCall } = useAgent()

    const [job, setJob] = useState(null)
    const [estimate, setEstimate] = useState(null)
    const [loading, setLoading] = useState(true)
    const [approvalBusy, setApprovalBusy] = useState(false)

    const toNumber = (value) => {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : 0
    }

    useEffect(() => {
        let mounted = true

        const load = async () => {
            if (!user?.user_id || !id) {
                if (mounted) setLoading(false)
                return
            }

            try {
                setLoading(true)
                const [jobRes, estimateRes] = await Promise.all([
                    getCustomerJobDetail(user.user_id, id),
                    getCustomerJobEstimate(user.user_id, id),
                ])

                if (!mounted) return
                setJob(jobRes?.data || null)
                setEstimate(estimateRes?.data || null)
            } catch (err) {
                console.error('CustomerJobCardDetail load error:', err)
                if (mounted) {
                    setJob(null)
                    setEstimate(null)
                }
            } finally {
                if (mounted) setLoading(false)
            }
        }

        load()
        return () => { mounted = false }
    }, [id, user?.user_id])

    if (loading) {
        return (
            <div className="page">
                <div className="skeleton" style={{ height: 320 }} />
            </div>
        )
    }

    if (!job) {
        return (
            <div className="page">
                <div className="page-header">
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/customer/jobs')}>
                        <ArrowLeft size={14} /> Back to Jobs
                    </button>
                </div>
                <div className="card empty-state">
                    <p>Job card not found.</p>
                </div>
            </div>
        )
    }

    const estimatePayload = estimate && typeof estimate === 'object'
        ? (estimate.estimate && typeof estimate.estimate === 'object' ? estimate.estimate : estimate)
        : null

    const rawLineItems = Array.isArray(estimatePayload?.line_items) ? estimatePayload.line_items : []
    const safeLineItems = rawLineItems.map((item, index) => {
        const quantity = toNumber(item?.quantity)
        const unitPrice = toNumber(item?.unit_price)
        const total = item?.total != null ? toNumber(item.total) : quantity * unitPrice

        return {
            key: item?.reference_id || `${item?.name || 'line'}-${index}`,
            type: typeof item?.type === 'string' ? item.type : '',
            reference_id: item?.reference_id || '—',
            name: item?.name || 'Unnamed item',
            related_fault: item?.related_fault || '—',
            resolves_task: item?.resolves_task || '—',
            quantity,
            unit_price: unitPrice,
            total,
        }
    })

    const partsFromItems = safeLineItems.reduce((sum, item) => (
        item.type?.toLowerCase() === 'part' ? sum + item.total : sum
    ), 0)
    const laborFromItems = safeLineItems.reduce((sum, item) => (
        item.type?.toLowerCase() === 'labor' ? sum + item.total : sum
    ), 0)

    const partsTotal = estimatePayload?.parts_total != null ? toNumber(estimatePayload.parts_total) : partsFromItems
    const laborTotal = estimatePayload?.labor_total != null
        ? toNumber(estimatePayload.labor_total)
        : (estimatePayload?.labour_total != null ? toNumber(estimatePayload.labour_total) : laborFromItems)
    const taxTotal = estimatePayload?.tax != null ? toNumber(estimatePayload.tax) : 0
    const subTotal = partsTotal + laborTotal
    const totalAmount = estimatePayload?.total_amount != null ? toNumber(estimatePayload.total_amount) : (subTotal + taxTotal)

    const currencyCode = typeof estimatePayload?.currency === 'string' && estimatePayload.currency.trim()
        ? estimatePayload.currency.trim().toUpperCase()
        : 'INR'
    const currencySymbol = '$'
    const formatAmount = (value) => `${currencySymbol}${toNumber(value).toLocaleString('en-IN')}`

    const estimateStatus = estimatePayload?.status || estimate?.status || null
    const estimateId = estimatePayload?.id || estimatePayload?.estimate_id || estimate?.id || estimate?.estimate_id || null

    const handleApproval = async (isReject) => {
        if (!estimateId || approvalBusy) return
        setApprovalBusy(true)
        const jobCardId = job?.id || id
        const vehicleId = job?.vehicle_id || estimatePayload?.vehicle_id || null
        const customerId = user?.user_id || job?.customer_id || null
        const approvalText = isReject ? 'I reject the estimate.' : 'I approve the estimate.'
        try {
            if (customerId && jobCardId && vehicleId) {
                await agentCall({
                    action: 'chat',
                    question: approvalText,
                    customer_id: customerId,
                    job_card_id: jobCardId,
                    vehicle_id: vehicleId,
                })
            }
            if (isReject) {
                await rejectEstimate(estimateId)
                setEstimate(prev => (prev ? { ...prev, status: 'rejected' } : prev))
                setJob(prev => (prev ? { ...prev, status: 'rejected' } : prev))
            } else {
                await approveEstimate(estimateId)
                setEstimate(prev => (prev ? { ...prev, status: 'approved' } : prev))
                setJob(prev => (prev ? { ...prev, status: 'approved' } : prev))
            }
        } catch (err) {
            console.error('Approval update failed:', err)
        } finally {
            setApprovalBusy(false)
        }
    }

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/customer/jobs')} style={{ marginBottom: 8 }}>
                        <ArrowLeft size={14} /> Back
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="page-title">{job.id}</div>
                        <StatusBadge status={job.status} />
                    </div>
                    <div className="page-subtitle">{job.customer_name} · {job.vehicle_make} {job.vehicle_model} {job.vehicle_year}</div>
                </div>
            </div>

            <div className="grid-2" style={{ alignItems: 'start' }}>
                <div>
                    <div className="card">
                        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Job Details</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div className="grid-2">
                                <div className="form-group"><label className="form-label">Customer Name</label><input className="form-control" value={job.customer_name || ''} readOnly /></div>
                                <div className="form-group"><label className="form-label">Service Type</label><input className="form-control" value={job.service_type || ''} readOnly /></div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group"><label className="form-label">Make</label><input className="form-control" value={job.vehicle_make || ''} readOnly /></div>
                                <div className="form-group"><label className="form-label">Model</label><input className="form-control" value={job.vehicle_model || ''} readOnly /></div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group"><label className="form-label">Year</label><input className="form-control" value={job.vehicle_year || ''} readOnly /></div>
                                <div className="form-group"><label className="form-label">Mileage</label><input className="form-control" value={job.mileage || ''} readOnly /></div>
                            </div>
                            <div className="form-group"><label className="form-label">VIN</label><input className="form-control" value={job.vin || ''} readOnly /></div>
                            <div className="form-group">
                                <label className="form-label">Complaint</label>
                                <textarea className="form-control" rows={3} value={job.complaint || ''} readOnly />
                            </div>
                            {Array.isArray(job.obd_fault_codes) && job.obd_fault_codes.length > 0 && (
                                <div className="form-group">
                                    <label className="form-label">OBD Fault Codes</label>
                                    <div>{job.obd_fault_codes.map(code => <span key={code} className="fault-code">{code}</span>)}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {job.status === 'pending_approval' && estimatePayload && (
                        <div className="card" style={{ marginTop: 16 }}>
                            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Approval Required</h3>
                            {approvalBusy && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <span className="typing-dot" />
                                    <span className="typing-dot" />
                                    <span className="typing-dot" />
                                    Updating status…
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span style={{ fontWeight: 600 }}>Estimate Total</span>
                                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{formatAmount(totalAmount)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleApproval(false)} disabled={approvalBusy || !estimateId}>
                                    Approve Estimate
                                </button>
                                <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleApproval(true)} disabled={approvalBusy || !estimateId}>
                                    Reject Estimate
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    {!estimatePayload ? (
                        <div className="card empty-state" style={{ minHeight: 200 }}>
                            <Sparkles size={30} color="var(--primary)" style={{ opacity: 0.4 }} />
                            <p>No estimate available yet</p>
                        </div>
                    ) : (
                        <div className="card anim-slideUp">
                            <div className="card-header">
                                <h3 style={{ fontWeight: 700 }}>
                                    Estimate
                                    {/* {estimateStatus && <StatusBadge status={estimateStatus} />} */}
                                </h3>
                            </div>
                            <table className="data-table" style={{ marginBottom: 16 }}>
                                <thead><tr><th>Item</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                                <tbody>
                                    <tr><td>Parts</td><td style={{ textAlign: 'right' }}>{formatAmount(partsTotal)}</td></tr>
                                    <tr><td>Labour</td><td style={{ textAlign: 'right' }}>{formatAmount(laborTotal)}</td></tr>
                                    <tr><td>Tax</td><td style={{ textAlign: 'right' }}>{formatAmount(taxTotal)}</td></tr>
                                </tbody>
                            </table>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-3)', borderRadius: 'var(--radius-sm)' }}>
                                <span style={{ fontWeight: 700 }}>Total</span>
                                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{formatAmount(totalAmount)}</span>
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 700 }}>Line Items</h4>
                                {safeLineItems.length === 0 ? (
                                    <div className="empty-state" style={{ minHeight: 90 }}>
                                        <p>No line items available for this estimate.</p>
                                    </div>
                                ) : (
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Type</th>
                                                <th>Ref</th>
                                                <th>Item</th>
                                                <th>Fault</th>
                                                <th>Task</th>
                                                <th style={{ textAlign: 'right' }}>Qty</th>
                                                <th style={{ textAlign: 'right' }}>Unit</th>
                                                <th style={{ textAlign: 'right' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {safeLineItems.map(item => (
                                                <tr key={item.key}>
                                                    <td>{item.type || '—'}</td>
                                                    <td>{item.reference_id}</td>
                                                    <td>{item.name}</td>
                                                    <td>{item.related_fault}</td>
                                                    <td>{item.resolves_task}</td>
                                                    <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                                                    <td style={{ textAlign: 'right' }}>{formatAmount(item.unit_price)}</td>
                                                    <td style={{ textAlign: 'right' }}>{formatAmount(item.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
