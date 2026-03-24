// src/pages/ConfigPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { suscribirConfig, guardarConfig, CONFIG_DEFAULT } from '../services/config'
import { CABANAS } from '../utils/constants'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function mmddToLabel(mmdd) {
  if (!mmdd) return ''
  const [m, d] = mmdd.split('-')
  return `${parseInt(d)} ${MESES[parseInt(m) - 1]}`
}

function dateToMmdd(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function mmddToInputDate(mmdd) {
  if (!mmdd) return ''
  return `2000-${mmdd}`
}

export default function ConfigPage() {
  const navigate = useNavigate()
  const [config, setConfig] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [seccion, setSeccion] = useState('precios')

  useEffect(() => {
    const unsub = suscribirConfig(c => setConfig(JSON.parse(JSON.stringify(c))))
    return unsub
  }, [])

  if (!config) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--texto-2)' }}>Cargando...</div>

  function setPrecio(cabanaId, tipo, valor) {
    setConfig(c => ({
      ...c,
      precios: {
        ...c.precios,
        [cabanaId]: { ...c.precios?.[cabanaId], [tipo]: parseFloat(valor) || 0 }
      }
    }))
  }

  function setTemporada(id, campo, valor) {
    setConfig(c => ({
      ...c,
      temporadas: c.temporadas.map(t =>
        t.id === id ? { ...t, [campo]: campo === 'desde' || campo === 'hasta' ? dateToMmdd(valor) : valor } : t
      )
    }))
  }

  function agregarTemporada() {
    const nuevo = { id: Date.now().toString(), nombre: 'Nueva temporada', desde: '01-01', hasta: '01-31' }
    setConfig(c => ({ ...c, temporadas: [...c.temporadas, nuevo] }))
  }

  function eliminarTemporada(id) {
    setConfig(c => ({ ...c, temporadas: c.temporadas.filter(t => t.id !== id) }))
  }

  async function handleGuardar() {
    setGuardando(true)
    try {
      await guardarConfig(config)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2000)
    } finally {
      setGuardando(false)
    }
  }

  const cabanasMostrar = CABANAS.filter(c => c.estadoInicial !== 'inactiva' || c.id === 'yola')

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: 'var(--gris-bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--verde)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20 }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontWeight: 500, fontSize: 16 }}>Configuración de precios</div>
        </div>
        <button onClick={handleGuardar} disabled={guardando} style={{
          background: guardado ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
          border: 'none', borderRadius: 20, padding: '5px 14px', fontSize: 13, color: 'white', fontWeight: 500
        }}>
          {guardado ? '✓ Guardado' : guardando ? '...' : 'Guardar'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'white', borderBottom: '0.5px solid var(--gris-borde)' }}>
        {[['precios','Precios'],['temporadas','Temporadas'],['ninos','Niños']].map(([k, l]) => (
          <button key={k} onClick={() => setSeccion(k)} style={{
            flex: 1, padding: '12px 0', border: 'none', background: 'none',
            fontSize: 13, fontWeight: seccion === k ? 500 : 400,
            color: seccion === k ? 'var(--verde)' : 'var(--texto-2)',
            borderBottom: seccion === k ? '2px solid var(--verde)' : '2px solid transparent',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: '16px 16px 100px' }}>

        {/* PRECIOS */}
        {seccion === 'precios' && (
          <>
            <p style={{ fontSize: 13, color: 'var(--texto-2)', marginBottom: 14 }}>
              Precio por cabaña por noche. El total se calcula multiplicando por adultos + niños según su porcentaje.
            </p>
            {cabanasMostrar.map(c => {
              const p = config.precios?.[c.id] || { temporadaAlta: 0, temporadaBaja: 0 }
              return (
                <div key={c.id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{c.nombre}</div>
                      <div style={{ fontSize: 11, color: 'var(--texto-3)' }}>{c.tipo} · hasta {c.capacidad} personas</div>
                    </div>
                    {c.estadoInicial === 'inactiva' && <span className="badge badge-gris">Inactiva</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="field-label">Temporada baja</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--texto-2)' }}>$</span>
                        <input className="input" type="number" min="0" value={p.temporadaBaja || ''}
                          onChange={e => setPrecio(c.id, 'temporadaBaja', e.target.value)}
                          style={{ paddingLeft: 22 }} placeholder="0" />
                      </div>
                    </div>
                    <div>
                      <label className="field-label">Temporada alta</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--texto-2)' }}>$</span>
                        <input className="input" type="number" min="0" value={p.temporadaAlta || ''}
                          onChange={e => setPrecio(c.id, 'temporadaAlta', e.target.value)}
                          style={{ paddingLeft: 22 }} placeholder="0" />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* TEMPORADAS */}
        {seccion === 'temporadas' && (
          <>
            <p style={{ fontSize: 13, color: 'var(--texto-2)', marginBottom: 14 }}>
              Definí los rangos de temporada alta. El resto del año se considera temporada baja.
            </p>
            {config.temporadas.map(t => (
              <div key={t.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <input
                    className="input"
                    value={t.nombre}
                    onChange={e => setTemporada(t.id, 'nombre', e.target.value)}
                    style={{ fontSize: 14, fontWeight: 500, border: 'none', padding: '0', width: 'auto', flex: 1 }}
                    placeholder="Nombre de la temporada"
                  />
                  <button onClick={() => eliminarTemporada(t.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--texto-3)', fontSize: 18, padding: '0 0 0 8px' }}>×</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="field-label">Desde</label>
                    <input className="input" type="date"
                      value={mmddToInputDate(t.desde)}
                      onChange={e => setTemporada(t.id, 'desde', e.target.value)} />
                    <div style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 3 }}>{mmddToLabel(t.desde)}</div>
                  </div>
                  <div>
                    <label className="field-label">Hasta</label>
                    <input className="input" type="date"
                      value={mmddToInputDate(t.hasta)}
                      onChange={e => setTemporada(t.id, 'hasta', e.target.value)} />
                    <div style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 3 }}>{mmddToLabel(t.hasta)}</div>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={agregarTemporada} className="btn-secondary" style={{ marginTop: 4 }}>
              + Agregar temporada
            </button>
          </>
        )}

        {/* NIÑOS */}
        {seccion === 'ninos' && (
          <>
            <p style={{ fontSize: 13, color: 'var(--texto-2)', marginBottom: 14 }}>
              Porcentaje del precio adulto que pagan los niños.
            </p>
            <div className="card">
              <label className="field-label">Porcentaje que pagan los niños</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                <input type="range" min="0" max="100" step="5"
                  value={config.porcentajeNinos}
                  onChange={e => setConfig(c => ({ ...c, porcentajeNinos: parseInt(e.target.value) }))}
                  style={{ flex: 1 }} />
                <span style={{ fontSize: 22, fontWeight: 500, minWidth: 48 }}>{config.porcentajeNinos}%</span>
              </div>
              <div style={{ marginTop: 16, background: 'var(--gris-bg)', borderRadius: 'var(--radio)', padding: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--texto-2)', marginBottom: 8 }}>Ejemplo de cálculo</div>
                {(() => {
                  const precioEj = 5000
                  const pctNinos = config.porcentajeNinos / 100
                  return (
                    <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--texto-2)' }}>Precio cabaña por noche</span>
                        <span>${precioEj.toLocaleString('es-AR')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--texto-2)' }}>1 adulto</span>
                        <span>${precioEj.toLocaleString('es-AR')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--texto-2)' }}>1 niño ({config.porcentajeNinos}%)</span>
                        <span>${Math.round(precioEj * pctNinos).toLocaleString('es-AR')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '0.5px solid var(--gris-borde)', paddingTop: 6, marginTop: 2, fontWeight: 500 }}>
                        <span>Total por noche</span>
                        <span style={{ color: 'var(--verde-texto)' }}>${Math.round(precioEj + precioEj * pctNinos).toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}