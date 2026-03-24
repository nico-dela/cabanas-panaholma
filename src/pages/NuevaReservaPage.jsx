// src/pages/NuevaReservaPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useConfig } from '../context/ConfigContext'
import { crearReserva, buscarOCrearHuesped } from '../services/db'
import { calcularMonto, esTemporadaAlta } from '../services/config'
import { CABANAS, CANALES, PORCENTAJES_SEÑA } from '../utils/constants'

const PASOS = ['Cabaña', 'Huésped', 'Fechas y monto', 'Seña']
const GUARDADO_TIMEOUT_MS = 15000

export default function NuevaReservaPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { usuario } = useAuth()
  const config = useConfig()
  const [paso, setPaso] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [montoAuto, setMontoAuto] = useState(null)

  const [form, setForm] = useState({
    cabanaId: params.get('cabana') || '',
    canal: 'WhatsApp',
    nombre: '', apellido: '', dni: '', telefono: '', ciudad: '',
    checkIn: '', checkOut: '',
    adultos: 1, ninos: 0, bebes: 0,
    monto: '',
    porcentajeSeña: 50,
    montoSeña: '',
    señaCobrada: false,
    notas: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const cabanaSeleccionada = CABANAS.find(c => c.id === form.cabanaId)

  useEffect(() => {
    if (!form.cabanaId || !form.checkIn || !form.checkOut || !config) {
      setMontoAuto(null)
      return
    }
    const calculado = calcularMonto({
      cabanaId: form.cabanaId,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      adultos: form.adultos,
      ninos: form.ninos,
      bebes: form.bebes,
      config,
    })
    if (calculado > 0) {
      setMontoAuto(calculado)
      set('monto', calculado.toString())
    } else {
      setMontoAuto(null)
    }
  }, [form.cabanaId, form.checkIn, form.checkOut, form.adultos, form.ninos, form.bebes, config])

  function calcularSeña() {
    return Math.round((parseFloat(form.monto) || 0) * form.porcentajeSeña / 100)
  }

  function noches() {
    if (!form.checkIn || !form.checkOut) return 0
    return Math.max(0, Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000))
  }

  function infoTemporada() {
    if (!form.checkIn || !config?.temporadas?.length) return null
    return esTemporadaAlta(form.checkIn, config.temporadas) ? 'Temporada alta' : 'Temporada baja'
  }

  async function handleSubmit() {
    setGuardando(true)
    setError('')
    try {
      const withTimeout = (promise, ms, mensaje) =>
        Promise.race([
          promise,
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error(mensaje)), ms)
          }),
        ])

      await withTimeout(buscarOCrearHuesped(form.dni, {
        nombre: form.nombre, apellido: form.apellido,
        telefono: form.telefono, ciudad: form.ciudad,
      }), GUARDADO_TIMEOUT_MS, 'Timeout creando/actualizando huesped')
      await withTimeout(crearReserva({
        cabanaId: form.cabanaId,
        canal: form.canal,
        huesped: { nombre: form.nombre + ' ' + form.apellido, dni: form.dni, telefono: form.telefono, ciudad: form.ciudad },
        checkIn: new Date(form.checkIn).toISOString(),
        checkOut: new Date(form.checkOut).toISOString(),
        noches: noches(),
        adultos: form.adultos,
        ninos: form.ninos,
        bebes: form.bebes,
        totalPersonas: form.adultos + form.ninos + form.bebes,
        monto: parseFloat(form.monto),
        porcentajeSeña: form.porcentajeSeña,
        montoSeña: form.porcentajeSeña === 0 ? 0 : (form.montoSeña ? parseFloat(form.montoSeña) : calcularSeña()),
        señaCobrada: form.señaCobrada,
        notas: form.notas,
        creadoPor: usuario?.email || 'desconocido',
      }), GUARDADO_TIMEOUT_MS, 'Timeout creando reserva')
      navigate('/')
    } catch (e) {
      const timeout = String(e?.message || '').toLowerCase().includes('timeout')
      setError(timeout
        ? 'No se pudo confirmar el guardado por conexion o bloqueo del navegador. Revisa la red/extensiones e intenta de nuevo.'
        : 'Error al guardar. Intenta de nuevo.'
      )
      console.error(e)
    } finally {
      setGuardando(false)
    }
  }

  const puedeAvanzar = [
    () => !!form.cabanaId,
    () => form.nombre && form.dni && form.telefono,
    () => form.checkIn && form.checkOut && form.monto && noches() > 0 && form.adultos >= 1 && (form.adultos + form.ninos + form.bebes) <= (cabanaSeleccionada?.capacidad || 99),
    () => true,
  ][paso]()

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: 'var(--gris-bg)' }}>
      <div style={{ background: 'var(--verde)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => paso > 0 ? setPaso(p => p - 1) : navigate(-1)}
          style={{ background: 'none', border: 'none', color: 'white', fontSize: 20 }}>&#8592;</button>
        <div>
          <div style={{ color: 'white', fontWeight: 500, fontSize: 16 }}>Nueva reserva</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Paso {paso + 1} de {PASOS.length}: {PASOS[paso]}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0' }}>
        {PASOS.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= paso ? 'var(--verde)' : 'var(--gris-borde)' }} />
        ))}
      </div>

      <div style={{ padding: '16px 16px 100px' }}>

        {paso === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="field-label">Cabaña</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                {CABANAS.filter(c => c.estadoInicial !== 'inactiva' || c.id === form.cabanaId).map(c => {
                  const precios = config?.precios?.[c.id]
                  return (
                    <button key={c.id} onClick={() => set('cabanaId', c.id)} style={{
                      padding: '10px 12px', borderRadius: 'var(--radio)', textAlign: 'left',
                      border: form.cabanaId === c.id ? '2px solid var(--verde)' : '0.5px solid var(--gris-borde)',
                      background: form.cabanaId === c.id ? 'var(--verde-claro)' : 'white',
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: form.cabanaId === c.id ? 'var(--verde-texto)' : 'var(--texto)' }}>{c.nombre}</div>
                      <div style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 1 }}>{c.tipo} · {c.capacidad} pers.</div>
                      {precios?.temporadaBaja > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--verde-texto)', marginTop: 3 }}>
                          desde ${precios.temporadaBaja.toLocaleString('es-AR')}/noche
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="field-label">Canal de consulta</label>
              <select className="input" value={form.canal} onChange={e => set('canal', e.target.value)}>
                {CANALES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {paso === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { k: 'nombre',   label: 'Nombre',             type: 'text',   placeholder: 'Juan' },
              { k: 'apellido', label: 'Apellido',            type: 'text',   placeholder: 'Garcia' },
              { k: 'dni',      label: 'DNI',                 type: 'number', placeholder: '12345678' },
              { k: 'telefono', label: 'Telefono / WhatsApp', type: 'tel',    placeholder: '+54 9 ...' },
              { k: 'ciudad',   label: 'Ciudad de origen',    type: 'text',   placeholder: 'Cordoba' },
            ].map(({ k, label, type, placeholder }) => (
              <div key={k}>
                <label className="field-label">{label}</label>
                <input className="input" type={type} placeholder={placeholder} value={form[k]} onChange={e => set(k, e.target.value)} />
              </div>
            ))}
          </div>
        )}

        {paso === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="field-label">Ingreso</label>
                <input className="input" type="date" value={form.checkIn} onChange={e => set('checkIn', e.target.value)} />
              </div>
              <div>
                <label className="field-label">Salida</label>
                <input className="input" type="date" value={form.checkOut} min={form.checkIn} onChange={e => set('checkOut', e.target.value)} />
              </div>
            </div>

            {noches() > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, background: 'var(--verde-claro)', borderRadius: 'var(--radio)', padding: '8px 12px', fontSize: 13, color: 'var(--verde-texto)', textAlign: 'center' }}>
                  {noches()} noche{noches() !== 1 ? 's' : ''}
                </div>
                {infoTemporada() && (
                  <div style={{ flex: 1, background: 'var(--amber-claro)', borderRadius: 'var(--radio)', padding: '8px 12px', fontSize: 13, color: 'var(--amber-texto)', textAlign: 'center' }}>
                    {infoTemporada()}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="field-label">Ocupantes</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[
                  ['adultos', 'Adultos', 1, null],
                  ['ninos', 'Ninos', 0, null],
                  ['bebes', 'Bebes (hasta 2 anos)', 0, 'gratis'],
                ].map(([k, label, min, extra]) => (
                  <div key={k}>
                    <div style={{ fontSize: 11, color: 'var(--texto-3)', marginBottom: 6 }}>
                      {label}
                      {extra && <span style={{ marginLeft: 4, color: 'var(--verde-texto)', fontWeight: 500 }}>{extra}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button type="button" onClick={() => set(k, Math.max(min, form[k] - 1))}
                        style={{ width: 34, height: 34, borderRadius: 'var(--radio)', border: '0.5px solid var(--gris-borde)', background: 'white', fontSize: 20, lineHeight: 1, flexShrink: 0 }}>-</button>
                      <span style={{ fontSize: 20, fontWeight: 500, flex: 1, textAlign: 'center' }}>{form[k]}</span>
                      <button type="button" onClick={() => set(k, form[k] + 1)}
                        style={{ width: 34, height: 34, borderRadius: 'var(--radio)', border: '0.5px solid var(--gris-borde)', background: 'white', fontSize: 20, lineHeight: 1, flexShrink: 0 }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              {cabanaSeleccionada && (() => {
                const total = form.adultos + form.ninos + form.bebes
                const cap = cabanaSeleccionada.capacidad
                const excede = total > cap
                return (
                  <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 'var(--radio)', fontSize: 12,
                    background: excede ? 'var(--rojo-claro)' : 'var(--verde-claro)',
                    color: excede ? 'var(--rojo-texto)' : 'var(--verde-texto)' }}>
                    {excede
                      ? 'Excede la capacidad maxima de ' + cap + ' personas'
                      : total + ' persona' + (total !== 1 ? 's' : '') + ' (bebes no pagan) - max. ' + cap}
                  </div>
                )
              })()}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                <label className="field-label" style={{ margin: 0 }}>Monto total ($)</label>
                {montoAuto !== null && (
                  <span style={{ fontSize: 11, color: 'var(--verde-texto)' }}>calculado automaticamente</span>
                )}
              </div>
              <input className="input" type="number" placeholder="0" value={form.monto}
                onChange={e => { set('monto', e.target.value); setMontoAuto(null) }} />

              {montoAuto !== null && noches() > 0 && cabanaSeleccionada && (() => {
                const alta = esTemporadaAlta(form.checkIn, config?.temporadas || [])
                const precios = config?.precios?.[form.cabanaId] || {}
                const precioPorNoche = alta ? (precios.temporadaAlta || 0) : (precios.temporadaBaja || 0)
                const pctNinos = (config?.porcentajeNinos || 50) / 100
                return (
                  <div style={{ marginTop: 8, background: 'var(--gris-bg)', borderRadius: 'var(--radio)', padding: 10, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--texto-2)' }}>Precio/noche ({alta ? 'alta' : 'baja'})</span>
                      <span>${precioPorNoche.toLocaleString('es-AR')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--texto-2)' }}>{form.adultos} adulto{form.adultos !== 1 ? 's' : ''} x {noches()} noches</span>
                      <span>${Math.round(form.adultos * precioPorNoche * noches()).toLocaleString('es-AR')}</span>
                    </div>
                    {form.ninos > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: 'var(--texto-2)' }}>{form.ninos} nino{form.ninos !== 1 ? 's' : ''} ({config?.porcentajeNinos}%) x {noches()} noches</span>
                        <span>${Math.round(form.ninos * precioPorNoche * pctNinos * noches()).toLocaleString('es-AR')}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '0.5px solid var(--gris-borde)', paddingTop: 6, marginTop: 4, fontWeight: 500, color: 'var(--verde-texto)' }}>
                      <span>Total</span>
                      <span>${montoAuto.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                )
              })()}
            </div>

            <div>
              <label className="field-label">Notas (opcional)</label>
              <textarea className="input" rows={3} placeholder="Observaciones..."
                value={form.notas} onChange={e => set('notas', e.target.value)} style={{ resize: 'none' }} />
            </div>
          </div>
        )}

        {paso === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ background: 'var(--verde-claro)', border: 'none' }}>
              <div style={{ fontSize: 12, color: 'var(--verde-texto)' }}>Monto total</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--verde-texto)' }}>
                ${parseFloat(form.monto || 0).toLocaleString('es-AR')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--verde-texto)', marginTop: 4 }}>
                {cabanaSeleccionada?.nombre} - {noches()} noches - {form.adultos + form.ninos} personas
              </div>
            </div>

            <div>
              <label className="field-label">Porcentaje de sena</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {PORCENTAJES_SEÑA.map(p => (
                  <button key={p} onClick={() => set('porcentajeSeña', p)} style={{
                    flex: 1, padding: '10px 0', borderRadius: 'var(--radio)', fontSize: 14, fontWeight: 500,
                    border: form.porcentajeSeña === p ? '2px solid var(--verde)' : '0.5px solid var(--gris-borde)',
                    background: form.porcentajeSeña === p ? 'var(--verde-claro)' : 'white',
                    color: form.porcentajeSeña === p ? 'var(--verde-texto)' : 'var(--texto)',
                  }}>
                    {p === 0 ? 'Sin sena' : p + '%'}
                  </button>
                ))}
              </div>
            </div>

            {form.porcentajeSeña > 0 && (
              <>
                <div>
                  <label className="field-label">Monto de sena ($)</label>
                  <input className="input" type="number"
                    value={form.montoSeña || calcularSeña()}
                    onChange={e => set('montoSeña', e.target.value)} />
                  <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 4 }}>
                    {form.porcentajeSeña}% sugerido: ${calcularSeña().toLocaleString('es-AR')}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="checkbox" id="sena-cobrada" checked={form.señaCobrada}
                    onChange={e => set('señaCobrada', e.target.checked)} style={{ width: 18, height: 18 }} />
                  <label htmlFor="sena-cobrada" style={{ fontSize: 14 }}>Sena ya cobrada</label>
                </div>
              </>
            )}

            {error && <p style={{ fontSize: 13, color: 'var(--rojo)', textAlign: 'center' }}>{error}</p>}
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          {paso < PASOS.length - 1 ? (
            <button className="btn-primary" onClick={() => setPaso(p => p + 1)} disabled={!puedeAvanzar}>
              Continuar
            </button>
          ) : (
            <button className="btn-primary" onClick={handleSubmit} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar reserva'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}