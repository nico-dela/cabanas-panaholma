// src/services/firebase.js
// Reemplazá estos valores con los de tu proyecto Firebase
// Los encontrás en: Firebase Console → Tu proyecto → Configuración → Web app

import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
export const db = initializeFirestore(app, {
  // Mejora compatibilidad en redes/proxys/extensiones que bloquean WebChannel.
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
})

const emulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST
if (emulatorHost) {
  const [host, portText] = emulatorHost.split(':')
  const port = Number(portText)
  if (host && Number.isFinite(port)) {
    connectFirestoreEmulator(db, host, port)
  } else {
    console.warn('VITE_FIRESTORE_EMULATOR_HOST invalido. Usa formato host:puerto, por ejemplo localhost:8080')
  }
}

export const auth = getAuth(app)
