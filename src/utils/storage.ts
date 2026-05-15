import { supabase } from './supabase';
import { User, Appointment, RegisterData } from '../types';

export async function findUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email.trim())
    .single();
  if (error || !data) return null;
  return dbToUser(data);
}

export async function registerUser(data: RegisterData): Promise<User> {
  const exists = await findUserByEmail(data.email);
  if (exists) throw new Error('Este e-mail já está cadastrado.');
  const { data: created, error } = await supabase
    .from('users')
    .insert({
      name: data.name,
      email: data.email.toLowerCase().trim(),
      password: data.password,
      role: data.role,
      phone: data.phone || '',
      child_name: data.childName || null,
      child_age: data.childAge || null,
    })
    .select()
    .single();
  if (error || !created) throw new Error(error?.message || 'Erro ao criar conta.');
  return dbToUser(created);
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .neq('role', 'admin')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(dbToUser);
}

export async function getAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true });
  if (error || !data) return [];
  return data.map(dbToAppointment);
}

export async function getAppointmentsByUser(userId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error || !data) return [];
  return data.map(dbToAppointment);
}

export async function createAppointment(
  user: User, date: string, time: string, address: string, notes: string
): Promise<Appointment> {
  const { data: conflict } = await supabase
    .from('appointments')
    .select('id')
    .eq('date', date)
    .eq('time', time)
    .neq('status', 'cancelled')
    .maybeSingle();
  if (conflict) throw new Error('Este horário já está reservado. Escolha outro.');
  const studentName = user.role === 'parent' ? (user.childName || user.name) : user.name;
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      user_role: user.role,
      student_name: studentName,
      date, time, address,
      notes: notes || null,
      status: 'pending',
    })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message || 'Erro ao agendar.');
  return dbToAppointment(data);
}

export async function updateAppointmentStatus(id: string, status: 'confirmed' | 'cancelled') {
  const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteAppointment(id: string) {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getAvailableSlots(date: string): Promise<string[]> {
  const allSlots = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
  const { data } = await supabase
    .from('appointments')
    .select('time')
    .eq('date', date)
    .neq('status', 'cancelled');
  const booked = (data || []).map((r: any) => r.time);
  return allSlots.filter(s => !booked.includes(s));
}

export async function getSiteConfig(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('site_config').select('key, value');
  if (error || !data) return {};
  return Object.fromEntries(data.map((r: any) => [r.key, r.value]));
}

export async function updateSiteConfig(key: string, value: string) {
  const { error } = await supabase
    .from('site_config')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
}

export async function updateMultipleConfigs(updates: Record<string, string>) {
  const rows = Object.entries(updates).map(([key, value]) => ({
    key, value, updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from('site_config').upsert(rows, { onConflict: 'key' });
  if (error) throw new Error(error.message);
}

function dbToUser(d: any): User {
  return {
    id: d.id, name: d.name, email: d.email, password: d.password,
    role: d.role, phone: d.phone || '',
    childName: d.child_name || undefined,
    childAge: d.child_age || undefined,
    createdAt: d.created_at,
  };
}

function dbToAppointment(d: any): Appointment {
  return {
    id: d.id, userId: d.user_id, userName: d.user_name,
    userEmail: d.user_email, userRole: d.user_role,
    studentName: d.student_name, date: d.date, time: d.time,
    address: d.address, notes: d.notes || '',
    status: d.status, createdAt: d.created_at,
  };
}

// ─── MESSAGES ────────────────────────────────────────────

export async function getMessages(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map((d: any) => ({
    id: d.id, fromUserId: d.from_user_id, toUserId: d.to_user_id,
    fromName: d.from_name, content: d.content, read: d.read, createdAt: d.created_at,
  }));
}

export async function sendMessage(fromUserId: string, toUserId: string, fromName: string, content: string) {
  const { error } = await supabase.from('messages').insert({
    from_user_id: fromUserId, to_user_id: toUserId, from_name: fromName, content,
  });
  if (error) throw new Error(error.message);
}

export async function markMessagesRead(fromUserId: string, toUserId: string) {
  await supabase.from('messages')
    .update({ read: true })
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', toUserId);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase.from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('to_user_id', userId)
    .eq('read', false);
  return count || 0;
}

export async function getAdminUser(): Promise<User | null> {
  const { data } = await supabase.from('users').select('*').eq('role', 'admin').single();
  if (!data) return null;
  return dbToUser(data);
}

export async function getAvailableSlotsForDate(date: string): Promise<string[]> {
  const [cfg, booked] = await Promise.all([
    getSiteConfig(),
    supabase.from('appointments').select('time').eq('date', date).neq('status', 'cancelled'),
  ]);
  const allSlots = (cfg['available_slots'] || '08:00,09:00,10:00,11:00,13:00,14:00,15:00,16:00,17:00,18:00,19:00').split(',').filter(Boolean);
  const bookedTimes = ((booked.data || []) as any[]).map((r: any) => r.time);
  return allSlots.filter((s: string) => !bookedTimes.includes(s));
}

export async function getAvailableSlotsByWeekday(date: string): Promise<string[]> {
  const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const dayIndex = new Date(date + 'T12:00:00').getDay();
  const dayKey = weekdays[dayIndex];

  const [cfg, booked] = await Promise.all([
    getSiteConfig(),
    supabase.from('appointments').select('time').eq('date', date).neq('status', 'cancelled'),
  ]);

  const key = `slots_${dayKey}`;
  const defaultSlots: Record<string, string> = {
    monday: '13:00,14:00,15:00,16:00,17:00,18:00,19:00',
    tuesday: '13:00,14:00,15:00,16:00,17:00,18:00,19:00',
    wednesday: '13:00,14:00,15:00,16:00,17:00,18:00,19:00',
    thursday: '13:00,14:00,15:00,16:00,17:00,18:00,19:00',
    friday: '13:00,14:00,15:00,16:00,17:00,18:00,19:00',
    saturday: '08:00,09:00,10:00,11:00',
    sunday: '',
  };

  const slotStr = cfg[key] !== undefined ? cfg[key] : (defaultSlots[dayKey] || '');
  const allSlots = slotStr ? slotStr.split(',').filter(Boolean) : [];
  const bookedTimes = ((booked.data || []) as any[]).map((r: any) => r.time);
  return allSlots.filter((s: string) => !bookedTimes.includes(s));
}

// ─── BLOCKED DATES ────────────────────────────────────────

export async function getBlockedDates(): Promise<any[]> {
  const { data, error } = await supabase
    .from('blocked_dates')
    .select('*')
    .order('date', { ascending: true });
  if (error || !data) return [];
  return data.map((d: any) => ({ id: d.id, date: d.date, reason: d.reason || '', createdAt: d.created_at }));
}

export async function addBlockedDate(date: string, reason: string) {
  const { error } = await supabase.from('blocked_dates').insert({ date, reason: reason || null });
  if (error) throw new Error(error.message);
}

export async function removeBlockedDate(id: string) {
  const { error } = await supabase.from('blocked_dates').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function isDateBlocked(date: string): Promise<boolean> {
  const { data } = await supabase.from('blocked_dates').select('id').eq('date', date).single();
  return !!data;
}

// ─── PAYMENTS ─────────────────────────────────────────────

export async function togglePayment(id: string, paid: boolean) {
  const { error } = await supabase.from('appointments').update({ paid }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function cancelAppointmentByStudent(id: string, userId: string): Promise<void> {
  // Check 48h rule
  const { data } = await supabase.from('appointments').select('date, time, user_id').eq('id', id).single();
  if (!data) throw new Error('Agendamento não encontrado.');
  if (data.user_id !== userId) throw new Error('Sem permissão para cancelar este agendamento.');

  const apptDate = new Date(`${data.date}T${data.time}:00`);
  const now = new Date();
  const diffHours = (apptDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (diffHours < 48) throw new Error('Cancelamento não permitido com menos de 48 horas de antecedência.');

  const { error } = await supabase.from('appointments').update({
    status: 'cancelled',
    cancelled_by: 'student',
    cancelled_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getAvailableSlotsWithBlocked(date: string): Promise<string[]> {
  const blocked = await isDateBlocked(date);
  if (blocked) return [];
  return getAvailableSlotsByWeekday(date);
}
