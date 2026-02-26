import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
    LayoutDashboard, PlusCircle, ClipboardList, FileText,
    BarChart2, Settings, LogOut, Zap, Users, Car, MessageSquare
} from 'lucide-react'

const ADVISOR_NAV = [
    { to: '/advisor', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/advisor/intake', icon: PlusCircle, label: 'New Intake' },
    { to: '/advisor/jobs', icon: ClipboardList, label: 'Job Cards' },
    { to: '/advisor/estimates', icon: FileText, label: 'Estimates' },
    { to: '/advisor/tracking', icon: BarChart2, label: 'Tracking' }
]
const MANAGER_NAV = [
    { to: '/manager', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/manager/jobs', icon: ClipboardList, label: 'Job Cards' },
    { to: '/manager/tracking', icon: BarChart2, label: 'Tracking' }
]
const CUSTOMER_NAV = [
    { to: '/customer/chat', icon: MessageSquare, label: 'AI Assistant' },
    { to: '/customer/jobs', icon: ClipboardList, label: 'Job Cards' },
    { to: '/customer/history', icon: ClipboardList, label: 'Service History' },
    { to: '/customer/vehicles', icon: Car, label: 'My Vehicles' },
]

const NAV_MAP = { advisor: ADVISOR_NAV, manager: MANAGER_NAV, customer: CUSTOMER_NAV }

export default function Sidebar() {
    const { user, logout } = useAuth()
    const nav = NAV_MAP[user?.role] || []

    return (
        <aside style={{
            width: 'var(--sidebar-w)', minHeight: '100vh', background: 'var(--surface-2)',
            borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
            position: 'fixed', top: 0, left: 0, zIndex: 50,
        }}>
            {/* Logo */}
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: 'var(--shadow-primary)',
                    }}>
                        <Zap size={18} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>Service</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', lineHeight: 1.2 }}>Intelligence</div>
                    </div>
                </div>
            </div>

            {/* Nav items */}
            <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
                {nav.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} end={to.split('/').length === 2}
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                            margin: '2px 0', fontSize: '0.875rem', fontWeight: 500,
                            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                            background: isActive ? 'rgba(108,99,255,0.12)' : 'transparent',
                            transition: 'var(--transition)',
                            textDecoration: 'none',
                        })}
                    >
                        <Icon size={17} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* User + logout */}
            <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                    }}>
                        {user?.name?.charAt(0) || '?'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
                    </div>
                </div>
                <button onClick={logout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                    <LogOut size={14} /> Logout
                </button>
            </div>
        </aside>
    )
}
