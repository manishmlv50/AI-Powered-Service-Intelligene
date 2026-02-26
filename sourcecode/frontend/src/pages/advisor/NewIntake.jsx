import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSpeech } from '../../hooks/useSpeech'
import { useAgent } from '../../hooks/useAgent'
import { createJobCard } from '../../api/jobCards'
import { searchVehicleByVin } from '../../api/customers'
import { useAuth } from '../../hooks/useAuth'
import { Mic, MicOff, Upload, Sparkles, ChevronRight, X, Search, CheckCircle, AlertCircle } from 'lucide-react'

export default function NewIntake() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { call: agentCall, loading: aiLoading } = useAgent()

    // Vehicle search
    const [vinQuery, setVinQuery] = useState('')
    const [vinResult, setVinResult] = useState(null)  // { found, vehicle_id, ... }
    const [vinLoading, setVinLoading] = useState(false)
    const [vinError, setVinError] = useState(null)

    // Intake fields
    const [mileage, setMileage] = useState('')
    const [complaint, setComplaint] = useState('')
    const [obdText, setObdText] = useState('')
    const [obdFile, setObdFile] = useState(null)
    const [dragOver, setDragOver] = useState(false)
    const [jobCard, setJobCard] = useState(null)
    const [saving, setSaving] = useState(false)
    const fileRef = useRef()

    const prettify = value => (value || '').toString().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    const { recording, error: micError, start: startRec, stop: stopRec } = useSpeech({
        onPartial: txt => setComplaint(c => (c + ' ' + txt).trim()),
        onFinal: txt => setComplaint(c => (c + ' ' + txt).trim() + ' '),
    })

    // ── Vehicle search ──────────────────────────────────────────────────────
    const searchVehicle = async () => {
        if (vinQuery.trim().length < 3) return
        setVinLoading(true); setVinError(null); setVinResult(null)
        try {
            const { data } = await searchVehicleByVin(vinQuery.trim())
            if (data.found) {
                setVinResult(data)
            } else {
                setVinError('No vehicle found for this VIN / registration number.')
            }
        } catch {
            setVinError('Search failed — check the backend connection.')
        } finally {
            setVinLoading(false)
        }
    }

    const clearVehicle = () => { setVinResult(null); setVinQuery(''); setVinError(null) }

    // ── OBD upload ──────────────────────────────────────────────────────────
    const handleDrop = useCallback(async e => {
        e.preventDefault(); setDragOver(false)
        const file = e.dataTransfer?.files?.[0] || e.target.files?.[0]
        if (!file) return
        setObdFile(file.name)
        const text = await file.text()
        setObdText(text)
    }, [])

    // ── AI generation ────────────────────────────────────────────────────────
    const generateJobCard = async () => {
        const payload = {
            action: 'intake',
            customer_complaint: complaint,
            obd_report_text: obdText,
            mileage: parseInt(mileage) || 0,
            // Pass vehicle_id if resolved from VIN search
            ...(vinResult?.vehicle_id ? { vehicle_id: vinResult.vehicle_id } : {}),
        }
        const base = {
            customer_name: vinResult?.customer_name || '',
            customer_id: vinResult?.customer_id || '',
            vehicle_id: vinResult?.vehicle_id || '',
            vehicle_make: vinResult?.vehicle_make || '',
            vehicle_model: vinResult?.vehicle_model || '',
            vehicle_year: vinResult?.vehicle_year || new Date().getFullYear(),
            vin: vinResult?.vehicle_vin || '',
            mileage: parseInt(mileage) || 0,
            complaint,
            service_type: 'diagnostic',
            risk_indicators: [],
            obd_fault_codes: [],
            advisor_id: user?.user_id,
        }
        try {
            const res = await agentCall(payload)
            const r = (res && typeof res === 'object') ? res : {}
            const fromJobCard = (r.job_card && typeof r.job_card === 'object') ? r.job_card : {}
            const obdCodes = Array.isArray(fromJobCard.obd_codes)
                ? fromJobCard.obd_codes
                : (Array.isArray(r.obd_fault_codes) ? r.obd_fault_codes : [])
            const tasks = Array.isArray(fromJobCard.tasks) ? fromJobCard.tasks : []

            setJobCard({
                ...base,
                agent: r.agent || '',
                service_type: r.service_type || 'diagnostic',
                vehicle_id: fromJobCard.vehicle_id || base.vehicle_id,
                make_model: fromJobCard.make_model || `${base.vehicle_make || ''} ${base.vehicle_model || ''} ${base.vehicle_year || ''}`.trim(),
                complaint: fromJobCard.complaint || r.customer_complaint || complaint,
                obd_report_text: obdText,
                obd_report_summary: r.obd_report_summary || '',
                risk_indicators: Array.isArray(r.risk_indicators) ? r.risk_indicators : [],
                obd_fault_codes: obdCodes,
                tasks,
            })
        } catch {
            setJobCard(base)
        }
    }

    const saveJobCard = async () => {
        setSaving(true)
        try {
            const { data } = await createJobCard(jobCard)
            navigate(`/advisor/jobs/${data.id}`)
        } finally { setSaving(false) }
    }

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-title">New Vehicle Intake</div>
                <div className="page-subtitle">Search by vehicle number, capture complaint, upload OBD — AI generates the job card.</div>
            </div>

            <div className="grid-2" style={{ alignItems: 'start' }}>
                {/* ── Left: Capture panel ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                    {/* Vehicle search & details */}
                    <div className="card">
                        <div className="card-header">
                            <h3 style={{ fontWeight: 700 }}>Vehicle Details</h3>
                            {vinResult && (
                                <button className="btn btn-ghost btn-sm" onClick={clearVehicle}>
                                    <X size={13} /> Clear
                                </button>
                            )}
                        </div>

                        {!vinResult ? (
                            <>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        className="form-control"
                                        placeholder="Enter VIN or registration number…"
                                        value={vinQuery}
                                        onChange={e => setVinQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && searchVehicle()}
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={searchVehicle}
                                        disabled={vinLoading || vinQuery.trim().length < 3}
                                        style={{ whiteSpace: 'nowrap' }}>
                                        {vinLoading
                                            ? <span style={{ width: 14, height: 14, border: '2px solid var(--text-muted)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                            : <><Search size={13} /> Search</>
                                        }
                                    </button>
                                </div>
                                {vinError && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
                                        color: 'var(--danger)', fontSize: '0.82rem'
                                    }}>
                                        <AlertCircle size={14} /> {vinError}
                                    </div>
                                )}
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
                                    Partial VIN, last 6 digits, or full registration number are all accepted.
                                </p>
                            </>
                        ) : (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                                borderRadius: 'var(--radius-sm)', background: 'rgba(108,99,255,0.06)',
                                border: '1px solid rgba(108,99,255,0.2)', marginTop: 4, marginBottom: 12,
                            }}>
                                <CheckCircle size={20} color="var(--success)" style={{ flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontWeight: 700 }}>
                                        {vinResult.vehicle_make} {vinResult.vehicle_model} {vinResult.vehicle_year}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                        VIN: {vinResult.vehicle_vin} · Owner: {vinResult.customer_name}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', gap: 12, marginTop: 2 }}>
                                        <span style={{
                                            fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                                            background: 'rgba(108,99,255,0.12)', padding: '1px 6px', borderRadius: 4, color: 'var(--primary)'
                                        }}>
                                            vehicle_id: {vinResult.vehicle_id}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-group" style={{ marginTop: vinResult ? 0 : 16, marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Current Mileage (km) <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="e.g. 45000"
                                value={mileage}
                                onChange={e => setMileage(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Complaint */}
                    <div className="card">
                        <div className="card-header">
                            <h3 style={{ fontWeight: 700 }}>Customer Complaint</h3>
                            <button
                                onClick={recording ? stopRec : startRec}
                                className={`btn ${recording ? 'btn-danger' : 'btn-outline'} btn-sm`}
                                style={recording ? { animation: 'pulse 1.5s infinite' } : {}}>
                                {recording ? <><MicOff size={14} /> Stop</> : <><Mic size={14} /> Record</>}
                            </button>
                        </div>
                        {recording && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                                background: 'rgba(255,90,90,0.08)', border: '1px solid rgba(255,90,90,0.2)'
                            }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', animation: 'pulse 1s infinite' }} />
                                <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Live transcription active…</span>
                            </div>
                        )}
                        {micError && <div style={{ color: 'var(--warning)', fontSize: '0.8rem', marginBottom: 8 }}>{micError}</div>}
                        <textarea className="form-control" rows={5}
                            placeholder="Speak using mic or type complaint / notes here…"
                            value={complaint} onChange={e => setComplaint(e.target.value)} />
                    </div>

                    {/* OBD Upload */}
                    <div className="card">
                        <div className="card-header"><h3 style={{ fontWeight: 700 }}>OBD Report</h3></div>
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileRef.current.click()}
                            style={{
                                border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
                                borderRadius: 'var(--radius)', padding: '28px', textAlign: 'center',
                                cursor: 'pointer', transition: 'var(--transition)',
                                background: dragOver ? 'rgba(108,99,255,0.05)' : 'var(--surface-3)',
                            }}>
                            <Upload size={28} color={dragOver ? 'var(--primary)' : 'var(--text-muted)'} />
                            <p style={{ margin: '10px 0 4px', fontSize: '0.875rem', fontWeight: 500 }}>
                                {obdFile ? obdFile : 'Drop OBD report here or click to upload'}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports PDF, TXT</p>
                            <input ref={fileRef} type="file" accept=".txt,.pdf" style={{ display: 'none' }}
                                onChange={e => handleDrop({ preventDefault: () => { }, target: e.target })} />
                        </div>
                    </div>

                    <button className="btn btn-primary btn-lg" onClick={generateJobCard}
                        disabled={aiLoading || (!complaint && !obdText)}
                        style={{ justifyContent: 'center' }}>
                        {aiLoading ? (
                            <><span style={{
                                width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                            }} /> Analyzing with AI…</>
                        ) : (
                            <><Sparkles size={16} /> Generate Job Card with AI</>
                        )}
                    </button>
                </div>

                {/* ── Right: AI result ── */}
                <div>
                    {!jobCard && !aiLoading && (
                        <div className="card empty-state" style={{ minHeight: 300 }}>
                            <Sparkles size={40} color="var(--primary)" style={{ opacity: 0.4 }} />
                            <p style={{ fontWeight: 600 }}>AI Job Card will appear here</p>
                            <p style={{ fontSize: '0.8rem' }}>
                                {vinResult ? `Vehicle resolved ✓ — enter complaint and click Generate` : 'Search by VIN or type complaint and click Generate'}
                            </p>
                        </div>
                    )}
                    {aiLoading && (
                        <div className="card" style={{ minHeight: 300 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <Sparkles size={16} color="var(--primary)" />
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Analyzing complaint…</span>
                            </div>
                            {[60, 80, 55, 70].map((w, i) => (
                                <div key={i} className="skeleton" style={{ height: 16, width: `${w}%`, marginBottom: 12 }} />
                            ))}
                        </div>
                    )}
                    {jobCard && (
                        <div className="card anim-slideUp">
                            <div className="card-header">
                                <h3 style={{ fontWeight: 700 }}>AI-Generated Job Card</h3>
                                <button className="btn btn-ghost btn-sm" onClick={() => setJobCard(null)}><X size={14} /></button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {jobCard.agent && (
                                        <span style={{
                                            fontSize: '0.72rem', padding: '4px 10px', borderRadius: 999,
                                            background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', color: 'var(--primary)'
                                        }}>
                                            Agent: {jobCard.agent}
                                        </span>
                                    )}
                                    <span style={{
                                        fontSize: '0.72rem', padding: '4px 10px', borderRadius: 999,
                                        background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-muted)'
                                    }}>
                                        Service: {prettify(jobCard.service_type || 'diagnostic')}
                                    </span>
                                    <span style={{
                                        fontSize: '0.72rem', padding: '4px 10px', borderRadius: 999,
                                        background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-muted)'
                                    }}>
                                        Vehicle ID: {jobCard.vehicle_id || vinResult?.vehicle_id || 'N/A'}
                                    </span>
                                </div>
                                {[
                                    ['customer_name', 'Customer Name'],
                                    ['make_model', 'Make & Model'],
                                    ['vin', 'VIN'],
                                ].map(([key, label]) => (
                                    <div key={key} className="form-group">
                                        <label className="form-label">{label}</label>
                                        <input className="form-control" value={jobCard[key] || ''}
                                            onChange={e => setJobCard(j => ({ ...j, [key]: e.target.value }))} />
                                    </div>
                                ))}
                                <div className="form-group">
                                    <label className="form-label">Service Type</label>
                                    <select className="form-control" value={jobCard.service_type || ''}
                                        onChange={e => setJobCard(j => ({ ...j, service_type: e.target.value }))}>
                                        {['diagnostic', 'maintenance', 'repair', 'urgent_repair', 'emission_check', 'electrical', 'brakes', 'transmission'].map(t => (
                                            <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Complaint</label>
                                    <textarea className="form-control" rows={3} value={jobCard.complaint || ''}
                                        onChange={e => setJobCard(j => ({ ...j, complaint: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">OBD Fault Codes</label>
                                    <textarea
                                        className="form-control"
                                        rows={4}
                                        placeholder="One OBD code per line"
                                        value={Array.isArray(jobCard.obd_fault_codes) ? jobCard.obd_fault_codes.join('\n') : ''}
                                        onChange={e => setJobCard(j => ({
                                            ...j,
                                            obd_fault_codes: e.target.value
                                                .split('\n')
                                                .map(v => v.trim())
                                                .filter(Boolean),
                                        }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Recommended Tasks</label>
                                    <textarea
                                        className="form-control"
                                        rows={5}
                                        placeholder="One task per line"
                                        value={Array.isArray(jobCard.tasks) ? jobCard.tasks.join('\n') : ''}
                                        onChange={e => setJobCard(j => ({
                                            ...j,
                                            tasks: e.target.value
                                                .split('\n')
                                                .map(v => v.trim())
                                                .filter(Boolean),
                                        }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">OBD Report Text</label>
                                    <textarea className="form-control" rows={3} value={jobCard.obd_report_text || ''}
                                        onChange={e => setJobCard(j => ({ ...j, obd_report_text: e.target.value }))} />
                                </div>
                                {vinResult?.vehicle_id && (
                                    <div style={{
                                        fontSize: '0.75rem', color: 'var(--text-muted)', padding: '8px 10px',
                                        background: 'rgba(108,99,255,0.06)', borderRadius: 'var(--radius-sm)',
                                        border: '1px solid rgba(108,99,255,0.15)'
                                    }}>
                                        🔗 Linked to <strong>vehicle_id: {vinResult.vehicle_id}</strong>
                                    </div>
                                )}
                                <button className="btn btn-primary" onClick={saveJobCard} disabled={saving}
                                    style={{ justifyContent: 'center' }}>
                                    {saving ? 'Saving…' : <><ChevronRight size={16} /> Save & Continue to Estimate</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
