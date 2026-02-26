import { useEffect, useState } from 'react'
import { getCustomerJobs } from '../../api/customers'
import { useAuth } from '../../hooks/useAuth'
import StatusBadge from '../../components/ui/StatusBadge'
import { Briefcase } from 'lucide-react'

export default function CustomerJobCards() {
    const { user } = useAuth()
    const [jobs, setJobs] = useState([])
    const [filter, setFilter] = useState('all')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        const fetchJobs = async () => {
            try {
                setLoading(true)
                const params = {}
                if (filter !== 'all') params.status = filter
                if (!user?.user_id) {
                    if (mounted) setJobs([])
                    return
                }

                const res = await getCustomerJobs(user.user_id, params)
                const rows = Array.isArray(res?.data) ? res.data : []
                if (mounted) {
                    const normalizedUserId = String(user?.user_id || '').trim().toLowerCase()
                    const onlyCurrentCustomerRows = rows.filter((row) => {
                        const rowCustomerId = String(row?.customer_id || '').trim().toLowerCase()
                        return normalizedUserId && rowCustomerId === normalizedUserId
                    })
                    setJobs(onlyCurrentCustomerRows)
                }
            } catch (err) {
                console.error('CustomerJobCards fetch error:', err)
                if (mounted) setJobs([])
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchJobs()
        return () => { mounted = false }
    }, [filter, user?.user_id])

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-title">My Job Cards</div>
                <div className="page-subtitle">{jobs.length} records</div>
            </div>

            <div className="card">
                <div className="filter-bar">
                    {['all', 'draft', 'pending_approval', 'in_progress', 'completed', 'closed'].map((s) => (
                        <button
                            key={s}
                            className={`filter-chip ${filter === s ? 'active' : ''}`}
                            onClick={() => setFilter(s)}
                        >
                            {s === 'all'
                                ? 'All'
                                : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 48 }} />
                        ))}
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="empty-state">
                        <Briefcase size={40} />
                        <p>No job cards found</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Job ID</th>
                                <th>Vehicle</th>
                                <th>Complaint</th>
                                <th>Service Type</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((j, i) => (
                                <tr key={j.id} style={{ '--i': i, animation: 'slideUp 0.3s ease calc(var(--i)*40ms) both' }}>
                                    <td><code style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>{j.id}</code></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {j.vehicle_make} {j.vehicle_model}
                                    </td>
                                    <td className="truncate" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 260 }}>
                                        {j.complaint}
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{j.service_type}</td>
                                    <td><StatusBadge status={j.status} /></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{j.created_at?.slice(0, 10)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
