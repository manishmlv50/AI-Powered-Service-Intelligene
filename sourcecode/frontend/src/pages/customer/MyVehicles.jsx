import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getVehicles, addVehicle } from '../../api/customers'
import { Car, Plus, X } from 'lucide-react'

export default function MyVehicles() {
    const { user } = useAuth()
    const [vehicles, setVehicles] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ make: '', model: '', year: '', vin: '' })
    const [saving, setSaving] = useState(false)

    const load = () => {
        getVehicles(user?.user_id).then(r => setVehicles(r.data || [])).catch(() => {
            setVehicles([
                { id: 'V001', customer_id: user?.user_id, make: 'Hyundai', model: 'Creta', year: 2022, vin: 'MALC1234AB5678901', mileage: 15000 },
            ])
        }).finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [user])

    const save = async () => {
        setSaving(true)
        try {
            await addVehicle(user?.user_id, { ...form, year: Number(form.year) })
            setShowForm(false)
            setForm({ make: '', model: '', year: '', vin: '' })
            load()
        } finally { setSaving(false) }
    }

    const VehicleCard = ({ v, i }) => (
        <div className="card stagger" style={{ '--i': i }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{
                    width: 48, height: 48, borderRadius: 12, background: 'rgba(108,99,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Car size={22} color="var(--primary)" />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{v.vin || 'VIN N/A'}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{v.make} {v.model}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 12 }}>{v.year}</div>
            <div style={{ display: 'flex', gap: 16 }}>
                {v.mileage && <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mileage</div>
                    <div style={{ fontWeight: 600 }}>{v.mileage?.toLocaleString()} km</div>
                </div>}
            </div>
        </div>
    )

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div className="page-title">My Vehicles</div>
                    <div className="page-subtitle">Manage your registered vehicles.</div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={15} /> Add Vehicle</button>
            </div>

            {loading ? (
                <div className="grid-3">
                    {[0, 1].map(i => <div key={i} className="card skeleton" style={{ height: 160 }} />)}
                </div>
            ) : vehicles.length === 0 ? (
                <div className="card empty-state" style={{ minHeight: 200 }}>
                    <Car size={40} /><p>No vehicles registered yet.</p>
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={15} />Add Vehicle</button>
                </div>
            ) : (
                <div className="grid-3">
                    {vehicles.map((v, i) => <VehicleCard key={v.id} v={v} i={i} />)}
                </div>
            )}

            {/* Add vehicle modal */}
            {showForm && (
                <>
                    <div className="overlay" onClick={() => setShowForm(false)} />
                    <div className="modal">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontWeight: 700 }}>Add New Vehicle</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><X size={16} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Make</label>
                                    <input className="form-control" placeholder="e.g. Hyundai" value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Model</label>
                                    <input className="form-control" placeholder="e.g. Creta" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Year</label>
                                    <input className="form-control" type="number" placeholder="2024" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">VIN (optional)</label>
                                    <input className="form-control" placeholder="Vehicle ID number" value={form.vin} onChange={e => setForm(f => ({ ...f, vin: e.target.value }))} />
                                </div>
                            </div>
                            <button className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }} onClick={save} disabled={saving || !form.make || !form.model || !form.year}>
                                {saving ? 'Saving…' : 'Add Vehicle'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
