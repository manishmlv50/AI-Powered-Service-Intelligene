import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getHistory } from '../../api/customers'
import StatusBadge from '../../components/ui/StatusBadge'
import { ClipboardList } from 'lucide-react'

export default function ServiceHistory() {
    const { user } = useAuth()
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(null)

    useEffect(() => {
        getHistory(user?.user_id).then(r => setHistory(r.data || [])).catch(() => {
            // fallback with demo data
            setHistory([
                { id: 'J002', created_at: '2026-02-02', status: 'pending_approval', vehicle_make: 'Hyundai', vehicle_model: 'Creta', vehicle_year: 2022, complaint: 'Fuel pressure low', service_type: 'Repair' },
                { id: 'J011', created_at: '2026-02-08', status: 'pending_approval', vehicle_make: 'Tata', vehicle_model: 'Altroz', vehicle_year: 2021, complaint: 'Oxygen sensor faulty', service_type: 'Emission Check' },
            ])
        }).finally(() => setLoading(false))
    }, [user])

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-title">Service History</div>
                <div className="page-subtitle">All your past and current service requests.</div>
            </div>
            <div className="card">
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60 }} />)}
                    </div>
                ) : history.length === 0 ? (
                    <div className="empty-state"><ClipboardList size={40} /><p>No service history yet</p></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {history.map((j, i) => (
                            <div key={j.id} style={{ '--i': i, animation: 'slideUp 0.35s ease calc(var(--i)*60ms) both' }}>
                                <div
                                    onClick={() => setExpanded(expanded === j.id ? null : j.id)}
                                    className="card" style={{ cursor: 'pointer', padding: '14px 18px', margin: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <code style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>{j.id}</code>
                                            <span style={{ fontWeight: 600 }}>{j.vehicle_make} {j.vehicle_model} {j.vehicle_year}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{j.service_type}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <StatusBadge status={j.status} />
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{j.created_at?.slice(0, 10)}</span>
                                        </div>
                                    </div>
                                    {expanded === j.id && (
                                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            {[['Complaint', j.complaint], ['Service Type', j.service_type], ['Status', j.status], ['Date', j.created_at?.slice(0, 10)]].map(([k, v]) => (
                                                <div key={k}><div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{k}</div>
                                                    <div style={{ fontSize: '0.875rem' }}>{v || '—'}</div></div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
