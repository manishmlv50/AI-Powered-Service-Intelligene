import { useAuth } from '../../hooks/useAuth'

export default function TopBar({ title }) {
    const { user } = useAuth()
    return (
        <header style={{
            height: 'var(--topbar-h)', display: 'flex', alignItems: 'center',
            padding: '0 28px', borderBottom: '1px solid var(--border)',
            background: 'rgba(15,17,23,0.85)', backdropFilter: 'blur(12px)',
            position: 'sticky', top: 0, zIndex: 40,
            justifyContent: 'space-between',
        }}>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Role badge */}
                <div style={{
                    padding: '5px 12px', borderRadius: 99,
                    background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)',
                    fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)',
                    textTransform: 'capitalize',
                }}>{user?.role}</div>
            </div>
        </header>
    )
}
