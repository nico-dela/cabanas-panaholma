// src/pages/CabanasPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { suscribirCabanas, actualizarEstadoCabana, suscribirReservas } from '../services/db'
import { CABANAS, ESTADO_CABANA } from '../utils/constants'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const COLORES = {
  disponible: { bg: 'var(--verde-claro)', color: 'var(--verde-texto)', label: 'Libre' },
  ocupada:    { bg: 'var(--rojo-claro)',  color: 'var(--rojo-texto)',  label: 'Ocupada' },
  reservada:  { bg: 'var(--amber-claro)', color: 'var(--amber-texto)', label: 'Reservada' },
  inactiva:   { bg: '#EBEBEB',            color: '#555',               label: 'Inactiva' },
}

export default function CabanasPage() {
  const [cabanas, setCabanas] = useState([])
  const [reservas, setReservas] = useState([])
  const [seccion, setSeccion] = useState('todas')
  const navigate = useNavigate()

  useEffect(() => {
    const unsub1 = suscribirCabanas(setCabanas)
    const unsub2 = suscribirReservas(setReservas)
    return () => { unsub1(); unsub2() }
  }, [])

  const libres    = cabanas.filter(c => c.estado === 'disponible').length
  const ocupadas  = cabanas.filter(c => c.estado === 'ocupada').length
  const reservadas = cabanas.filter(c => c.estado === 'reservada').length

  const reservasProximas = reservas
    .filter(r => ['confirmada','seña_cobrada'].includes(r.estado))
    .slice(0, 5)

  const cabanasVista = seccion === 'todas'
    ? cabanas
    : cabanas.filter(c => c.seccion === seccion)

  async function toggleInactiva(cabana) {
    const nuevo = cabana.estado === 'inactiva' ? 'disponible' : 'inactiva'
    await actualizarEstadoCabana(cabana.id, nuevo)
  }

  return (
    <div className="page-content">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
        {[
          { label: 'Libres',     val: libres,     color: 'var(--verde)' },
          { label: 'Ocupadas',   val: ocupadas,   color: 'var(--rojo)' },
          { label: 'Reservadas', val: reservadas, color: 'var(--amber)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '0.5px solid var(--gris-borde)', borderRadius: 'var(--radio)', padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 500, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: 'var(--texto-2)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtro secciones */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['todas','A','B'].map(s => (
          <button key={s} onClick={() => setSeccion(s)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 13, border: '0.5px solid var(--gris-borde)',
            background: seccion === s ? 'var(--verde)' : 'white',
            color: seccion === s ? 'white' : 'var(--texto-2)',
            fontWeight: seccion === s ? 500 : 400,
          }}>
            {s === 'todas' ? 'Todas' : `Sección ${s}`}
          </button>
        ))}
      </div>

      {/* Grid cabañas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
        {cabanasVista.map(c => {
          const col = COLORES[c.estado] || COLORES.inactiva
          return (
            <div key={c.id} className="card" style={{ padding: '10px 8px', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => navigate(`/reserva/nueva?cabana=${c.id}`)}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{c.nombre}</div>
              <div style={{ fontSize: 10, color: 'var(--texto-3)', marginBottom: 6 }}>{c.tipo}</div>
              <div style={{ background: col.bg, color: col.color, borderRadius: 20, fontSize: 10, padding: '2px 6px', display: 'inline-block' }}>
                {col.label}
              </div>
              {(c.estado === 'inactiva' || c.estadoInicial === 'inactiva') && (
                <button onClick={e => { e.stopPropagation(); toggleInactiva(c) }}
                  style={{ display: 'block', width: '100%', marginTop: 6, fontSize: 10, color: 'var(--verde)', background: 'none', border: 'none', textDecoration: 'underline' }}>
                  {c.estado === 'inactiva' ? 'Activar' : 'Desactivar'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Próximas reservas */}
      {reservasProximas.length > 0 && (
        <>
          <div className="section-title">Próximas reservas</div>
          {reservasProximas.map(r => (
            <div key={r.id} className="card" style={{ marginBottom: 8, display: 'flex', gap: 12, cursor: 'pointer' }}
              onClick={() => navigate(`/reserva/${r.id}`)}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--verde-claro)', color: 'var(--verde-texto)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                {cabanas.find(c => c.id === r.cabanaId)?.nombre?.slice(0,2).toUpperCase() || '??'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{r.huesped?.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--texto-2)', marginTop: 2 }}>
                  {r.checkIn ? format(new Date(r.checkIn), 'd MMM', { locale: es }) : ''} – {r.checkOut ? format(new Date(r.checkOut), 'd MMM', { locale: es }) : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--verde-texto)', marginTop: 2 }}>
                  ${r.monto?.toLocaleString('es-AR')}
                </div>
              </div>
              <span className={`badge badge-${r.estado === 'confirmada' ? 'amber' : 'verde'}`}>
                {r.estado === 'confirmada' ? 'Sin seña' : 'Señado'}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
