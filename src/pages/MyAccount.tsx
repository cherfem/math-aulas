import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAppointmentsByUser } from '../utils/storage';
import { Appointment } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MyAccount() {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" />;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAppointmentsByUser(user.id).then(data => {
      setAppointments(data);
      setLoading(false);
    });
  }, [user.id]);

  const roleLabel: Record<string, string> = { student: 'Aluno', parent: 'Responsável', admin: 'Administrador' };
  const statusBadge: Record<string, { cls: string; label: string }> = {
    pending: { cls: 'badge-warning', label: '⏳ Aguardando' },
    confirmed: { cls: 'badge-success', label: '✓ Confirmada' },
    cancelled: { cls: 'badge-danger', label: '✗ Cancelada' },
  };

  return (
    <div className="page-container grid-bg" style={{ paddingTop: '64px', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
        <div className="animate-fade" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem' }}>Minha <span style={{ color: 'var(--cyan)' }}>Conta</span></h1>
        </div>

        <div className="card animate-fade" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cyan), #0077b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>{user.name}</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="badge badge-cyan">{roleLabel[user.role]}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</span>
              </div>
            </div>
          </div>

          <hr className="divider" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
            {user.phone && (
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Telefone</div>
                <div>{user.phone}</div>
              </div>
            )}
            {user.role === 'parent' && user.childName && (
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Filho(a)</div>
                <div>{user.childName} {user.childAge ? `— ${user.childAge}` : ''}</div>
              </div>
            )}
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Membro desde</div>
              <div>{format(parseISO(user.createdAt), "MMMM 'de' yyyy", { locale: ptBR })}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Total de aulas</div>
              <div style={{ color: 'var(--cyan)', fontWeight: 600 }}>{appointments.length}</div>
            </div>
          </div>
        </div>

        <div className="card animate-fade-delay" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>📋 Histórico de Aulas</h3>
            <Link to="/agendar"><button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>+ Nova aula</button></Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" /></div>
          ) : appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
              Você ainda não tem aulas agendadas.{' '}
              <Link to="/agendar" style={{ color: 'var(--cyan)' }}>Agendar agora →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {appointments.map(appt => (
                <div key={appt.id} style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: '0.2rem' }}>
                        {format(parseISO(appt.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {appt.time}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📍 {appt.address}</div>
                      {appt.notes && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontStyle: 'italic' }}>"{appt.notes}"</div>}
                    </div>
                    <span className={`badge ${statusBadge[appt.status].cls}`}>{statusBadge[appt.status].label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={logout} style={{ background: 'var(--danger-dim)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--danger)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.9rem', transition: 'var(--transition)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--danger-dim)'}>
          🚪 Sair da conta
        </button>
      </div>
    </div>
  );
}
