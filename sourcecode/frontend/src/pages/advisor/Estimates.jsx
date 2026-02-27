import { useEffect, useState } from 'react'
import { listJobCards } from '../../api/jobCards'
import { listEstimates } from '../../api/estimates'   //  NEW ENDPOINT
import StatusBadge from '../../components/ui/StatusBadge'
import { FileText } from 'lucide-react'

export default function EstimatesPage() {
    const [jobs, setJobs] = useState([])
    const [estimates, setEstimates] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                //  Load jobs + estimates in parallel
                const [jobsRes, estRes] = await Promise.all([
                    listJobCards(),
                    listEstimates()
                ])

                const jobsData = jobsRes.data || []
                const estData = estRes.data || []

                setJobs(jobsData)

                //  Convert estimate list → map by job_card_id
                const map = {}
                estData.forEach(e => {
                    if (e?.job_card_id) {
                        map[e.job_card_id] = e
                    }
                })

                setEstimates(map)
            } catch (err) {
                console.error("Failed loading EstimatesPage:", err)
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [])

    const jobsWithEst = jobs.filter(j => estimates[j.id])

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-title">Estimates</div>
                <div className="page-subtitle">
                    {jobsWithEst.length} estimates found
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 48 }} />
                        ))}
                    </div>
                ) : jobsWithEst.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={40} />
                        <p>No estimates yet</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Estimate ID</th>
                                <th>Job ID</th>
                                <th>Customer</th>
                                <th>Parts</th>
                                <th>Labour</th>
                                <th>Tax</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobsWithEst.map((j, i) => {
                                const e = estimates[j.id]

                                return (
                                    <tr
                                        key={j.id}
                                        style={{
                                            '--i': i,
                                            animation:
                                                'slideUp 0.3s ease calc(var(--i)*40ms) both'
                                        }}
                                    >
                                        <td>
                                            <code style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>
                                                {e.id}
                                            </code>
                                        </td>
                                        <td>
                                            <code style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>
                                                {j.id}
                                            </code>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>
                                            {j.customer_name}
                                        </td>
                                        <td>${e.parts_total?.toLocaleString()}</td>
                                        <td>${e.labor_total?.toLocaleString()}</td>
                                        <td>${e.tax?.toLocaleString()}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                            ${e.total_amount?.toLocaleString()}
                                        </td>
                                        <td>
                                            <StatusBadge status={e.status} />
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}