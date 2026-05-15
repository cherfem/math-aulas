import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAppointments, getAllUsers, getSiteConfig, updateSiteConfig, togglePayment, getBlockedDates, addBlockedDate, removeBlockedDate } from '../utils/storage';
import { Appointment, User } from '../types';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState('');
  const [editingPrice, setEditingPrice] = useState(false);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');
  const [blockMsg, setBlockMsg] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const loadData = async () => {
    const [appts, usrs, cfg, blocked] = await Promise.all([
      getAppointments(), getAllUsers(), getSiteConfig(), getBlockedDates()
    ]);
    setAppointments(appts);
    setUsers(usrs);
    setConfig(cfg);
    setPrice(cfg.lesson_price || '80');
    setBlockedDates(blocked);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // ── Financial helpers ──
  const lessonPrice = parseFloat(config.lesson_price || '80');
  const currency = config.lesson_currency || 'R$';

  const getMonthAppointments = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return appointments.filter(a => {
      const apptDate = parseISO(a.date);
      return isWithinInterval(apptDate, { start, end }) && a.status === 'confirmed';
    });
  };

  const currentMonthAppts = getMonthAppointments(selectedMonth);
  const totalEarned = currentMonthAppts.filter(a => (a as any).paid).length * lessonPrice;
  const totalPending = currentMonthAppts.filter(a => !(a as any).paid).length * lessonPrice;

  // ── Chart data — last 6 months ──
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), 5 - i);
    const appts = getMonthAppointments(month);
    return {
      label: format(month, 'MMM', { locale: ptBR }),
      total: appts.length,
      paid: appts.filter(a => (a as any).paid).length,
      revenue: appts.filter(a => (a as any).paid).length * lessonPrice,
    };
  });
  const maxTotal = Math.max(...chartData.map(d => d.total), 1);

  // ── Top students ──
  const studentCount: Record<string, { name: string; count: number }> = {};
  appointments.filter(a => a.status === 'confirmed').forEach(a => {
    if (!studentCount[a.studentName]) studentCount[a.studentName] = { name: a.studentName, count: 0 };
    studentCount[a.studentName].count++;
  });
  const topStudents = Object.values(studentCount).sort((a, b) => b.count - a.count).slice(0, 5);

  const savePrice = async () => {
    await updateSiteConfig('lesson_price', price);
    setConfig(prev => ({ ...prev, lesson_price: price }));
    setEditingPrice(false);
  };

  const handleAddBlock = async () => {
    if (!newBlockDate) return;
    try {
      await addBlockedDate(newBlockDate, newBlockReason);
      setNewBlockDate('');
      setNewBlockReason('');
      setBlockMsg('Data bloqueada com sucesso!');
      setTimeout(() => setBlockMsg(''), 2500);
      loadData();
    } catch (e: any) { setBlockMsg(e.message); }
  };

  const handleRemoveBlock = async (id: string) => {
    await removeBlockedDate(id);
    loadData();
  };

  const handleTogglePayment = async (id: string, paid: boolean) => {
    await togglePayment(id, paid);
    loadData();
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', paddingTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  return (
    <div className="page-container grid-bg" style={{ paddingTop: '64px', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 <span style={{ color: 'var(--cyan)' }}>Dashboard</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Visão geral do seu negócio</p>
        </div>

        {/* ── TOP STATS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { icon: '👥', label: 'Alunos', value: users.length, color: 'var(--cyan)' },
            { icon: '📅', label: 'Aulas confirmadas', value: appointments.filter(a => a.status === 'confirmed').length, color: 'var(--success)' },
            { icon: '⏳', label: 'Aguardando', value: appointments.filter(a => a.status === 'pending').length, color: 'var(--warning)' },
            { icon: '💰', label: 'Valor por aula', value: `${currency} ${lessonPrice}`, color: 'var(--cyan-light)', isText: true },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{s.icon}</div>
              <div style={{ fontSize: s.isText ? '1.4rem' : '2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          {/* ── GRÁFICO ── */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', fontFamily: 'var(--font-display)' }}>📈 Aulas por mês</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 140 }}>
              {chartData.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--cyan)', fontWeight: 600 }}>{d.total > 0 ? d.total : ''}</div>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'flex-end' }}>
                    <div style={{
                      width: '100%',
                      height: `${Math.max((d.total / maxTotal) * 110, d.total > 0 ? 8 : 0)}px`,
                      background: i === chartData.length - 1 ? 'var(--cyan)' : 'rgba(0,180,216,0.35)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.5s ease',
                      position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: `${Math.max((d.paid / maxTotal) * 110, d.paid > 0 ? 4 : 0)}px`,
                        background: 'var(--success)', borderRadius: '4px 4px 0 0',
                      }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{d.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(0,180,216,0.35)', display: 'inline-block' }} />Total</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--success)', display: 'inline-block' }} />Pagas</span>
            </div>
          </div>

          {/* ── TOP ALUNOS ── */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', fontFamily: 'var(--font-display)' }}>🏆 Alunos mais frequentes</h3>
            {topStudents.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '2rem' }}>Nenhuma aula confirmada ainda.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {topStudents.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? 'var(--warning)' : 'var(--bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: i === 0 ? '#000' : 'var(--text-muted)', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{s.name}</div>
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 4 }}>
                        <div style={{ height: '100%', background: 'var(--cyan)', borderRadius: 2, width: `${(s.count / topStudents[0].count) * 100}%`, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--cyan)', fontWeight: 600, flexShrink: 0 }}>{s.count} aula{s.count > 1 ? 's' : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          {/* ── FINANCEIRO ── */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-display)' }}>💰 Financeiro</h3>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <button onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.6rem', cursor: 'pointer', fontSize: '0.9rem' }}>‹</button>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', minWidth: 80, textAlign: 'center', textTransform: 'capitalize' }}>
                  {format(selectedMonth, "MMM yyyy", { locale: ptBR })}
                </span>
                <button onClick={() => setSelectedMonth(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.6rem', cursor: 'pointer', fontSize: '0.9rem' }}>›</button>
              </div>
            </div>

            {/* Price editor */}
            <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Valor por aula</span>
              {editingPrice ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{currency}</span>
                  <input value={price} onChange={e => setPrice(e.target.value)} type="number" style={{ width: 70, background: 'var(--bg-card)', border: '1px solid var(--cyan)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '0.2rem 0.5rem', fontSize: '0.9rem', outline: 'none' }} />
                  <button onClick={savePrice} style={{ background: 'var(--cyan)', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>✓</button>
                  <button onClick={() => setEditingPrice(false)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>✗</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--cyan)', fontSize: '1rem' }}>{currency} {price}</span>
                  <button onClick={() => setEditingPrice(true)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', padding: '0.15rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>✎</button>
                </div>
              )}
            </div>

            {/* Monthly summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--success)' }}>{currency} {totalEarned}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>✓ Recebido</div>
              </div>
              <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--warning)' }}>{currency} {totalPending}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏳ A receber</div>
              </div>
            </div>

            {/* Aulas do mês */}
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
              Aulas confirmadas — {format(selectedMonth, "MMMM", { locale: ptBR })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 200, overflow: 'auto' }}>
              {currentMonthAppts.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>Nenhuma aula confirmada este mês.</div>
              ) : currentMonthAppts.map(appt => (
                <div key={appt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{appt.studentName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{format(parseISO(appt.date), "dd/MM")} às {appt.time}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--cyan)' }}>{currency} {lessonPrice}</span>
                    <button onClick={() => handleTogglePayment(appt.id, !(appt as any).paid)} style={{
                      padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600,
                      background: (appt as any).paid ? 'rgba(45,212,191,0.12)' : 'var(--bg-card)',
                      border: `1px solid ${(appt as any).paid ? 'rgba(45,212,191,0.3)' : 'var(--border)'}`,
                      color: (appt as any).paid ? 'var(--success)' : 'var(--text-muted)',
                      transition: 'var(--transition)',
                    }}>
                      {(appt as any).paid ? '✓ Pago' : 'Marcar pago'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── BLOQUEAR DATAS ── */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', fontFamily: 'var(--font-display)' }}>🚫 Datas bloqueadas</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Datas bloqueadas não aparecem como disponíveis para agendamento.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              <div>
                <label className="label">Data para bloquear</label>
                <input type="date" className="input-field" value={newBlockDate} onChange={e => setNewBlockDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Motivo (opcional)</label>
                <input type="text" className="input-field" placeholder="Ex: Feriado, viagem, compromisso..." value={newBlockReason} onChange={e => setNewBlockReason(e.target.value)} />
              </div>
              <button onClick={handleAddBlock} className="btn-primary" style={{ padding: '0.65rem', fontSize: '0.9rem' }}>
                🚫 Bloquear data
              </button>
              {blockMsg && <div style={{ fontSize: '0.82rem', color: 'var(--success)' }}>{blockMsg}</div>}
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
              Datas bloqueadas ({blockedDates.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 200, overflow: 'auto' }}>
              {blockedDates.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>Nenhuma data bloqueada.</div>
              ) : blockedDates.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--danger-dim)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(248,113,113,0.2)' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--danger)' }}>
                      {format(parseISO(b.date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                    </div>
                    {b.reason && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.reason}</div>}
                  </div>
                  <button onClick={() => handleRemoveBlock(b.id)} style={{ background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                    🗑
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
