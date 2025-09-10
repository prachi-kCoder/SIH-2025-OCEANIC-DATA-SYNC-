import { NavLink } from 'react-router-dom'
import { getCurrentUser, logout } from '../../services/auth'
import api from '../../services/api'

export default function TopNav() {
  const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`

  async function handleRefresh() {
    try {
      await api.getData()
      window.dispatchEvent(new CustomEvent('oceanic:data:refreshed'))
    } catch {}
  }

  function handleLogout() {
    logout()
    window.location.href = '/'
  }

  const user = getCurrentUser()

  return (
    <>
      {/* Navbar */}
      <div 
        className="navbar" 
        style={{
          width: '100%', 
          background: 'linear-gradient(90deg, #0b3b2f, #0f172a)',
          borderBottom: '1px solid rgba(16,185,129,0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          position: 'static',   // fixed on top
          top: 0,
          left: 0,
          zIndex: 1000,
          boxSizing: 'border-box',
          top: 0,
left: 0,
right: 0,zIndex: 1000,
  boxSizing: 'border-box'
        }}
      >
        {/* Brand */}
        <div className="brand" style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
          Oceara
        </div>

        {/* Nav Links */}
        <nav style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
           <NavLink to="/home" end className={linkClass}>Home</NavLink>
          <NavLink to="/dashboard" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/dashboard/records" className={linkClass}>Data Records</NavLink>
          <NavLink to="/dashboard/taxonomy" className={linkClass}>Taxonomy</NavLink>
          <NavLink to="/dashboard/oceanic-parameters" className={linkClass}>Oceanic Parameters</NavLink>
          <NavLink to="/dashboard/obis-records" className={linkClass}>OBIS Records</NavLink>
          <NavLink to="/dashboard/marine-data" className={linkClass}>Marine Data</NavLink>
          <NavLink to="/dashboard/aquainsight" className={linkClass}>AquaInsight</NavLink>
        </nav>

        {/* User Info + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ color: '#9fb3cd', fontSize: 13, whiteSpace: 'nowrap' }}>{user?.email}</span>
          <button className="btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Spacer to push page content below navbar */}
     
    </>
  )
}


