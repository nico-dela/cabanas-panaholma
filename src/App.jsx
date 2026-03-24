// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ConfigProvider } from './context/ConfigContext'
import Layout from './components/ui/Layout'
import LoginPage from './pages/LoginPage'
import CabanasPage from './pages/CabanasPage'
import CalendarioPage from './pages/CalendarioPage'
import PagosPage from './pages/PagosPage'
import MetricasPage from './pages/MetricasPage'
import NuevaReservaPage from './pages/NuevaReservaPage'
import ReservaDetallePage from './pages/ReservaDetallePage'
import ConfigPage from './pages/ConfigPage'

function PrivateRoute({ children }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--verde)' }}>Cargando...</div>
  return usuario ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ConfigProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<CabanasPage />} />
          <Route path="calendario" element={<CalendarioPage />} />
          <Route path="pagos" element={<PagosPage />} />
          <Route path="metricas" element={<MetricasPage />} />
          <Route path="reserva/nueva" element={<NuevaReservaPage />} />
          <Route path="reserva/:id" element={<ReservaDetallePage />} />
          <Route path="config" element={<ConfigPage />} />
        </Route>
      </Routes>
    </ConfigProvider>
  )
}