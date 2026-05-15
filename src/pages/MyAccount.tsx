import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAppointmentsByUser, cancelAppointmentByStudent } from '../utils/storage';
import { Appointment } from '../types';
import { format, parseISO, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MyAccount() {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" />;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelError, setCancelError] = useState<Record<string, string>>({});
  const [cancelSuccess, setCancelSuccess] = useState<Record<string, boolean>>({});

  const loadAppointments = async () => {
    const data = await getAppointmentsByUser(user.id);
    setAppointments(data);
    setLoading(false);
  };

  useEffect(() => { loadAppointments(); }, [user.id]);

  const handleCancel = async (appt: Appointment) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta aula?')) return;
    try {
      await cancelAppointmentByStudent(appt.id, user.id);
      setCancelSuccess(prev => ({ ...prev, [appt.id]: true }));
      setCancelError(prev => ({ ...prev, [appt.id]: '' }));
      loadAppointments();
    } catch (e: any) {
      setCancelError(prev => ({ ...prev, [appt.id]: e.message }));
    }
  };

  const canCancel = (appt: Appointment) => {
    if (appt.status !== 'pending' && appt.status !== 'confirmed') return false;
    const apptDateTime = new Date(`${appt.date}T${appt.time}:00`);
    const hoursLeft = differenceInHours(apptDateTime, new Date());
    return hoursLeft >= 48;
  };

  const roleLabel: Record<string, string> = { student: 'Aluno', parent: 'Responsável', admin: 'Administrador' };
  const statusBadge: Record<string, { cls: string; label: string }> = {
    pending: { cls: 'badge-warning', label: '⏳ Aguardando' },
    confirmed: { cls: 'badge-success', label: '✓ Confirmada' },
    cancelled: { cls: 'badge-danger', label: '✗ Cancelada' },
  };

  const upcoming = appointments.filter(a => a.status !== 'cancelled' && new Date(`${a.date}T${a.time}`) >= new Date());
  const past = appointments.filter(a => a.status === 'cancelled' || new Date(`${a.date}T${a.time}`) < new Date());

  return (
    <div className="page-container grid-bg" style={{ paddingTop: '64px', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
        <div className="animate-fade" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem' }}>Minha <span style={{ color: 'var(--cyan)' }}>Conta</span></h1>
        </div>

        {/* Profile */}
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
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Total de aulas</div>
              <div style={{ color: 'var(--cyan)', fontWeight: 600 }}>{appointments.length}</div>
            </div>
          </div>
        </div>

        {/* Upcoming appointments */}
        <div className="card animate-fade-delay" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>📅 Próximas aulas</h3>
            <Link to="/agendar"><button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>+ Nova aula</button></Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" /></div>
          ) : upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
              Nenhuma aula agendada. <Link to="/agendar" style={{ color: 'var(--cyan)' }}>Agendar agora →</Link>
            </div>
          ) : upcoming.map(appt => (
            <div key={appt.id} style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '0.75rem' }}>
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

              {/* Cancel button */}
              {canCancel(appt) && (
                <div style={{ marginTop: '0.75rem' }}>
                  <button onClick={() => handleCancel(appt)} style={{
                    background: 'var(--danger-dim)', border: '1px solid rgba(248,113,113,0.3)',
                    color: 'var(--danger)', padding: '0.35rem 0.85rem',
                    borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', cursor: 'pointer',
                  }}>
                    ✗ Cancelar aula
                  </button>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    (cancelamento gratuito até 48h antes)
                  </span>
                </div>
              )}
              {!canCancel(appt) && appt.status !== 'cancelled' && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  ⚠ Cancelamento não disponível — menos de 48h para a aula
                </div>
              )}
              {cancelError[appt.id] && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.4rem' }}>⚠ {cancelError[appt.id]}</div>}
            </div>
          ))}
        </div>

        {/* Past appointments */}
        {past.length > 0 && (
          <div className="card animate-fade-delay" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>📋 Histórico</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {past.slice(0, 10).map(appt => (
                <div key={appt.id} style={{ padding: '0.75rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{format(parseISO(appt.date), "dd/MM/yyyy")} às {appt.time}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{appt.address}</div>
                  </div>
                  <span className={`badge ${statusBadge[appt.status].cls}`} style={{ fontSize: '0.72rem' }}>{statusBadge[appt.status].label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={logout} style={{ background: 'var(--danger-dim)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--danger)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.9rem', transition: 'var(--transition)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--danger-dim)'}>
          🚪 Sair da conta
        </button>
      </div>
    </div>
  );
}
