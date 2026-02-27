import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { managerDashboard } from '../../api/dashboard'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import { Activity, AlertTriangle, Clock, CheckCircle, X } from 'lucide-react'

const STAT_ICONS = [Activity, AlertTriangle, Clock, CheckCircle]
const STAT_COLORS = ['var(--info)', 'var(--danger)', 'var(--warning)', 'var(--success)']

export default function ManagerDashboard() {
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [drawer, setDrawer] = useState(null)
    const [filter, setFilter] = useState('all')

    useEffect(() => { managerDashboard().then(r => setData(r.data)) }, [])

    const stats = data ? [
        { label: 'In Progress', value: data.in_progress },
        { label: 'At Risk', value: data.at_risk },
        { label: 'Pending Approval', value: data.pending_approval },
        { label: 'Completed Today', value: data.completed_today },
    ] : []

    const jobs = (data?.jobs_with_eta || []).filter(j => filter === 'all' || j.risk_level === filter)

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-title">Workshop Tracking</div>
                <div className="page-subtitle">Live service centre status — all jobs at a glance.</div>
            </div>

            <div className="grid-4" style={{ marginBottom: 28 }}>
                {data ? stats.map((s, i) => (
                    <StatCard key={s.label} label={s.label} value={s.value} icon={STAT_ICONS[i]} color={STAT_COLORS[i]} delay={i * 80} />
                )) : [0, 1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: 90 }} />)}
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 style={{ fontWeight: 700 }}>Jobs Tracker</h3>
                </div>
                <div className="filter-bar">
                    {['all', 'high', 'medium', 'low'].map(r => (
                        <button key={r} className={`filter-chip ${filter === r ? 'active' : ''}`} onClick={() => setFilter(r)}>
                            {r === 'all' ? 'All Risk Levels' : r.charAt(0).toUpperCase() + r.slice(1) + ' Risk'}
                        </button>
                    ))}
                </div>
                <table className="data-table">
                    <thead><tr>
                        <th>Job ID</th><th>Customer</th><th>Vehicle</th><th>Service Type</th>
                        <th>Status</th><th>Risk</th><th>ETA</th>
                    </tr></thead>
                    <tbody>{jobs.map((j, i) => (
                        <tr key={j.id} style={{ '--i': i, animation: 'slideUp 0.3s ease calc(var(--i)*40ms) both' }} onClick={() => setDrawer(j)}>
                            <td><code style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>{j.id}</code></td>
                            <td style={{ fontWeight: 500 }}>{j.customer_name}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{j.vehicle_make} {j.vehicle_model}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{j.service_type}</td>
                            <td><StatusBadge status={j.status} /></td>
                            <td><span className={`badge badge-risk-${j.risk_level}`}>{j.risk_level}</span></td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{j.eta}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>

            {/* Drawer */}
            {drawer && (
                <>
                    <div className="overlay" onClick={() => setDrawer(null)} />
                    <div className="drawer">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontWeight: 700 }}>{drawer.id}</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setDrawer(null)}><X size={16} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[
                                ['Customer', drawer.customer_name],
                                ['Vehicle', `${drawer.vehicle_make} ${drawer.vehicle_model} ${drawer.vehicle_year || ''}`],
                                ['Complaint', drawer.complaint],
                                ['Service Type', drawer.service_type],
                                ['ETA', drawer.eta],
                            ].map(([k, v]) => (
                                <div key={k}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k}</div>
                                    <div style={{ fontSize: '0.9rem' }}>{v || '—'}</div>
                                </div>
                            ))}
                            <div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Status</div>
                                <StatusBadge status={drawer.status} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Risk Level</div>
                                <span className={`badge badge-risk-${drawer.risk_level}`}>{drawer.risk_level}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
