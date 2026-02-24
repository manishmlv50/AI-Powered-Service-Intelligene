const STATUS_MAP = {
    draft: { label: 'Draft', cls: 'badge-draft' },
    pending_approval: { label: 'Pending Approval', cls: 'badge-pending' },
    in_progress: { label: 'In Progress', cls: 'badge-progress' },
    completed: { label: 'Completed', cls: 'badge-completed' },
    closed: { label: 'Closed', cls: 'badge-closed' },
    approved: { label: 'Approved', cls: 'badge-approved' },
    rejected: { label: 'Rejected', cls: 'badge-rejected' },
    pending: { label: 'Pending', cls: 'badge-pending' },
    revised: { label: 'Revised', cls: 'badge-pending' },
    high: { label: 'High Risk', cls: 'badge-risk-high' },
    medium: { label: 'Medium Risk', cls: 'badge-risk-medium' },
    low: { label: 'Low Risk', cls: 'badge-risk-low' },
}

export default function StatusBadge({ status }) {
    const s = STATUS_MAP[status?.toLowerCase()] || { label: status, cls: 'badge-draft' }
    return <span className={`badge ${s.cls}`}>{s.label}</span>
}
