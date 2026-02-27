import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Zap, Eye, EyeOff, ChevronRight } from 'lucide-react'

const QUICK_LOGINS = [
    { label: 'Service Advisor', username: 'advisor', password: 'demo', role: 'advisor', color: 'var(--primary)' },
    { label: 'Workshop Manager', username: 'manager', password: 'demo', role: 'manager', color: 'var(--accent)' },
    { label: 'Customer', username: 'customer', password: 'demo', role: 'customer', color: 'var(--warning)' },
]

export default function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ username: '', password: '' })
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const doLogin = async (username, password) => {
        setLoading(true); setError(null)
        try {
            const user = await login(username, password)
            const routes = { advisor: '/advisor', manager: '/manager', customer: '/customer/chat' }
            navigate(routes[user.role] || '/')
        } catch (err) {
            setError('Invalid credentials. Try advisor / demo, manager / demo, customer / demo, or C001 / customer123')
        } finally { setLoading(false) }
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface)',
            backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(108,99,255,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,217,192,0.08) 0%, transparent 60%)',
        }}>
            <div style={{ width: '100%', maxWidth: 440, padding: '0 20px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 32px var(--primary-glow)',
                        animation: 'slideUp 0.5s ease',
                    }}>
                        <Zap size={30} color="#fff" />
                    </div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, animation: 'slideUp 0.5s ease 0.1s both' }}>
                        Service Intelligence
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '0.9rem', animation: 'slideUp 0.5s ease 0.2s both' }}>
                        AI-Powered Automobile Service Co-Pilot
                    </p>
                </div>

                {/* Card */}
                <div className="card" style={{ animation: 'slideUp 0.5s ease 0.3s both' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Sign in to your portal</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Username / User ID</label>
                            <input className="form-control" placeholder="username or user ID (e.g., rohit.sharma or C001)"
                                value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input className="form-control" type={showPw ? 'text' : 'password'}
                                    placeholder="demo"
                                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && doLogin(form.username, form.password)}
                                    style={{ paddingRight: 40 }} />
                                <button onClick={() => setShowPw(v => !v)} style={{
                                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', color: 'var(--text-muted)',
                                }}>
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div style={{ background: 'rgba(255,90,90,0.1)', border: '1px solid rgba(255,90,90,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.8rem', color: 'var(--danger)' }}>
                                {error}
                            </div>
                        )}

                        <button className="btn btn-primary btn-lg" onClick={() => doLogin(form.username, form.password)}
                            disabled={loading || !form.username} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                            {loading ? 'Signing in...' : 'Sign In'}
                            {!loading && <ChevronRight size={16} />}
                        </button>
                    </div>

                    {/* Quick login pills */}
                    <div className="divider" />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10, textAlign: 'center' }}>Quick demo logins</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {QUICK_LOGINS.map(q => (
                            <button key={q.role} onClick={() => doLogin(q.username, q.password)}
                                style={{
                                    flex: 1, padding: '8px 6px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600,
                                    background: `${q.color}15`, border: `1px solid ${q.color}40`, color: q.color,
                                    cursor: 'pointer', transition: 'var(--transition)',
                                }}>
                                {q.label}
                            </button>
                        ))}
                    </div>
                </div>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Agents League Hackathon · Azure AI Foundry
                </p>
            </div>
        </div>
    )
}
