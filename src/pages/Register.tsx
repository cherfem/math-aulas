import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type RoleType = 'student' | 'parent' | '';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<RoleType>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const goNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!role) { setError('Selecione seu tipo de conta.'); return; }
    if (password.length < 6) { setError('Senha deve ter ao menos 6 caracteres.'); return; }
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }
    if (role === 'parent') { setStep(2); return; }
    handleSubmit();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    if (role === 'parent' && !childName.trim()) {
      setError('Informe o nome do(a) filho(a).');
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, phone, role: role as 'student' | 'parent', childName, childAge });
      navigate('/');
    } catch (err: any) {
      setError(err.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const RoleCard = ({ value, label, icon, desc }: { value: 'student' | 'parent'; label: string; icon: string; desc: string }) => (
    <div
      onClick={() => setRole(value)}
      style={{
        padding: '1.25rem',
        border: `2px solid ${role === value ? 'var(--cyan)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        background: role === value ? 'var(--cyan-dim)' : 'var(--bg-input)',
        transition: 'var(--transition)',
        flex: 1,
      }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: '0.3rem', fontSize: '1rem' }}>{label}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{desc}</div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', paddingTop: '64px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }} className="grid-bg">
      <div style={{ width: '100%', maxWidth: 480 }} className="animate-fade">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, var(--cyan), #0077b6)',
            borderRadius: 'var(--radius-md)', margin: '0 auto 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: '#fff', fontWeight: 700,
          }}>∑</div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>
            {step === 1 ? 'Criar conta' : 'Dados do(a) filho(a)'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {step === 1 ? 'Passo 1 de 2 — Informações pessoais' : 'Passo 2 de 2 — Identificação do aluno'}
          </p>
          {/* Progress */}
          <div style={{ display: 'flex', gap: '4px', margin: '1rem auto', width: 80 }}>
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--cyan)' }} />
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: step === 2 ? 'var(--cyan)' : 'var(--border)' }} />
          </div>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {step === 1 ? (
            <form onSubmit={goNext}>
              {/* Role selector */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Tipo de conta</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <RoleCard value="student" label="Aluno" icon="🎓" desc="Sou o próprio aluno" />
                  <RoleCard value="parent" label="Responsável" icon="👨‍👩‍👦" desc="Sou pai/mãe/responsável" />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Nome completo</label>
                <input className="input-field" type="text" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">E-mail</label>
                <input className="input-field" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Telefone / WhatsApp</label>
                <input className="input-field" type="tel" placeholder="(11) 99999-9999" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="label">Senha</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input-field" type={showPass ? 'text' : 'password'} placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: '2.5rem' }} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)' }}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirmar senha</label>
                  <input className="input-field" type="password" placeholder="••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                </div>
              </div>

              {error && (
                <div style={{ background: 'var(--danger-dim)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', color: 'var(--danger)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                  ⚠ {error}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '1rem', padding: '0.85rem' }}>
                {role === 'parent' ? 'Próximo →' : loading ? 'Criando...' : 'Criar conta →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ background: 'var(--cyan-dim)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.88rem', color: 'var(--cyan-light)' }}>
                👨‍👩‍👦 Como responsável, identifique seu(sua) filho(a) para facilitar o agendamento.
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Nome completo do(a) filho(a) *</label>
                <input className="input-field" type="text" placeholder="Nome do aluno" value={childName} onChange={e => setChildName(e.target.value)} required />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Idade / Série escolar</label>
                <input className="input-field" type="text" placeholder="Ex: 15 anos, 1º ano do Ensino Médio" value={childAge} onChange={e => setChildAge(e.target.value)} />
              </div>

              {error && (
                <div style={{ background: 'var(--danger-dim)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', color: 'var(--danger)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                  ⚠ {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn-ghost" onClick={() => setStep(1)} style={{ flex: 1, padding: '0.85rem' }}>
                  ← Voltar
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.85rem' }} disabled={loading}>
                  {loading ? <><span className="spinner" style={{ marginRight: 8 }} />Criando...</> : 'Criar conta →'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Já tem conta? <Link to="/login" style={{ color: 'var(--cyan)', fontWeight: 500 }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}
