import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', paddingTop: '64px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }} className="grid-bg">
      <div style={{ width: '100%', maxWidth: 440 }} className="animate-fade">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, var(--cyan), #0077b6)',
            borderRadius: 'var(--radius-md)', margin: '0 auto 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: '#fff', fontWeight: 700,
          }}>∑</div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>Bem-vindo de volta</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Entre na sua conta para acessar o site
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">E-mail</label>
              <input
                className="input-field"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input-field"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '1.1rem', padding: 0,
                  }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-dim)', border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
                color: 'var(--danger)', fontSize: '0.88rem', marginBottom: '1.25rem',
              }}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '1rem', padding: '0.85rem' }} disabled={loading}>
              {loading ? <><span className="spinner" style={{ marginRight: 8 }} />Entrando...</> : 'Entrar →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Não tem conta?{' '}
          <Link to="/cadastro" style={{ color: 'var(--cyan)', fontWeight: 500 }}>Cadastre-se grátis</Link>
        </p>
      </div>
    </div>
  );
}
