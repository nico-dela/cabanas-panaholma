// src/services/db.js
// Todas las operaciones con Firestore

import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, setDoc
} from 'firebase/firestore'
import { db } from './firebase'
import { CABANAS } from '../utils/constants'

// ─── CABAÑAS ─────────────────────────────────────────────────────────────────

export async function inicializarCabanas() {
  // Solo corre una vez para crear las cabañas en Firestore
  for (const cabana of CABANAS) {
    const ref = doc(db, 'cabanas', cabana.id)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        ...cabana,
        estado: cabana.estadoInicial,
        creadoEn: serverTimestamp(),
      })
    }
  }
}

export function suscribirCabanas(callback) {
  return onSnapshot(collection(db, 'cabanas'), snap => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(data)
  })
}

export async function actualizarEstadoCabana(cabanaId, estado, nota = null) {
  const ref = doc(db, 'cabanas', cabanaId)
  const update = { estado, actualizadoEn: serverTimestamp() }
  if (nota !== null) update.nota = nota
  await updateDoc(ref, update)
}

// ─── RESERVAS ────────────────────────────────────────────────────────────────

export async function crearReserva(datos) {
  // datos: { cabanaId, huesped, checkIn, checkOut, canal, seña, monto, creadoPor }
  const ref = await addDoc(collection(db, 'reservas'), {
    ...datos,
    estado: 'consulta',
    creadoEn: serverTimestamp(),
    historial: [{
      estado: 'consulta',
      fecha: new Date().toISOString(),
      usuario: datos.creadoPor,
    }]
  })
  return ref.id
}

export async function actualizarEstadoReserva(reservaId, nuevoEstado, usuario) {
  const ref = doc(db, 'reservas', reservaId)
  const snap = await getDoc(ref)
  const historial = snap.data().historial || []
  await updateDoc(ref, {
    estado: nuevoEstado,
    actualizadoEn: serverTimestamp(),
    historial: [...historial, {
      estado: nuevoEstado,
      fecha: new Date().toISOString(),
      usuario,
    }]
  })
}

export function suscribirReservas(callback, filtros = {}) {
  let q = query(collection(db, 'reservas'), orderBy('checkIn', 'desc'))
  if (filtros.cabanaId) q = query(q, where('cabanaId', '==', filtros.cabanaId))
  if (filtros.estado)   q = query(q, where('estado', '==', filtros.estado))
  return onSnapshot(q, snap => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(data)
  })
}

export async function obtenerReservasPorMes(anio, mes) {
  const inicio = new Date(anio, mes - 1, 1).toISOString()
  const fin    = new Date(anio, mes, 0, 23, 59).toISOString()
  const q = query(
    collection(db, 'reservas'),
    where('checkIn', '>=', inicio),
    where('checkIn', '<=', fin)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── HUÉSPEDES ───────────────────────────────────────────────────────────────

export async function buscarOCrearHuesped(dni, datos) {
  const ref = doc(db, 'huespedes', dni)
  // Evita lectura previa (getDoc) que puede fallar si el cliente está offline.
  // Con merge:true se comporta como "crear o actualizar" en una sola operación.
  await setDoc(ref, {
    ...datos,
    dni,
    actualizadoEn: serverTimestamp(),
  }, { merge: true })
  return ref.id
}

export async function obtenerHuesped(dni) {
  const snap = await getDoc(doc(db, 'huespedes', dni))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
