// Email service using Resend API
// Called directly from the frontend via fetch

const RESEND_API_KEY = 're_aREKz8Sx_68JEdKp89Pu6oPbYoPfdmo7q';
const FROM_EMAIL = 'MathAulas <onboarding@resend.dev>';

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Email error:', error);
  }
}

function emailBase(content: string): string {
  return `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #060d1a; color: #e8f4f8; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #00b4d8, #0077b6); padding: 28px 32px; text-align: center;">
        <div style="font-size: 2rem; margin-bottom: 4px;">∑</div>
        <h1 style="margin: 0; font-size: 1.4rem; color: #fff; letter-spacing: -0.02em;">MathAulas</h1>
        <p style="margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 0.85rem;">Aulas Particulares de Matemática</p>
      </div>
      <div style="padding: 32px;">
        ${content}
      </div>
      <div style="padding: 20px 32px; border-top: 1px solid rgba(0,180,216,0.15); text-align: center; font-size: 0.78rem; color: #4a7a8a;">
        Este é um e-mail automático do sistema MathAulas. Por favor, não responda.
      </div>
    </div>
  `;
}

export async function sendConfirmationEmail(
  studentEmail: string,
  studentName: string,
  date: string,
  time: string,
  address: string
) {
  const html = emailBase(`
    <h2 style="color: #00b4d8; margin: 0 0 16px;">✓ Aula Confirmada!</h2>
    <p style="color: #8ab4c4; margin: 0 0 20px;">Olá, <strong style="color: #e8f4f8;">${studentName}</strong>! Sua aula foi confirmada com sucesso.</p>
    <div style="background: rgba(0,180,216,0.08); border: 1px solid rgba(0,180,216,0.2); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <div style="margin-bottom: 10px;"><span style="color: #4a7a8a; font-size: 0.82rem;">📅 Data e horário</span><br/><strong>${date} às ${time}</strong></div>
      <div><span style="color: #4a7a8a; font-size: 0.82rem;">📍 Local</span><br/><strong>${address}</strong></div>
    </div>
    <p style="color: #8ab4c4; font-size: 0.88rem; margin: 0;">Qualquer dúvida, entre em contato pela plataforma através do chat de mensagens.</p>
  `);
  await sendEmail(studentEmail, '✓ Aula confirmada — MathAulas', html);
}

export async function sendCancellationEmail(
  studentEmail: string,
  studentName: string,
  date: string,
  time: string
) {
  const html = emailBase(`
    <h2 style="color: #f87171; margin: 0 0 16px;">✗ Aula Cancelada</h2>
    <p style="color: #8ab4c4; margin: 0 0 20px;">Olá, <strong style="color: #e8f4f8;">${studentName}</strong>. Sua aula foi cancelada.</p>
    <div style="background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <div style="margin-bottom: 10px;"><span style="color: #4a7a8a; font-size: 0.82rem;">📅 Data e horário cancelados</span><br/><strong>${date} às ${time}</strong></div>
    </div>
    <p style="color: #8ab4c4; font-size: 0.88rem; margin: 0;">Acesse a plataforma para reagendar sua aula.</p>
  `);
  await sendEmail(studentEmail, '✗ Aula cancelada — MathAulas', html);
}

export async function sendReminderEmail(
  studentEmail: string,
  studentName: string,
  date: string,
  time: string,
  address: string
) {
  const html = emailBase(`
    <h2 style="color: #fbbf24; margin: 0 0 16px;">🔔 Lembrete de Aula</h2>
    <p style="color: #8ab4c4; margin: 0 0 20px;">Olá, <strong style="color: #e8f4f8;">${studentName}</strong>! Sua aula é <strong style="color: #fbbf24;">amanhã</strong>!</p>
    <div style="background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <div style="margin-bottom: 10px;"><span style="color: #4a7a8a; font-size: 0.82rem;">📅 Data e horário</span><br/><strong>${date} às ${time}</strong></div>
      <div><span style="color: #4a7a8a; font-size: 0.82rem;">📍 Local</span><br/><strong>${address}</strong></div>
    </div>
    <p style="color: #8ab4c4; font-size: 0.88rem; margin: 0;">Prepare seu material e até amanhã! 📐</p>
  `);
  await sendEmail(studentEmail, '🔔 Lembrete: sua aula é amanhã — MathAulas', html);
}

export async function sendBookingEmail(
  studentEmail: string,
  studentName: string,
  date: string,
  time: string,
  address: string
) {
  const html = emailBase(`
    <h2 style="color: #00b4d8; margin: 0 0 16px;">📅 Agendamento Recebido</h2>
    <p style="color: #8ab4c4; margin: 0 0 20px;">Olá, <strong style="color: #e8f4f8;">${studentName}</strong>! Seu agendamento foi recebido e aguarda confirmação da professora.</p>
    <div style="background: rgba(0,180,216,0.08); border: 1px solid rgba(0,180,216,0.2); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <div style="margin-bottom: 10px;"><span style="color: #4a7a8a; font-size: 0.82rem;">📅 Data e horário solicitados</span><br/><strong>${date} às ${time}</strong></div>
      <div><span style="color: #4a7a8a; font-size: 0.82rem;">📍 Local</span><br/><strong>${address}</strong></div>
    </div>
    <p style="color: #8ab4c4; font-size: 0.88rem; margin: 0;">Você receberá um e-mail assim que a professora confirmar sua aula.</p>
  `);
  await sendEmail(studentEmail, '📅 Agendamento recebido — MathAulas', html);
}
