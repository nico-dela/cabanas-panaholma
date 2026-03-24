// src/components/ui/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/',           icon: '🏠', label: 'Cabañas'    },
  { to: '/calendario', icon: '📅', label: 'Calendario' },
  { to: '/pagos',      icon: '💰', label: 'Pagos'      },
  { to: '/metricas',   icon: '📊', label: 'Métricas'   },
]

export default function Layout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const navLinkStyle = ({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 16px', borderRadius: 'var(--radio)',
    textDecoration: 'none', fontSize: 14,
    fontWeight: isActive ? 500 : 400,
    background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
    color: 'white',
  })

  const navLinkMobileStyle = ({ isActive }) => ({
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 2, padding: '8px 0 10px', textDecoration: 'none',
    color: isActive ? 'var(--verde)' : 'var(--texto-3)',
    fontSize: 10, fontWeight: isActive ? 500 : 400,
  })

  return (
    <div className="app-shell">

      {/* ── SIDEBAR (desktop) ── */}
      <aside className="sidebar">
        <div style={{ padding: '20px 16px 12px' }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'white' }}>Cabañas Aires del Rio</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Cura Brochero · Córdoba</div>
        </div>

        <nav style={{ padding: '8px 8px', flex: 1 }}>
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} style={navLinkStyle}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '0.5px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => navigate('/config')} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
            borderRadius: 'var(--radio)', border: 'none', background: 'transparent',
            color: 'white', fontSize: 14, cursor: 'pointer', width: '100%', textAlign: 'left',
          }}>
            <span style={{ fontSize: 18 }}>⚙️</span> Precios
          </button>
          <button onClick={() => navigate('/reserva/nueva')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 'var(--radio)', border: 'none',
            background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 14,
            cursor: 'pointer', fontWeight: 500,
          }}>
            + Nueva reserva
          </button>
          <button onClick={() => logout().then(() => navigate('/login'))} style={{
            padding: '8px 16px', borderRadius: 'var(--radio)', border: 'none',
            background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 13,
            cursor: 'pointer',
          }}>
            Salir
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <header className="mobile-header">
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'white' }}>Cabañas Aires del Rio</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Cura Brochero · Córdoba</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/config')}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: 'white' }}>
            ⚙️
          </button>
          <button onClick={() => logout().then(() => navigate('/login'))}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: 'white' }}>
            Salir
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ── FAB (mobile only) ── */}
      <button className="fab-mobile" onClick={() => navigate('/reserva/nueva')}>+</button>

      {/* ── BOTTOM NAV (mobile only) ── */}
      <nav className="bottom-nav">
        {navItems.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={navLinkMobileStyle}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}