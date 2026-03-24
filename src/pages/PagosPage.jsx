// src/pages/PagosPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { suscribirReservas } from '../services/db'
import { CABANAS } from '../utils/constants'
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'

export default function PagosPage() {
  const [reservas, setReservas] = useState([])
  const [mes, setMes] = useState(new Date())
  const navigate = useNavigate()

  useEffect(() => {
    return suscribirReservas(setReservas)
  }, [])

  const reservasMes = reservas.filter(r => {
    if (!r.checkIn) return false
    try {
      return isWithinInterval(parseISO(r.checkIn), { start: startOfMonth(mes), end: endOfMonth(mes) })
    } catch { return false }
  })

  const totalCobrado = reservasMes
    .filter(r => ['seña_cobrada','en_curso','finalizada'].includes(r.estado))
    .reduce((s, r) => s + (r.monto || 0), 0)

  const totalPendiente = reservasMes
    .filter(r => r.estado === 'confirmada')
    .reduce((s, r) => s + (r.montoSeña || 0), 0)

  const totalFinalizado = reservasMes
    .filter(r => r.estado === 'finalizada')
    .reduce((s, r) => s + (r.monto || 0), 0)

  const reservasOrdenadas = [...reservasMes].sort((a, b) => {
    if (!a.creadoEn || !b.creadoEn) return 0
    const da = a.creadoEn?.toDate ? a.creadoEn.toDate() : new Date(a.creadoEn)
    const db_ = b.creadoEn?.toDate ? b.creadoEn.toDate() : new Date(b.creadoEn)
    return db_ - da
  })

  const estadoLabel = {
    consulta: { label: 'Consulta', cls: 'badge-gris' },
    confirmada: { label: 'Sin seña', cls: 'badge-amber' },
    seña_cobrada: { label: 'Señada', cls: 'badge-amber' },
    en_curso: { label: 'En curso', cls: 'badge-rojo' },
    finalizada: { label: 'Finalizada', cls: 'badge-verde' },
    cancelada: { label: 'Cancelada', cls: 'badge-gris' },
  }

  return (
    <div className="page-content">
      {/* Navegación mes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setMes(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          style={{ background: 'white', border: '0.5px solid var(--gris-borde)', borderRadius: 'var(--radio)', padding: '6px 14px', fontSize: 16 }}>‹</button>
        <span style={{ fontSize: 15, fontWeight: 500, textTransform: 'capitalize' }}>
          {format(mes, 'MMMM yyyy', { locale: es })}
        </span>
        <button onClick={() => setMes(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          style={{ background: 'white', border: '0.5px solid var(--gris-borde)', borderRadius: 'var(--radio)', padding: '6px 14px', fontSize: 16 }}>›</button>
      </div>

      {/* Métricas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 18 }}>
        {[
          { label: 'Reservas',      val: reservasMes.length,                         sub: 'este mes' },
          { label: 'Ingresos',      val: `$${totalCobrado.toLocaleString('es-AR')}`,  sub: 'confirmados' },
          { label: 'Pendiente',     val: `$${totalPendiente.toLocaleString('es-AR')}`,sub: 'señas por cobrar' },
          { label: 'Finalizado',    val: `$${totalFinalizado.toLocaleString('es-AR')}`,sub: 'cobrado completo' },
        ].map(m => (
          <div key={m.label} style={{ background: 'var(--color-background-secondary, #f5f5f3)', borderRadius: 'var(--radio)', padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--texto-2)' }}>{m.label}</div>
            <div style={{ fontSize: 20, fontWeight: 500, marginTop: 2 }}>{m.val}</div>
            <div style={{ fontSize: 11, color: 'var(--verde-texto)', marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Lista movimientos */}
      <div className="section-title">Movimientos</div>

      {reservasOrdenadas.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--texto-3)', textAlign: 'center', padding: '20px 0' }}>Sin reservas este mes</p>
      )}

      {reservasOrdenadas.map(r => {
        const cabana = CABANAS.find(c => c.id === r.cabanaId)
        const esBadge = estadoLabel[r.estado] || { label: r.estado, cls: 'badge-gris' }
        const fechaRegistro = r.creadoEn?.toDate ? r.creadoEn.toDate() : r.creadoEn ? new Date(r.creadoEn) : null
        return (
          <div key={r.id} className="card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
            onClick={() => navigate(`/reserva/${r.id}`)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{r.huesped?.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--texto-2)', marginTop: 2 }}>{cabana?.nombre} · {r.noches} noches</div>
              <div style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 2 }}>
                {r.canal}{fechaRegistro ? ` · ${format(fechaRegistro, 'd MMM HH:mm', { locale: es })}` : ''}
              </div>
              <div style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 1 }}>Registró: {r.creadoPor}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: r.estado === 'cancelada' ? 'var(--texto-3)' : 'var(--verde-texto)' }}>
                {r.estado === 'cancelada' ? '—' : `$${(r.monto || 0).toLocaleString('es-AR')}`}
              </div>
              {r.porcentajeSeña > 0 && r.estado !== 'finalizada' && r.estado !== 'cancelada' && (
                <div style={{ fontSize: 11, color: r.señaCobrada ? 'var(--verde-texto)' : 'var(--amber-texto)', marginTop: 2 }}>
                  {r.señaCobrada ? `✓ Seña $${(r.montoSeña||0).toLocaleString('es-AR')}` : `⏳ Seña $${(r.montoSeña||0).toLocaleString('es-AR')}`}
                </div>
              )}
              <span className={`badge ${esBadge.cls}`} style={{ marginTop: 6, display: 'inline-block' }}>{esBadge.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
