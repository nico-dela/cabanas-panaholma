// src/pages/ReservaDetallePage.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import { actualizarEstadoReserva } from '../services/db'
import { useAuth } from '../context/AuthContext'
import { CABANAS, ESTADO_RESERVA } from '../utils/constants'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const FLUJO = [
  { estado: 'consulta',     label: 'Consulta',     color: 'badge-gris'  },
  { estado: 'confirmada',   label: 'Confirmada',   color: 'badge-amber' },
  { estado: 'seña_cobrada', label: 'Seña cobrada', color: 'badge-amber' },
  { estado: 'en_curso',     label: 'En curso',     color: 'badge-rojo'  },
  { estado: 'finalizada',   label: 'Finalizada',   color: 'badge-verde' },
]

const SIGUIENTE = {
  consulta:     'confirmada',
  confirmada:   'seña_cobrada',
  seña_cobrada: 'en_curso',
  en_curso:     'finalizada',
}

const BTN_LABEL = {
  consulta:     'Confirmar reserva →',
  confirmada:   'Marcar seña cobrada →',
  seña_cobrada: 'Hacer check-in →',
  en_curso:     'Hacer check-out →',
}

export default function ReservaDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [reserva, setReserva] = useState(null)
  const [avanzando, setAvanzando] = useState(false)

  useEffect(() => {
    return onSnapshot(doc(db, 'reservas', id), snap => {
      if (snap.exists()) setReserva({ id: snap.id, ...snap.data() })
    })
  }, [id])

  if (!reserva) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--texto-2)' }}>Cargando...</div>

  const cabana = CABANAS.find(c => c.id === reserva.cabanaId)
  const pasoActual = FLUJO.findIndex(f => f.estado === reserva.estado)

  async function avanzarEstado() {
    const sig = SIGUIENTE[reserva.estado]
    if (!sig) return
    setAvanzando(true)
    await actualizarEstadoReserva(id, sig, usuario?.email)
    setAvanzando(false)
  }

  async function cancelar() {
    if (!confirm('¿Cancelar esta reserva?')) return
    await actualizarEstadoReserva(id, 'cancelada', usuario?.email)
    navigate('/')
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: 'var(--gris-bg)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--verde)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20 }}>←</button>
        <div style={{ color: 'white' }}>
          <div style={{ fontWeight: 500, fontSize: 16 }}>{reserva.huesped?.nombre}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{cabana?.nombre}</div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Estado actual */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Estado de la reserva</span>
            <span className={`badge ${FLUJO[pasoActual]?.color || 'badge-gris'}`}>{FLUJO[pasoActual]?.label}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {FLUJO.map((f, i) => (
              <div key={f.estado} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= pasoActual ? 'var(--verde)' : 'var(--gris-borde)' }} />
            ))}
          </div>
        </div>

        {/* Datos principales */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Detalle</div>
          {[
            ['Cabaña',         cabana?.nombre],
            ['Check-in',       reserva.checkIn  ? format(new Date(reserva.checkIn),  'EEEE d MMM yyyy', { locale: es }) : '-'],
            ['Check-out',      reserva.checkOut ? format(new Date(reserva.checkOut), 'EEEE d MMM yyyy', { locale: es }) : '-'],
            ['Noches',         reserva.noches],
            ['Monto total',    `$${(reserva.monto || 0).toLocaleString('es-AR')}`],
            ['Seña',           reserva.porcentajeSeña === 0 ? 'Sin seña' : `${reserva.porcentajeSeña}% · $${(reserva.montoSeña || 0).toLocaleString('es-AR')}`],
            ['Seña cobrada',   reserva.señaCobrada ? '✓ Sí' : '✗ No'],
            ['Canal',          reserva.canal],
            ['Registrado por', reserva.creadoPor],
            ['Fecha registro', reserva.creadoEn?.toDate ? format(reserva.creadoEn.toDate(), 'dd/MM/yyyy HH:mm') : '-'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid var(--gris-borde)', fontSize: 13 }}>
              <span style={{ color: 'var(--texto-2)' }}>{k}</span>
              <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Datos huésped */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Huésped</div>
          {[
            ['Nombre',  reserva.huesped?.nombre],
            ['DNI',     reserva.huesped?.dni],
            ['Teléfono',reserva.huesped?.telefono],
            ['Ciudad',  reserva.huesped?.ciudad],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid var(--gris-borde)', fontSize: 13 }}>
              <span style={{ color: 'var(--texto-2)' }}>{k}</span>
              <span style={{ fontWeight: 500 }}>{v || '-'}</span>
            </div>
          ))}
        </div>

        {reserva.notas && (
          <div className="card">
            <div className="section-title">Notas</div>
            <p style={{ fontSize: 13, color: 'var(--texto-2)', marginTop: 6 }}>{reserva.notas}</p>
          </div>
        )}

        {/* Historial */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 10 }}>Historial</div>
          {(reserva.historial || []).map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--verde)', marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{FLUJO.find(f => f.estado === h.estado)?.label || h.estado}</div>
                <div style={{ fontSize: 11, color: 'var(--texto-3)' }}>{h.usuario} · {h.fecha ? format(new Date(h.fecha), 'dd/MM/yyyy HH:mm') : ''}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Acciones */}
        {SIGUIENTE[reserva.estado] && (
          <button className="btn-primary" onClick={avanzarEstado} disabled={avanzando}>
            {avanzando ? 'Guardando...' : BTN_LABEL[reserva.estado]}
          </button>
        )}
        {reserva.estado !== 'finalizada' && reserva.estado !== 'cancelada' && (
          <button className="btn-secondary" onClick={cancelar} style={{ color: 'var(--rojo)' }}>
            Cancelar reserva
          </button>
        )}
      </div>
    </div>
  )
}
