import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getJobCard, updateJobCard, updateStatus } from '../../api/jobCards'
import { createEstimate, getEstimateByJob } from '../../api/estimates'
import { useAgent } from '../../hooks/useAgent'
import StatusBadge from '../../components/ui/StatusBadge'
import { Save, Sparkles, Send, CheckCircle, ArrowLeft } from 'lucide-react'

const STATUS_FLOW = ['draft', 'pending_approval', 'in_progress', 'completed', 'closed']

export default function JobCardDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const editMode = searchParams.get('edit') === '1'
    const { call: agentCall, loading: aiLoading } = useAgent()

    const [jc, setJc] = useState(null)
    const [form, setForm] = useState({})
    const [estimate, setEstimate] = useState(null)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)
    const [savedOnce, setSavedOnce] = useState(false)

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    useEffect(() => {
        getJobCard(id).then(r => 
            { 
                setJc(r.data); 
                setForm(r.data) 
            })
        getEstimateByJob(id).then(r => setEstimate(r.data)).catch(() => { })
    }, [id])

    const save = async () => {
        setSaving(true)
        try {
            await updateJobCard(id, form)

            if (estimatePayload) {
                const estimateForSave = {
                    vehicle_id: estimatePayload.vehicle_id || null,
                    currency: currencyCode,
                    line_items: safeLineItems.map(item => ({
                        type: item.type,
                        reference_id: item.reference_id === '—' ? '' : item.reference_id,
                        name: item.name,
                        related_fault: item.related_fault === '—' ? '' : item.related_fault,
                        resolves_task: item.resolves_task === '—' ? '' : item.resolves_task,
                        quantity: toNumber(item.quantity),
                        unit_price: toNumber(item.unit_price),
                        total: toNumber(item.total),
                    })),
                    parts_total: toNumber(partsTotal),
                    labor_total: toNumber(laborTotal),
                    tax: toNumber(taxTotal),
                    total_amount: toNumber(totalAmount),
                    grand_total: toNumber(totalAmount),
                }

                const estimateResponse = await createEstimate({
                    job_card_id: id,
                    parts_total: toNumber(partsTotal),
                    labor_total: toNumber(laborTotal),
                    tax: toNumber(taxTotal),
                    grand_total: toNumber(totalAmount),
                    estimate: estimateForSave,
                    estimation_json: estimateForSave,
                })

                if (estimateResponse?.data) {
                    setEstimate(estimateResponse.data)
                }
            }

            showToast('Job card saved')
            setSavedOnce(true)
        } catch (error) {
            showToast('Failed to save job card', 'error')
        } finally {
            setSaving(false)
        }
    }

    const generateEstimate = async () => {
        try {
            const jobCardPayload = jc?.intake_payload_json?.job_card || jc
            const agentResponse = await agentCall({
                action: 'estimate',
                job_card: jobCardPayload,
            })


            if (agentResponse?.estimate || agentResponse?.data?.estimate || agentResponse?.data) {
                setEstimate(agentResponse?.data || agentResponse)
            }
            else{
                showToast('Failed to generate estimate', 'error')
            }

            showToast('Estimate generated')
        } catch (error) {
            showToast('Failed to generate estimate', 'error')
        }
    }

    const sendApproval = async () => {
        await updateStatus(id, 'pending_approval')
        // await agentCall({ action: 'send_approval', job_card_id: id })
        setForm(f => ({ ...f, status: 'pending_approval' }))
        showToast('Estimate sent to customer for approval ')
        navigate(`/advisor/jobs`)
    }

    const markComplete = async () => {
        await updateStatus(id, 'completed')
        setForm(f => ({ ...f, status: 'completed' }))
        showToast('Job marked complete 🎉')
    }

    if (!jc) return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>

    const estimatePayload = estimate && typeof estimate === 'object'
        ? (estimate.estimate && typeof estimate.estimate === 'object' ? estimate.estimate : estimate)
        : null

    const toNumber = (value) => {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : 0
    }

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
    const isEstimateSaved = Boolean(estimateId)

    const f = (key, label, type = 'text') => (
        <div key={key} className="form-group">
            <label className="form-label">{label}</label>
            <input className="form-control" type={type} value={form[key] || ''}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} readOnly={!editMode && !searchParams.get('edit')} />
        </div>
    )

    return (
        <div className="page">
            {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 8 }}><ArrowLeft size={14} /> Back</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="page-title">{id}</div>
                        <StatusBadge status={form.status} />
                    </div>
                    <div className="page-subtitle">{form.customer_name} · {form.vehicle_make} {form.vehicle_model} {form.vehicle_year}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={save} disabled={saving || savedOnce}><Save size={14} /> {saving ? 'Saving…' : 'Save'}</button>
                    {!estimate && <button className="btn btn-outline btn-sm" onClick={generateEstimate} disabled={aiLoading}><Sparkles size={14} /> Generate Estimate</button>}
                    {estimate && form.status === 'draft' && (
                        <button className="btn btn-primary btn-sm" onClick={sendApproval} disabled={!isEstimateSaved}>
                            <Send size={14} /> Send for Approval
                        </button>
                    )}
                    {form.status === 'in_progress' && <button className="btn btn-success btn-sm" onClick={markComplete}><CheckCircle size={14} /> Mark Complete</button>}
                </div>
            </div>

            <div className="grid-2" style={{ alignItems: 'start' }}>
                {/* Form */}
                <div className="card">
                    <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Job Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {f('customer_name', 'Customer Name')}
                        <div className="grid-2">
                            {f('vehicle_make', 'Make')}
                            {f('vehicle_model', 'Model')}
                        </div>
                        <div className="grid-2">
                            {f('vehicle_year', 'Year', 'number')}
                            {f('mileage', 'Mileage', 'number')}
                        </div>
                        {f('vin', 'VIN')}
                        <div className="form-group">
                            <label className="form-label">Complaint</label>
                            <textarea className="form-control" rows={3} value={form.complaint || ''}
                                onChange={e => setForm(p => ({ ...p, complaint: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Service Type</label>
                            <select className="form-control" value={form.service_type || ''} onChange={e => setForm(p => ({ ...p, service_type: e.target.value }))}>
                                {['urgent_repair','diagnostic', 'maintenance', 'repair', 'emission_check', 'electrical', 'brakes', 'transmission'].map(t => (
                                    <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                                ))}

                            </select>
                        </div>
                        {/* OBD codes */}
                        {(form.obd_fault_codes || []).length > 0 && (
                            <div className="form-group">
                                <label className="form-label">OBD Fault Codes</label>
                                <div>{(form.obd_fault_codes).map(c => <span key={c} className="fault-code">{c}</span>)}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Estimate */}
                <div>
                    {!estimate ? (
                        <div className="card empty-state" style={{ minHeight: 200 }}>
                            <Sparkles size={30} color='var(--primary)' style={{ opacity: 0.4 }} />
                            <p>No estimate yet</p>
                            <button className="btn btn-outline" onClick={generateEstimate} disabled={aiLoading}>
                                {aiLoading ? 'Generating…' : <><Sparkles size={14} /> Generate Estimate</>}
                            </button>
                        </div>
                    ) : (
                        <div className="card anim-slideUp">
                            <div className="card-header">
                                <h3 style={{ fontWeight: 700 }}>
                                    Estimate
                                    {estimateStatus && <StatusBadge status={estimateStatus} />}
                                </h3>
                            </div>
                            <table className="data-table" style={{ marginBottom: 16 }}>
                                <thead><tr><th>Item</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                                <tbody>
                                    <tr><td>Parts</td><td style={{ textAlign: 'right' }}>{formatAmount(partsTotal)}</td></tr>
                                    <tr><td>Labour</td><td style={{ textAlign: 'right' }}>{formatAmount(laborTotal)}</td></tr>
                                    <tr><td>Tax (18% GST)</td><td style={{ textAlign: 'right' }}>{formatAmount(taxTotal)}</td></tr>
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

                            {form.status === 'draft' && (
                                <button className="btn btn-primary" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }} onClick={sendApproval} disabled={!isEstimateSaved}>
                                    <Send size={15} /> Send for Customer Approval
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
