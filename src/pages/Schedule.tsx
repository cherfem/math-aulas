import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createAppointment, getAvailableSlotsWithBlocked, getAppointmentsByUser } from '../utils/storage';
import { sendBookingEmail } from '../utils/emailService';
import { Appointment } from '../types';
import { format, addDays, startOfDay, isBefore, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatDatePtBR(date: Date) {
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
}

export default function Schedule() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  const today = startOfDay(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => {
    getAppointmentsByUser(user.id).then(setMyAppointments);
  }, [user, success]);

  useEffect(() => {
    if (selectedDate) {
      setLoadingSlots(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      getAvailableSlotsWithBlocked(dateStr).then(slots => {
        setAvailableSlots(slots);
        setSelectedTime('');
        setLoadingSlots(false);
      });
    }
  }, [selectedDate]);

  const calendarDays = Array.from({ length: 35 }, (_, i) => addDays(today, i));

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedDate || !selectedTime) { setError('Selecione data e horário.'); return; }
    if (!address.trim()) { setError('Informe o endereço para a aula.'); return; }
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await createAppointment(user, dateStr, selectedTime, address, notes);
      // Send booking confirmation email
      try {
        const formattedDate = format(selectedDate, "dd/MM/yyyy", { locale: ptBR });
        const studentName = user.role === 'parent' ? (user.childName || user.name) : user.name;
        await sendBookingEmail(user.email, studentName, formattedDate, selectedTime, address);
      } catch {}
      setSuccess(true);
      setSelectedDate(null);
      setSelectedTime('');
      setAddress('');
      setNotes('');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel: Record<string, { label: string; className: string }> = {
    pending: { label: '⏳ Aguardando confirmação', className: 'badge-warning' },
    confirmed: { label: '✓ Confirmada', className: 'badge-success' },
    cancelled: { label: '✗ Cancelada', className: 'badge-danger' },
  };

  return (
    <div className="page-container grid-bg" style={{ paddingTop: '64px', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>
        <div className="animate-fade" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>
            Agendar <span style={{ color: 'var(--cyan)' }}>Aula</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {user.role === 'parent'
              ? `Agendando para: ${user.childName || user.name}`
              : `Olá, ${user.name.split(' ')[0]}! Escolha data e horário.`}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Calendar */}
          <div className="animate-fade">
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--text-secondary)', fontWeight: 500 }}>📅 Selecione uma data</h3>
              <div style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--cyan-light)', fontWeight: 500 }}>
                {format(today, "MMMM 'de' yyyy", { locale: ptBR }).toUpperCase()}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '4px' }}>
                {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', padding: '4px 0', fontWeight: 500 }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px' }}>
                {Array.from({ length: today.getDay() }, (_, i) => <div key={`o-${i}`} />)}
                {calendarDays.map((day, i) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;
                  const isPast = isBefore(day, today);
                  const isSunday = day.getDay() === 0;
                  const disabled = isPast || isSunday;
                  const isT = isToday(day);
                  return (
                    <button key={i} onClick={() => !disabled && setSelectedDate(day)} disabled={disabled}
                      style={{
                        padding: '0.4rem', borderRadius: 'var(--radius-sm)',
                        border: isT && !isSelected ? '1px solid var(--border-strong)' : '1px solid transparent',
                        background: isSelected ? 'var(--cyan)' : 'transparent',
                        color: disabled ? 'var(--text-dim)' : isSelected ? '#fff' : isT ? 'var(--cyan-light)' : 'var(--text-secondary)',
                        cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
                        fontWeight: isSelected ? 600 : 400, transition: 'var(--transition)', textAlign: 'center',
                      }}
                      onMouseEnter={e => { if (!disabled && !isSelected) e.currentTarget.style.background = 'var(--cyan-dim)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
              {selectedDate && (
                <div style={{ marginTop: '1rem', padding: '0.6rem', background: 'var(--cyan-dim)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--cyan-light)', textAlign: 'center' }}>
                  📅 {formatDatePtBR(selectedDate)}
                </div>
              )}
            </div>

            {selectedDate && (
              <div className="card animate-fade" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--text-secondary)', fontWeight: 500 }}>🕐 Horários disponíveis</h3>
                {loadingSlots ? (
                  <div style={{ textAlign: 'center', padding: '1rem' }}><div className="spinner" /></div>
                ) : availableSlots.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                    Nenhum horário disponível nesta data.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
                    {availableSlots.map(slot => (
                      <button key={slot} onClick={() => setSelectedTime(slot)} style={{
                        padding: '0.6rem',
                        border: `1px solid ${selectedTime === slot ? 'var(--cyan)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        background: selectedTime === slot ? 'var(--cyan)' : 'var(--bg-input)',
                        color: selectedTime === slot ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.88rem', cursor: 'pointer', transition: 'var(--transition)',
                        fontWeight: selectedTime === slot ? 600 : 400,
                      }}>{slot}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="animate-fade-delay">
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--text-secondary)', fontWeight: 500 }}>📝 Detalhes do agendamento</h3>
              <form onSubmit={handleBook}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="label">Endereço para a aula *</label>
                  <input className="input-field" type="text" placeholder="Rua, número, bairro — ou 'Online'" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="label">Observações (opcional)</label>
                  <textarea className="input-field" placeholder="Ex: Foco em trigonometria..." value={notes} onChange={e => setNotes(e.target.value)} style={{ minHeight: 80, resize: 'vertical' }} />
                </div>

                {selectedDate && selectedTime && (
                  <div style={{ background: 'var(--cyan-dim)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--cyan-light)', marginBottom: '0.4rem' }}>Resumo:</div>
                    <div style={{ color: 'var(--text-secondary)' }}>📅 {formatDatePtBR(selectedDate)} às {selectedTime}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>👤 {user.role === 'parent' ? user.childName : user.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.3rem' }}>📧 Você receberá um e-mail de confirmação</div>
                  </div>
                )}

                {error && <div style={{ background: 'var(--danger-dim)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', color: 'var(--danger)', fontSize: '0.88rem', marginBottom: '1rem' }}>⚠ {error}</div>}
                {success && <div style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', color: 'var(--success)', fontSize: '0.88rem', marginBottom: '1rem' }}>✓ Agendamento realizado! Verifique seu e-mail.</div>}

                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }} disabled={loading || !selectedDate || !selectedTime}>
                  {loading ? <><span className="spinner" style={{ marginRight: 8 }} />Agendando...</> : 'Confirmar agendamento →'}
                </button>
              </form>
            </div>

            {myAppointments.length > 0 && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--text-secondary)', fontWeight: 500 }}>📋 Meus agendamentos</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {myAppointments.slice(0, 5).map(appt => (
                    <div key={appt.id} style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{format(parseISO(appt.date), "dd/MM/yyyy")} — {appt.time}</span>
                        <span className={`badge ${statusLabel[appt.status].className}`} style={{ fontSize: '0.72rem' }}>{statusLabel[appt.status].label}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{appt.address}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
