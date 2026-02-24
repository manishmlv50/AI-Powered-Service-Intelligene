import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { advisorDashboard } from '../../api/dashboard'
import { useAuth } from '../../hooks/useAuth'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import { Briefcase, Clock, Wrench, CheckCircle, Plus, Eye } from 'lucide-react'

const STAT_ICONS = [Briefcase, Clock, Wrench, CheckCircle]
const STAT_COLORS = ['var(--primary)', 'var(--warning)', 'var(--info)', 'var(--success)']

export default function AdvisorDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        advisorDashboard(user?.user_id).then(r => setData(r.data)).catch(() => { })
    }, [user])

    const stats = data ? [
        { label: 'Open Jobs', value: data.open_jobs },
        { label: 'Pending Approval', value: data.pending_approval },
        { label: 'In Progress', value: data.in_progress },
        { label: 'Completed Today', value: data.completed_today },
    ] : []

    const jobs = (data?.recent_jobs || []).filter(j => filter === 'all' || j.status === filter)

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div className="page-title">Good morning, {user?.name?.split(' ')[0]} 👋</div>
                    <div className="page-subtitle">Here's what's happening in the service centre today.</div>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/advisor/intake')}>
                    <Plus size={16} /> New Intake
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
                {data ? stats.map((s, i) => (
                    <StatCard key={s.label} label={s.label} value={s.value}
                        icon={STAT_ICONS[i]} color={STAT_COLORS[i]} delay={i * 80} />
                )) : [0, 1, 2, 3].map(i => (
                    <div key={i} className="card skeleton" style={{ height: 90, '--i': i }} />
                ))}
            </div>

            {/* Recent Jobs */}
            <div className="card">
                <div className="card-header">
                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Job Cards</h3>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate('/advisor/jobs')}>View all</button>
                </div>

                {/* Filters */}
                <div className="filter-bar">
                    {['all', 'draft', 'pending_approval', 'in_progress', 'completed'].map(s => (
                        <button key={s} className={`filter-chip ${filter === s ? 'active' : ''}`}
                            onClick={() => setFilter(s)}>
                            {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </button>
                    ))}
                </div>

                {jobs.length === 0 ? (
                    <div className="empty-state"><Briefcase size={40} /><p>No job cards found</p></div>
                ) : (
                    <table className="data-table">
                        <thead><tr>
                            <th>Job ID</th><th>Customer</th><th>Vehicle</th>
                            <th>Service Type</th><th>Status</th><th>Date</th><th></th>
                        </tr></thead>
                        <tbody>{jobs.map(j => (
                            <tr key={j.id} onClick={() => navigate(`/advisor/jobs/${j.id}`)}>
                                <td><code style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>{j.id}</code></td>
                                <td style={{ fontWeight: 500 }}>{j.customer_name}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{j.vehicle_make} {j.vehicle_model} {j.vehicle_year}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{j.service_type}</td>
                                <td><StatusBadge status={j.status} /></td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{j.created_at?.slice(0, 10)}</td>
                                <td><button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); navigate(`/advisor/jobs/${j.id}`) }}><Eye size={14} /></button></td>
                            </tr>
                        ))}</tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
