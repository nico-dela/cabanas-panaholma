// src/services/config.js
// Gestión de configuración de precios y temporadas en Firestore

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { CABANAS } from '../utils/constants'

const CONFIG_DOC = 'app/configuracion'

// Configuración por defecto
export const CONFIG_DEFAULT = {
  porcentajeNinos: 50, // % del precio adulto que pagan los niños
  temporadas: [
    // Rangos de temporada alta — formato MM-DD
    { id: '1', nombre: 'Temporada Baja', desde: '01-01', hasta: '03-15' },
    { id: '2', nombre: 'Temporada Alta', desde: '07-01', hasta: '07-31' },
  ],
  precios: Object.fromEntries(
    CABANAS.map(c => [c.id, { temporadaAlta: 0, temporadaBaja: 0 }])
  ),
}

export function suscribirConfig(callback) {
  return onSnapshot(doc(db, 'app', 'configuracion'), snap => {
    if (snap.exists()) {
      callback({ ...CONFIG_DEFAULT, ...snap.data() })
    } else {
      callback(CONFIG_DEFAULT)
    }
  })
}

export async function guardarConfig(config) {
  await setDoc(doc(db, 'app', 'configuracion'), config, { merge: true })
}

// Determina si una fecha cae en temporada alta
export function esTemporadaAlta(fecha, temporadas) {
  const d = new Date(fecha)
  const mmdd = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return temporadas.some(t => {
    if (t.desde <= t.hasta) {
      return mmdd >= t.desde && mmdd <= t.hasta
    } else {
      // Rango que cruza año nuevo (ej: 12-01 a 01-15)
      return mmdd >= t.desde || mmdd <= t.hasta
    }
  })
}

// Calcula el monto total de una reserva
// Bebés (hasta 2 años) no pagan — se registran pero no se suman al monto
export function calcularMonto({ cabanaId, checkIn, checkOut, adultos, ninos, bebes = 0, config }) {
  if (!checkIn || !checkOut || !config) return 0

  const inicio = new Date(checkIn)
  const fin = new Date(checkOut)
  const precios = config.precios?.[cabanaId] || { temporadaAlta: 0, temporadaBaja: 0 }
  const pctNinos = (config.porcentajeNinos || 50) / 100

  let total = 0
  const cursor = new Date(inicio)

  while (cursor < fin) {
    const alta = esTemporadaAlta(cursor, config.temporadas || [])
    const precioPorNoche = alta ? precios.temporadaAlta : precios.temporadaBaja
    const costoAdultos = adultos * precioPorNoche
    const costoNinos = ninos * precioPorNoche * pctNinos
    total += costoAdultos + costoNinos
    cursor.setDate(cursor.getDate() + 1)
  }

  return Math.round(total)
}