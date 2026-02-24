import { useEffect, useRef, useState } from 'react'

export default function StatCard({ label, value, icon: Icon, color = 'var(--primary)', delay = 0 }) {
    const [display, setDisplay] = useState(0)
    const animRef = useRef(null)

    useEffect(() => {
        let start = null
        const duration = 1000
        const target = Number(value) || 0
        cancelAnimationFrame(animRef.current)
        const step = ts => {
            if (!start) start = ts
            const p = Math.min((ts - start) / duration, 1)
            const ease = 1 - Math.pow(1 - p, 3) // ease-out-cubic
            setDisplay(Math.round(ease * target))
            if (p < 1) animRef.current = requestAnimationFrame(step)
        }
        const timeout = setTimeout(() => { animRef.current = requestAnimationFrame(step) }, delay)
        return () => { clearTimeout(timeout); cancelAnimationFrame(animRef.current) }
    }, [value, delay])

    return (
        <div className="card stagger" style={{ '--i': delay / 80, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </span>
                {Icon && (
                    <div style={{
                        width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `${color}22`,
                    }}>
                        <Icon size={16} color={color} />
                    </div>
                )}
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color, lineHeight: 1, animation: 'countUp 0.6s ease' }}>
                {display}
            </div>
        </div>
    )
}
