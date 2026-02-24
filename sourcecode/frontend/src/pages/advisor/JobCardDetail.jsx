import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getJobCard, updateJobCard, updateStatus } from '../../api/jobCards'
import { getEstimateByJob } from '../../api/estimates'
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

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    useEffect(() => {
        getJobCard(id).then(r => { setJc(r.data); setForm(r.data) })
        getEstimateByJob(id).then(r => setEstimate(r.data)).catch(() => { })
    }, [id])

    const save = async () => {
        setSaving(true)
        await updateJobCard(id, form)
        setSaving(false)
        showToast('Job card saved')
    }

    const generateEstimate = async () => {
        await agentCall({
            action: 'estimate',
            vehicle_id: jc.vehicle_id,
            customer_complaint: jc.complaint,
            obd_report_text: jc.obd_report_text,
            job_card_id: id
        })
        getEstimateByJob(id).then(r => setEstimate(r.data)).catch(() => { })
        showToast('Estimate generated')
    }

    const sendApproval = async () => {
        await updateStatus(id, 'pending_approval')
        await agentCall({ action: 'send_approval', job_card_id: id })
        setForm(f => ({ ...f, status: 'pending_approval' }))
        showToast('Estimate sent to customer for approval ✅')
    }

    const markComplete = async () => {
        await updateStatus(id, 'completed')
        setForm(f => ({ ...f, status: 'completed' }))
        showToast('Job marked complete 🎉')
    }

    if (!jc) return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>

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
                    <button className="btn btn-outline btn-sm" onClick={save} disabled={saving}><Save size={14} /> {saving ? 'Saving…' : 'Save'}</button>
                    {!estimate && <button className="btn btn-outline btn-sm" onClick={generateEstimate} disabled={aiLoading}><Sparkles size={14} /> Generate Estimate</button>}
                    {estimate && form.status === 'draft' && <button className="btn btn-primary btn-sm" onClick={sendApproval}><Send size={14} /> Send for Approval</button>}
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
                                {['diagnostic', 'maintenance', 'repair', 'emission_check', 'electrical', 'brakes', 'transmission'].map(t => (
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
                            <div className="card-header"><h3 style={{ fontWeight: 700 }}>Estimate <StatusBadge status={estimate.status} /></h3></div>
                            <table className="data-table" style={{ marginBottom: 16 }}>
                                <thead><tr><th>Item</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                                <tbody>
                                    <tr><td>Parts</td><td style={{ textAlign: 'right' }}>₹{estimate.parts_total?.toLocaleString()}</td></tr>
                                    <tr><td>Labour</td><td style={{ textAlign: 'right' }}>₹{estimate.labor_total?.toLocaleString()}</td></tr>
                                    <tr><td>Tax (18% GST)</td><td style={{ textAlign: 'right' }}>₹{estimate.tax?.toLocaleString()}</td></tr>
                                </tbody>
                            </table>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-3)', borderRadius: 'var(--radius-sm)' }}>
                                <span style={{ fontWeight: 700 }}>Total</span>
                                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>₹{estimate.total_amount?.toLocaleString()}</span>
                            </div>
                            {form.status === 'draft' && (
                                <button className="btn btn-primary" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }} onClick={sendApproval}>
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
