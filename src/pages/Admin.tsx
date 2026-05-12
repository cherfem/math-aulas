import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAppointments, getAllUsers, updateAppointmentStatus, deleteAppointment, getSiteConfig, updateSiteConfig } from '../utils/storage';
import { Appointment, User } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Tab = 'appointments' | 'users' | 'slots';

const ALL_SLOTS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

export default function Admin() {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  const [tab, setTab] = useState<Tab>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [activeSlots, setActiveSlots] = useState<string[]>([]);
  const [slotsSaving, setSlotsSaving] = useState(false);
  const [slotsSaved, setSlotsSaved] = useState(false);

  const loadData = async () => {
    setPageLoading(true);
    const [appts, usrs, cfg] = await Promise.all([getAppointments(), getAllUsers(), getSiteConfig()]);
    setAppointments(appts);
    setUsers(usrs);
    const saved = cfg['available_slots'] || '08:00,09:00,10:00,11:00,13:00,14:00,15:00,16:00,17:00,18:00,19:00';
    setActiveSlots(saved.split(',').filter(Boolean));
    setPageLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const toggleSlot = (slot: string) => {
    setActiveSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot].sort());
  };

  const saveSlots = async () => {
    setSlotsSaving(true);
    await updateSiteConfig('available_slots', activeSlots.join(','));
    setSlotsSaving(false);
    setSlotsSaved(true);
    setTimeout(() => setSlotsSaved(false), 2500);
  };

  const handleStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    await updateAppointmentStatus(id, status);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Remover este agendamento?')) { await deleteAppointment(id); loadData(); }
  };

  const filtered = appointments.filter(a => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchSearch = !search || a.studentName.toLowerCase().includes(search.toLowerCase()) || a.userName.toLowerCase().includes(search.toLowerCase()) || a.userEmail.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = { total: appointments.length, pending: appointments.filter(a => a.status === 'pending').length, confirmed: appointments.filter(a => a.status === 'confirmed').length, cancelled: appointments.filter(a => a.status === 'cancelled').length };
  const statusBadge: Record<string, { className: string; label: string }> = { pending: { className: 'badge-warning', label: '⏳ Pendente' }, confirmed: { className: 'badge-success', label: '✓ Confirmada' }, cancelled: { className: 'badge-danger', label: '✗ Cancelada' } };
  const roleLabel: Record<string, string> = { student: '🎓 Aluno', parent: '👨‍👩‍👦 Responsável' };

  if (pageLoading) return (
    <div style={{ minHeight: '100vh', paddingTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  return (
    <div className="page-container grid-bg" style={{ paddingTop: '64px', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
        <div className="animate-fade" style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚡</span> Painel <span style={{ color: 'var(--warning)' }}>Administrativo</span>
          </h1>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[{ label: 'Total', value: stats.total, color: 'var(--cyan)', icon: '📊' }, { label: 'Pendentes', value: stats.pending, color: 'var(--warning)', icon: '⏳' }, { label: 'Confirmadas', value: stats.confirmed, color: 'var(--success)', icon: '✓' }, { label: 'Canceladas', value: stats.cancelled, color: 'var(--danger)', icon: '✗' }].map(s => (
            <div key={s.label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
          {[{ key: 'appointments' as Tab, label: '📅 Agendamentos' }, { key: 'users' as Tab, label: '👥 Usuários' }, { key: 'slots' as Tab, label: '🕐 Horários' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '0.5rem 1.1rem', borderRadius: 'var(--radius-md)', background: tab === t.key ? 'var(--cyan-dim)' : 'transparent', border: tab === t.key ? '1px solid var(--border-strong)' : '1px solid transparent', color: tab === t.key ? 'var(--cyan-light)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.88rem', fontWeight: tab === t.key ? 500 : 400, transition: 'var(--transition)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── AGENDAMENTOS ── */}
        {tab === 'appointments' && (
          <div className="animate-fade">
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input className="input-field" placeholder="🔍 Buscar por aluno ou email..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280, fontSize: '0.88rem' }} />
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {['all','pending','confirmed','cancelled'].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '0.35rem 0.8rem', borderRadius: 'var(--radius-md)', background: filterStatus === s ? 'var(--cyan-dim)' : 'var(--bg-card)', border: `1px solid ${filterStatus === s ? 'var(--border-strong)' : 'var(--border)'}`, color: filterStatus === s ? 'var(--cyan-light)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', transition: 'var(--transition)' }}>
                    {{ all: 'Todos', pending: 'Pendentes', confirmed: 'Confirmados', cancelled: 'Cancelados' }[s]}
                  </button>
                ))}
              </div>
              <button onClick={loadData} style={{ marginLeft: 'auto', padding: '0.35rem 0.8rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>🔄 Atualizar</button>
            </div>
            {filtered.length === 0
              ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Nenhum agendamento encontrado.</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {filtered.map(appt => (
                    <div key={appt.id} className="card" style={{ padding: '1rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'start' }}>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>👤 {appt.studentName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{appt.userRole === 'parent' ? `Resp: ${appt.userName}` : appt.userName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{appt.userEmail}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.88rem', marginBottom: '0.2rem' }}>📅 {format(parseISO(appt.date), "dd/MM/yyyy", { locale: ptBR })} às {appt.time}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📍 {appt.address}</div>
                        </div>
                        <div>
                          {appt.notes && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontStyle: 'italic' }}>💬 {appt.notes}</div>}
                          <span className={`badge ${statusBadge[appt.status].className}`}>{statusBadge[appt.status].label}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end' }}>
                          {appt.status === 'pending' && <>
                            <button onClick={() => handleStatus(appt.id, 'confirmed')} style={{ padding: '0.35rem 0.7rem', borderRadius: 'var(--radius-sm)', background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.3)', color: 'var(--success)', fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>✓ Confirmar</button>
                            <button onClick={() => handleStatus(appt.id, 'cancelled')} style={{ padding: '0.35rem 0.7rem', borderRadius: 'var(--radius-sm)', background: 'var(--danger-dim)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)', fontSize: '0.78rem', cursor: 'pointer' }}>✗ Recusar</button>
                          </>}
                          {appt.status === 'confirmed' && <button onClick={() => handleStatus(appt.id, 'cancelled')} style={{ padding: '0.35rem 0.7rem', borderRadius: 'var(--radius-sm)', background: 'var(--danger-dim)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)', fontSize: '0.78rem', cursor: 'pointer' }}>✗ Cancelar</button>}
                          <button onClick={() => handleDelete(appt.id)} style={{ padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: '0.72rem', cursor: 'pointer' }}>🗑 Remover</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* ── USUÁRIOS ── */}
        {tab === 'users' && (
          <div className="animate-fade">
            <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{users.length} usuário(s) cadastrado(s)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {users.map(u => {
                const userAppts = appointments.filter(a => a.userId === u.id);
                return (
                  <div key={u.id} className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cyan), #0077b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                          {u.phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📱 {u.phone}</div>}
                        </div>
                      </div>
                      <div>
                        <span className="badge badge-cyan" style={{ marginBottom: '0.35rem', display: 'inline-block' }}>{roleLabel[u.role] || u.role}</span>
                        {u.role === 'parent' && u.childName && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>👧 {u.childName} {u.childAge ? `— ${u.childAge}` : ''}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cyan)' }}>{userAppts.length}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>aulas</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Desde {format(parseISO(u.createdAt), 'dd/MM/yy')}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {users.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Nenhum usuário cadastrado ainda.</div>}
            </div>
          </div>
        )}

        {/* ── HORÁRIOS ── */}
        {tab === 'slots' && (
          <div className="animate-fade">
            <div className="card" style={{ padding: '1.75rem', maxWidth: 560 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>🕐 Horários disponíveis para agendamento</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                Selecione os horários que você tem disponíveis. Apenas os horários marcados aparecerão para os alunos ao agendar.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' }}>
                {ALL_SLOTS.map(slot => {
                  const active = activeSlots.includes(slot);
                  return (
                    <button key={slot} onClick={() => toggleSlot(slot)} style={{
                      padding: '0.65rem 0.5rem', borderRadius: 'var(--radius-md)',
                      border: `2px solid ${active ? 'var(--cyan)' : 'var(--border)'}`,
                      background: active ? 'var(--cyan-dim)' : 'var(--bg-input)',
                      color: active ? 'var(--cyan-light)' : 'var(--text-muted)',
                      cursor: 'pointer', fontSize: '0.88rem', fontWeight: active ? 600 : 400,
                      transition: 'var(--transition)', textAlign: 'center',
                    }}>
                      {active ? '✓ ' : ''}{slot}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={saveSlots} disabled={slotsSaving} className="btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
                  {slotsSaving ? <><span className="spinner" style={{ marginRight: 8 }} />Salvando...</> : 'Salvar horários'}
                </button>
                {slotsSaved && <span style={{ color: 'var(--success)', fontSize: '0.88rem', fontWeight: 600 }}>✓ Horários salvos!</span>}
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {activeSlots.length} horário(s) selecionado(s): {activeSlots.join(', ') || 'nenhum'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
