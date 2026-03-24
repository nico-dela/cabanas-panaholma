// src/pages/MetricasPage.jsx
import { useEffect, useState } from 'react'
import { suscribirReservas } from '../services/db'
import { CABANAS, CANALES } from '../utils/constants'
import { parseISO, getYear, getMonth, differenceInDays } from 'date-fns'

export default function MetricasPage() {
  const [reservas, setReservas] = useState([])
  const [anio, setAnio] = useState(new Date().getFullYear())

  useEffect(() => {
    return suscribirReservas(setReservas)
  }, [])

  const reservasAnio = reservas.filter(r => {
    if (!r.checkIn) return false
    try { return getYear(parseISO(r.checkIn)) === anio } catch { return false }
  }).filter(r => r.estado !== 'cancelada')

  // Ocupación por cabaña
  const ocupacionPorCabana = CABANAS.filter(c => c.estadoInicial === 'disponible').map(c => {
    const res = reservasAnio.filter(r => r.cabanaId === c.id)
    const noches = res.reduce((s, r) => s + (r.noches || 0), 0)
    const pct = Math.round(noches / 365 * 100)
    return { ...c, noches, pct }
  }).sort((a, b) => b.pct - a.pct)

  // Ingresos por mes
  const ingresosPorMes = Array(12).fill(0)
  reservasAnio.filter(r => ['seña_cobrada','en_curso','finalizada'].includes(r.estado)).forEach(r => {
    try {
      const m = getMonth(parseISO(r.checkIn))
      ingresosPorMes[m] += r.monto || 0
    } catch {}
  })
  const maxIngreso = Math.max(...ingresosPorMes, 1)

  // Canales
  const porCanal = CANALES.map(canal => ({
    canal,
    count: reservasAnio.filter(r => r.canal === canal).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count)
  const maxCanal = Math.max(...porCanal.map(c => c.count), 1)

  // KPIs
  const totalReservas = reservasAnio.length
  const totalIngresos = reservasAnio.filter(r => ['seña_cobrada','en_curso','finalizada'].includes(r.estado)).reduce((s, r) => s + (r.monto || 0), 0)
  const promedioNoches = totalReservas > 0 ? (reservasAnio.reduce((s, r) => s + (r.noches || 0), 0) / totalReservas).toFixed(1) : 0
  const ciudades = {}
  reservasAnio.forEach(r => { if (r.huesped?.ciudad) ciudades[r.huesped.ciudad] = (ciudades[r.huesped.ciudad] || 0) + 1 })
  const ciudadTop = Object.entries(ciudades).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  return (
    <div className="page-content">
      {/* Selector año */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setAnio(a => a - 1)}
          style={{ background: 'white', border: '0.5px solid var(--gris-borde)', borderRadius: 'var(--radio)', padding: '6px 14px', fontSize: 16 }}>‹</button>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{anio}</span>
        <button onClick={() => setAnio(a => a + 1)}
          style={{ background: 'white', border: '0.5px solid var(--gris-borde)', borderRadius: 'var(--radio)', padding: '6px 14px', fontSize: 16 }}>›</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 18 }}>
        {[
          { label: 'Reservas',        val: totalReservas },
          { label: 'Ingresos',        val: `$${Math.round(totalIngresos/1000)}K` },
          { label: 'Noches promedio', val: promedioNoches },
          { label: 'Ciudad top',      val: ciudadTop },
        ].map(k => (
          <div key={k.label} style={{ background: '#f5f5f3', borderRadius: 'var(--radio)', padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--texto-2)' }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 500, marginTop: 2 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Ingresos por mes */}
      <div className="section-title">Ingresos mensuales</div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
          {ingresosPorMes.map((val, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', background: val > 0 ? 'var(--verde)' : 'var(--gris-borde)', borderRadius: '3px 3px 0 0', height: `${Math.round(val / maxIngreso * 64)}px`, minHeight: val > 0 ? 4 : 0 }} />
              <span style={{ fontSize: 9, color: 'var(--texto-3)' }}>{meses[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ocupación por cabaña */}
      <div className="section-title">Ocupación por cabaña</div>
      <div className="card" style={{ marginBottom: 16 }}>
        {ocupacionPorCabana.map(c => (
          <div key={c.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
              <span style={{ color: 'var(--texto-2)' }}>{c.nombre}</span>
              <span style={{ fontWeight: 500 }}>{c.pct}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--gris-borde)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${c.pct}%`, background: 'var(--verde)', borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Canales */}
      {porCanal.length > 0 && (
        <>
          <div className="section-title">Canal de reservas</div>
          <div className="card" style={{ marginBottom: 16 }}>
            {porCanal.map(c => (
              <div key={c.canal} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: 'var(--texto-2)' }}>{c.canal}</span>
                  <span style={{ fontWeight: 500 }}>{c.count} reservas</span>
                </div>
                <div style={{ height: 6, background: 'var(--gris-borde)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round(c.count / maxCanal * 100)}%`, background: '#378ADD', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
