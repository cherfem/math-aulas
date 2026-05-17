import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatDate(date: string) {
  return format(parseISO(date), "dd/MM/yyyy (EEEE)", { locale: ptBR });
}

function openWhatsApp(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, '');
  const number = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${number}?text=${encoded}`, '_blank');
}

export function sendBookingWhatsApp(phone: string, studentName: string, date: string, time: string, address: string) {
  const msg =
`Olá, ${studentName}! 👋

Seu agendamento foi *recebido* com sucesso! ✅

📅 *Data:* ${formatDate(date)}
🕐 *Horário:* ${time}
📍 *Local:* ${address}

Aguarde a confirmação da professora. Qualquer dúvida é só chamar! 😊

_MathAulas_`;
  openWhatsApp(phone, msg);
}

export function sendConfirmationWhatsApp(phone: string, studentName: string, date: string, time: string, address: string) {
  const msg =
`Olá, ${studentName}! 🎉

Sua aula foi *confirmada*! ✅

📅 *Data:* ${formatDate(date)}
🕐 *Horário:* ${time}
📍 *Local:* ${address}

Prepare seu material e até lá! 📐✏️

_MathAulas_`;
  openWhatsApp(phone, msg);
}

export function sendCancellationWhatsApp(phone: string, studentName: string, date: string, time: string) {
  const msg =
`Olá, ${studentName}.

Infelizmente sua aula precisou ser *cancelada*. ❌

📅 *Data cancelada:* ${formatDate(date)} às ${time}

Entre no site para reagendar quando quiser. Qualquer dúvida é só chamar! 😊

_MathAulas_`;
  openWhatsApp(phone, msg);
}

export function sendReminderWhatsApp(phone: string, studentName: string, date: string, time: string, address: string) {
  const msg =
`Olá, ${studentName}! 🔔

Lembrete: sua aula é *amanhã*!

📅 *Data:* ${formatDate(date)}
🕐 *Horário:* ${time}
📍 *Local:* ${address}

Não esqueça de preparar o material! 📚

_MathAulas_`;
  openWhatsApp(phone, msg);
}
