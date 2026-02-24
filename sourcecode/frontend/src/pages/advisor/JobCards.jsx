import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listJobCards } from '../../api/jobCards'
import StatusBadge from '../../components/ui/StatusBadge'
import { Eye, Edit, Briefcase, Plus } from 'lucide-react'

export default function JobCards() {
    const navigate = useNavigate()
    const [jobs, setJobs] = useState([])
    const [filter, setFilter] = useState('all')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        listJobCards(filter !== 'all' ? { status: filter } : {})
            .then(r => setJobs(r.data)).finally(() => setLoading(false))
    }, [filter])

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div><div className="page-title">Job Cards</div><div className="page-subtitle">{jobs.length} records</div></div>
                <button className="btn btn-primary" onClick={() => navigate('/advisor/intake')}><Plus size={15} /> New Intake</button>
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
                ) : jobs.length === 0 ? (
                    <div className="empty-state"><Briefcase size={40} /><p>No job cards found</p></div>
                ) : (
                    <table className="data-table">
                        <thead><tr>
                            <th>Job ID</th><th>Customer</th><th>Vehicle</th><th>Complaint</th>
                            <th>Service Type</th><th>Status</th><th>Date</th><th>Actions</th>
                        </tr></thead>
                        <tbody>{jobs.map((j, i) => (
                            <tr key={j.id} style={{ '--i': i, animation: 'slideUp 0.3s ease calc(var(--i)*40ms) both' }}
                                onClick={() => navigate(`/advisor/jobs/${j.id}`)}>
                                <td><code style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>{j.id}</code></td>
                                <td style={{ fontWeight: 500 }}>{j.customer_name}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{j.vehicle_make} {j.vehicle_model}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 200 }} className="truncate">{j.complaint}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{j.service_type}</td>
                                <td><StatusBadge status={j.status} /></td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{j.created_at?.slice(0, 10)}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); navigate(`/advisor/jobs/${j.id}`) }}><Eye size={13} /></button>
                                        <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); navigate(`/advisor/jobs/${j.id}?edit=1`) }}><Edit size={13} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
