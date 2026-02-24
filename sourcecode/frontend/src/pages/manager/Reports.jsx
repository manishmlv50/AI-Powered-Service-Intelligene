import { BarChart2 } from 'lucide-react'
export default function ReportsPage({ title = 'Reports' }) {
    return (
        <div className="page">
            <div className="page-header"><div className="page-title">{title}</div></div>
            <div className="card empty-state" style={{ minHeight: 300 }}>
                <BarChart2 size={48} color="var(--primary)" style={{ opacity: 0.3 }} />
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{title}</p>
                <p style={{ fontSize: '0.85rem' }}>Coming soon in the next sprint.</p>
            </div>
        </div>
    )
}
