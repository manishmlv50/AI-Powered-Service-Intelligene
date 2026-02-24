import { useEffect, useState } from 'react'
import { listJobCards } from '../../api/jobCards'
import StatusBadge from '../../components/ui/StatusBadge'
import { X } from 'lucide-react'

export default function ManagerJobCards() {
    const [jobs, setJobs] = useState([])
    const [filter, setFilter] = useState('all')
    const [drawer, setDrawer] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        listJobCards(filter !== 'all' ? { status: filter } : {})
            .then(r => setJobs(r.data)).finally(() => setLoading(false))
    }, [filter])

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-title">All Job Cards</div>
                <div className="page-subtitle">Read-only view · {jobs.length} records</div>
            </div>
            <div className="card">
                <div className="filter-bar">
                    {['all', 'draft', 'pending_approval', 'in_progress', 'completed', 'closed'].map(s => (
                        <button key={s} className={`filter-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                            {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </button>
                    ))}
                </div>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 48 }} />)}
                    </div>
                ) : (
                    <table className="data-table">
                        <thead><tr><th>Job ID</th><th>Customer</th><th>Vehicle</th><th>Complaint</th><th>Service Type</th><th>Status</th><th>Date</th></tr></thead>
                        <tbody>{jobs.map((j, i) => (
                            <tr key={j.id} style={{ '--i': i, animation: 'slideUp 0.3s ease calc(var(--i)*40ms) both' }} onClick={() => setDrawer(j)}>
                                <td><code style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>{j.id}</code></td>
                                <td style={{ fontWeight: 500 }}>{j.customer_name}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{j.vehicle_make} {j.vehicle_model}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 180 }} className="truncate">{j.complaint}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{j.service_type}</td>
                                <td><StatusBadge status={j.status} /></td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{j.created_at?.slice(0, 10)}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                )}
            </div>
            {drawer && (
                <>
                    <div className="overlay" onClick={() => setDrawer(null)} />
                    <div className="drawer">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontWeight: 700 }}>{drawer.id}</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setDrawer(null)}><X size={16} /></button>
                        </div>
                        <StatusBadge status={drawer.status} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                            {[['Customer', drawer.customer_name], ['Vehicle', `${drawer.vehicle_make} ${drawer.vehicle_model} ${drawer.vehicle_year}`],
                            ['Complaint', drawer.complaint], ['Service Type', drawer.service_type], ['VIN', drawer.vin], ['Mileage', drawer.mileage]
                            ].map(([k, v]) => (
                                <div key={k}><div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k}</div>
                                    <div style={{ fontSize: '0.9rem' }}>{v || '—'}</div></div>
                            ))}
                            {(drawer.obd_fault_codes || []).length > 0 && (
                                <div><div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>OBD Codes</div>
                                    {drawer.obd_fault_codes.map(c => <span key={c} className="fault-code">{c}</span>)}</div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
