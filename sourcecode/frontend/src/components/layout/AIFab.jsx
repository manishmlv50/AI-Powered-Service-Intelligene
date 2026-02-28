import { useState, useRef, useEffect } from 'react'
import { Send, X, Sparkles } from 'lucide-react'
import { useAgent } from '../../hooks/useAgent'

const QUICK_PROMPTS = {
    advisor: ['Generate job card', 'Summarise open jobs', 'Which jobs need attention?'],
    manager: ['Which jobs are at risk?', "Today's completions", 'Jobs by status'],
    customer: ['Status of my service', 'Explain brake pad charge', 'When will my car be ready?'],
}

export default function AIFab({ role = 'advisor' }) {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState([
        { role: 'ai', text: "👋 Hi! I'm your AI Service Assistant. How can I help you today?" }
    ])
    const [input, setInput] = useState('')
    const { call, loading } = useAgent()
    const endRef = useRef(null)

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

    const send = async (text) => {
        const msg = text || input.trim()
        if (!msg) return
        setInput('')
        setMessages(m => [...m, { role: 'user', text: msg }])
        const res = await call({ action: 'chat', user_input: msg })
        const reply = res?.result?.reply || res?.result?.communication?.message || "I'm processing that request. Please check back in a moment."
        setMessages(m => [...m, { role: 'ai', text: reply }])
    }

    return (
        <>
            {/* FAB button */}
            <button onClick={() => setOpen(o => !o)} style={{
                position: 'fixed', bottom: 28, right: 28, zIndex: 90,
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 0 var(--primary-glow)',
                animation: open ? 'none' : 'fabPulse 2s infinite',
                cursor: 'pointer', transition: 'var(--transition)',
            }}>
                <style>{`
          @keyframes fabPulse {
            0%,100% { box-shadow: 0 0 0 0 rgba(108,99,255,0.5) }
            50% { box-shadow: 0 0 0 14px rgba(108,99,255,0) }
          }
        `}</style>
                {open ? <X size={22} color="#fff" /> : <span style={{ color: '#fff', fontWeight: 800, letterSpacing: '0.04em' }}>AI</span>}
            </button>

            {/* Panel */}
            {open && (
                <div style={{
                    position: 'fixed', bottom: 96, right: 28, width: 360, zIndex: 89,
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                    boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.3s ease',
                    display: 'flex', flexDirection: 'column', height: 480,
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '14px 18px', borderBottom: '1px solid var(--border)',
                        background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,217,192,0.08))',
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <Sparkles size={16} color="var(--primary)" />
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>AI Assistant</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Powered by Azure AI Foundry</div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                <div className={m.role === 'user' ? 'bubble-user' : 'bubble-system'} style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ display: 'flex', gap: 5, padding: 10 }}>
                                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    {/* Quick prompts */}
                    <div style={{ padding: '6px 10px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
                        {(QUICK_PROMPTS[role] || []).map(p => (
                            <button key={p} onClick={() => send(p)} style={{
                                padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem',
                                background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)',
                                color: 'var(--primary)', cursor: 'pointer',
                            }}>{p}</button>
                        ))}
                    </div>

                    {/* Input */}
                    <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                        <input value={input} onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && send()}
                            placeholder="Ask me anything..." className="form-control"
                            style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }} />
                        <button onClick={() => send()} className="btn btn-primary btn-sm" disabled={loading || !input.trim()}>
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
