import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUnreadCount } from '../utils/storage';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const check = async () => { setUnread(await getUnreadCount(user.id)); };
    check();
    const iv = setInterval(check, 8000);
    return () => clearInterval(iv);
  }, [user]);

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(6,13,26,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--cyan), #0077b6)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff' }}>∑</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Math<span style={{ color: 'var(--cyan)' }}>Aulas</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="desktop-nav">
          <NavLink to="/" active={isActive('/')}>Início</NavLink>
          {user && <NavLink to="/agendar" active={isActive('/agendar')}>Agendar</NavLink>}
          {user && (
            <NavLink to="/mensagens" active={isActive('/mensagens')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                Mensagens
                {unread > 0 && (
                  <span style={{ background: 'var(--cyan)', color: '#fff', borderRadius: '100px', fontSize: '0.65rem', padding: '1px 6px', fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{unread}</span>
                )}
              </span>
            </NavLink>
          )}
          {user?.role === 'admin' && <NavLink to="/admin" active={isActive('/admin')}><span style={{ color: 'var(--warning)' }}>⚡ Admin</span></NavLink>}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
              <Link to="/minha-conta" style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.4rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--cyan-glow)', transition: 'var(--transition)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cyan), #0077b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.name.split(' ')[0]}</span>
                </div>
              </Link>
              <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', cursor: 'pointer', transition: 'var(--transition)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                Sair
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
              <Link to="/login"><button className="btn-ghost" style={{ padding: '0.45rem 1rem', fontSize: '0.9rem' }}>Entrar</button></Link>
              <Link to="/cadastro"><button className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.9rem' }}>Cadastrar</button></Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn" style={{ display: 'none', background: 'none', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '1.1rem', cursor: 'pointer' }}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} className="mobile-menu">
          <MobileLink to="/" label="Início" onClick={() => setMenuOpen(false)} />
          {user && <MobileLink to="/agendar" label="Agendar Aula" onClick={() => setMenuOpen(false)} />}
          {user && <MobileLink to="/mensagens" label={`Mensagens${unread > 0 ? ` (${unread})` : ''}`} onClick={() => setMenuOpen(false)} />}
          {user?.role === 'admin' && <MobileLink to="/admin" label="⚡ Admin" onClick={() => setMenuOpen(false)} />}
          {user && <MobileLink to="/minha-conta" label="Minha Conta" onClick={() => setMenuOpen(false)} />}
          {user
            ? <button onClick={handleLogout} style={{ background: 'var(--danger-dim)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.95rem', marginTop: '0.25rem' }}>Sair</button>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                <Link to="/login" onClick={() => setMenuOpen(false)}><button className="btn-ghost" style={{ width: '100%', padding: '0.75rem' }}>Entrar</button></Link>
                <Link to="/cadastro" onClick={() => setMenuOpen(false)}><button className="btn-primary" style={{ width: '100%', padding: '0.75rem' }}>Cadastrar</button></Link>
              </div>
          }
        </div>
      )}
    </>
  );
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <span style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', color: active ? 'var(--cyan-light)' : 'var(--text-secondary)', background: active ? 'var(--cyan-dim)' : 'transparent', display: 'block', transition: 'var(--transition)', fontWeight: active ? 500 : 400 }}>
        {children}
      </span>
    </Link>
  );
}

function MobileLink({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} style={{ textDecoration: 'none' }}>
      <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{label}</div>
    </Link>
  );
}
