// src/utils/constants.js

export const CABANAS = [
  // Sección A
  { id: 'vinchita',    nombre: 'La Vinchita',  tipo: '2 dormitorios',      seccion: 'A', estadoInicial: 'disponible', capacidad: 6 },
  { id: 'tio-joaquin', nombre: 'Tío Joaquín',  tipo: '1 dormitorio',       seccion: 'A', estadoInicial: 'disponible', capacidad: 4 },
  { id: 'martina',     nombre: 'Martina',       tipo: 'Monoambiente PB',    seccion: 'A', estadoInicial: 'disponible', capacidad: 4 },
  { id: 'silvita',     nombre: 'Silvita',       tipo: 'Monoambiente PB',    seccion: 'A', estadoInicial: 'disponible', capacidad: 4 },
  { id: 'tio-edgardo', nombre: 'Tío Edgardo',  tipo: 'Monoambiente PA',    seccion: 'A', estadoInicial: 'disponible',   capacidad: 4},
  { id: 'huguito',     nombre: 'Huguito',       tipo: 'Monoambiente PA',    seccion: 'A', estadoInicial: 'disponible',   capacidad: 4},
  // { id: 'huguito',     nombre: 'Huguito',       tipo: 'Monoambiente PA',    seccion: 'A', estadoInicial: 'inactiva',   capacidad: 4, nota: 'Goteras' },
  // Sección B
  { id: 'cabana-1',    nombre: 'Cabaña 1',      tipo: 'Monoambiente PB',    seccion: 'B', estadoInicial: 'disponible', capacidad: 4 },
  { id: 'cabana-2',    nombre: 'Cabaña 2',      tipo: 'Monoambiente PB',    seccion: 'B', estadoInicial: 'disponible', capacidad: 4 },
  { id: 'cabana-3',    nombre: 'Cabaña 3',      tipo: 'Monoambiente PA',    seccion: 'B', estadoInicial: 'disponible', capacidad: 4 },
  { id: 'cabana-4',    nombre: 'Cabaña 4',      tipo: 'Monoambiente PA',    seccion: 'B', estadoInicial: 'disponible', capacidad: 4 },
  { id: 'yola',        nombre: 'La Yola',        tipo: '-',                  seccion: 'B', estadoInicial: 'inactiva',   capacidad: 4 },
]

export const ESTADO_CABANA = {
  DISPONIBLE: 'disponible',
  OCUPADA:    'ocupada',
  RESERVADA:  'reservada',
  INACTIVA:   'inactiva',
}

export const ESTADO_RESERVA = {
  CONSULTA:       'consulta',
  CONFIRMADA:     'confirmada',
  SEÑA_COBRADA:   'seña_cobrada',
  EN_CURSO:       'en_curso',
  FINALIZADA:     'finalizada',
  CANCELADA:      'cancelada',
}

export const CANALES = [
  'WhatsApp',
  'Instagram',
  'Facebook Marketplace',
  'Página local',
  'Página nacional',
  'Referido',
  'Otro',
]

export const USUARIOS_FAMILIA = [
  { id: 'mama',    nombre: 'Mamá' },
  { id: 'papa',    nombre: 'Papá' },
  { id: 'hermana', nombre: 'Hermana' },
  { id: 'novio',   nombre: 'Novio' },
]

export const PORCENTAJES_SEÑA = [0, 30, 50]