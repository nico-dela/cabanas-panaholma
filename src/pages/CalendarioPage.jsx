// src/pages/CalendarioPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { suscribirReservas } from '../services/db'
import { CABANAS } from '../utils/constants'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export default function CalendarioPage() {
  const [reservas, setReservas] = useState([])
  const [mes, setMes] = useState(new Date())
  const [cabanaFiltro, setCabanaFiltro] = useState('todas')
  const navigate = useNavigate()

  useEffect(() => {
    return suscribirReservas(setReservas)
  }, [])

  const diasMes = eachDayOfInterval({ start: startOfMonth(mes), end: endOfMonth(mes) })
  const primerDia = getDay(startOfMonth(mes))

  function estadoDia(dia) {
    const diaStr = format(dia, 'yyyy-MM-dd')
    const reservasFiltradas = cabanaFiltro === 'todas' ? reservas : reservas.filter(r => r.cabanaId === cabanaFiltro)
    for (const r of reservasFiltradas) {
      if (!r.checkIn || !r.checkOut) continue
      const ci = r.checkIn.slice(0, 10)
      const co = r.checkOut.slice(0, 10)
      if (diaStr >= ci && diaStr < co) {
        if (r.estado === 'en_curso') return 'ocupado'
        if (['confirmada', 'seña_cobrada'].includes(r.estado)) return 'reservado'
      }
    }
    return 'libre'
  }

  function reservasDelDia(dia) {
    const diaStr = format(dia, 'yyyy-MM-dd')
    return reservas.filter(r => {
      if (!r.checkIn || !r.checkOut) return false
      return diaStr >= r.checkIn.slice(0, 10) && diaStr < r.checkOut.slice(0, 10)
    })
  }

  const coloresDia = {
    libre:    { bg: 'transparent', color: 'var(--texto)' },
    ocupado:  { bg: 'var(--rojo-claro)',  color: 'var(--rojo-texto)' },
    reservado:{ bg: 'var(--amber-claro)', color: 'var(--amber-texto)' },
  }

  const diasSemana = ['Do','Lu','Ma','Mi','Ju','Vi','Sá']

  // Reservas del mes visible
  const reservasMes = reservas.filter(r => {
    if (!r.checkIn) return false
    const ci = parseISO(r.checkIn)
    return isSameMonth(ci, mes) || (r.checkOut && isSameMonth(parseISO(r.checkOut), mes))
  })

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

      {/* Filtro cabaña */}
      <div style={{ overflowX: 'auto', display: 'flex', gap: 6, marginBottom: 14, paddingBottom: 4 }}>
        <button onClick={() => setCabanaFiltro('todas')} style={{
          flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 12, border: '0.5px solid var(--gris-borde)',
          background: cabanaFiltro === 'todas' ? 'var(--verde)' : 'white',
          color: cabanaFiltro === 'todas' ? 'white' : 'var(--texto-2)',
        }}>Todas</button>
        {CABANAS.filter(c => c.estadoInicial !== 'inactiva').map(c => (
          <button key={c.id} onClick={() => setCabanaFiltro(c.id)} style={{
            flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 12, border: '0.5px solid var(--gris-borde)',
            background: cabanaFiltro === c.id ? 'var(--verde)' : 'white',
            color: cabanaFiltro === c.id ? 'white' : 'var(--texto-2)',
          }}>{c.nombre}</button>
        ))}
      </div>

      {/* Calendario */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
          {diasSemana.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--texto-3)', padding: '4px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
          {Array(primerDia).fill(null).map((_, i) => <div key={`v${i}`} />)}
          {diasMes.map(dia => {
            const estado = estadoDia(dia)
            const col = coloresDia[estado]
            const hoy = isToday(dia)
            return (
              <div key={dia.toISOString()} style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, fontSize: 12, background: col.bg, color: col.color,
                fontWeight: hoy ? 600 : 400,
                outline: hoy ? '1.5px solid var(--verde)' : 'none',
                cursor: estado !== 'libre' ? 'pointer' : 'default',
              }}>
                {format(dia, 'd')}
              </div>
            )
          })}
        </div>

        {/* Leyenda */}
        <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
          {[['Libre','transparent','var(--texto-2)'],['Ocupada','var(--rojo-claro)','var(--rojo-texto)'],['Reservada','var(--amber-claro)','var(--amber-texto)']].map(([l,bg,c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: '0.5px solid var(--gris-borde)' }} />
              <span style={{ color: 'var(--texto-2)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista reservas del mes */}
      <div className="section-title">Reservas de {format(mes, 'MMMM', { locale: es })}</div>
      {reservasMes.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--texto-3)', textAlign: 'center', padding: '20px 0' }}>No hay reservas este mes</p>
      )}
      {reservasMes.map(r => {
        const cabana = CABANAS.find(c => c.id === r.cabanaId)
        return (
          <div key={r.id} className="card" style={{ marginBottom: 8, display: 'flex', gap: 12, cursor: 'pointer' }}
            onClick={() => navigate(`/reserva/${r.id}`)}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--verde-claro)', color: 'var(--verde-texto)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, flexShrink: 0 }}>
              {cabana?.nombre?.slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{r.huesped?.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--texto-2)', marginTop: 2 }}>
                {r.checkIn ? format(parseISO(r.checkIn), 'd MMM', { locale: es }) : ''} – {r.checkOut ? format(parseISO(r.checkOut), 'd MMM', { locale: es }) : ''} · {cabana?.nombre}
              </div>
            </div>
            <span className={`badge ${r.estado === 'en_curso' ? 'badge-rojo' : r.estado === 'finalizada' ? 'badge-verde' : 'badge-amber'}`} style={{ alignSelf: 'flex-start' }}>
              {r.estado === 'en_curso' ? 'En curso' : r.estado === 'finalizada' ? 'Finalizada' : r.estado === 'confirmada' ? 'Confirmada' : r.estado === 'seña_cobrada' ? 'Señada' : r.estado}
            </span>
          </div>
        )
      })}
    </div>
  )
}
