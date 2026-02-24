import { Bell, Search } from 'lucide-react'
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
                {/* Search */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'var(--surface-3)', borderRadius: 'var(--radius-sm)',
                    padding: '7px 12px', border: '1px solid var(--border)',
                }}>
                    <Search size={14} color='var(--text-muted)' />
                    <input placeholder="Search..." style={{
                        background: 'none', border: 'none', outline: 'none',
                        color: 'var(--text)', fontSize: '0.85rem', width: 160,
                    }} />
                </div>
                {/* Notification bell */}
                <button style={{
                    background: 'var(--surface-3)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', width: 36, height: 36,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', position: 'relative',
                }}>
                    <Bell size={15} color='var(--text-muted)' />
                    <span style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--danger)', boxShadow: '0 0 6px var(--danger)',
                    }} />
                </button>
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
