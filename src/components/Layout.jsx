import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Users, Settings, LogOut, BarChart3 } from 'lucide-react';

const Layout = () => {
    const { logout } = useApp();

    return (
        <div style={{ paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-app)' }}>
            {/* Top Header - Glass Effect */}
            <nav className="glass-panel" style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
                zIndex: 20,
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div className="container flex-between" style={{ height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--primary) 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            RKM Ledger
                        </h1>
                        <div className="text-xs text-muted" style={{ fontWeight: 600, background: 'var(--primary-light)', padding: '4px 8px', borderRadius: '8px', color: 'var(--primary)' }}>
                            BETA
                        </div>
                    </div>
                    <button onClick={logout} className="btn-icon" style={{ padding: '0.5rem' }}>
                        <LogOut size={20} color="var(--text-light)" />
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container animate-fade-in" style={{ marginTop: '80px' }}>
                <Outlet />
            </main>

            {/* Bottom Navigation - Floating Glass Bar */}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                left: 0, right: 0,
                zIndex: 20,
                display: 'flex',
                justifyContent: 'center',
                padding: '0 1rem'
            }}>
                <nav className="glass-panel" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-card)', // Fallback / Base
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    borderRadius: '24px',
                    padding: '0.5rem 1.5rem',
                    width: '100%',
                    maxWidth: '400px'
                }}>
                    <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <LayoutDashboard size={24} strokeWidth={2.5} />
                        {/* <span className="nav-label">Home</span> */}
                    </NavLink>
                    <NavLink to="/customers" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <div className="nav-icon-wrapper">
                            <Users size={24} strokeWidth={2.5} />
                        </div>
                        {/* <span className="nav-label">Customers</span> */}
                    </NavLink>
                    <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <BarChart3 size={24} strokeWidth={2.5} />
                    </NavLink>
                    <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <Settings size={24} strokeWidth={2.5} />
                        {/* <span className="nav-label">Settings</span> */}
                    </NavLink>
                </nav>
            </div>

            <style>{`
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-light);
          padding: 12px;
          border-radius: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        
        .nav-item.active {
          color: var(--primary);
          transform: translateY(-4px);
        }
        
        .nav-item.active::after {
          content: '';
          position: absolute;
          bottom: 0px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--primary);
        }

        /* Hover effect for desktop */
        @media (hover: hover) {
          .nav-item:hover {
            color: var(--primary);
            background: var(--primary-light);
          }
        }
      `}</style>
        </div>
    );
};

export default Layout;
