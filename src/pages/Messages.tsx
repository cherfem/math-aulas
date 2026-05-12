import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMessages, sendMessage, markMessagesRead, getAllUsers, getAdminUser } from '../utils/storage';
import { Message, User } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Messages() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  const isAdmin = user.role === 'admin';
  const [conversations, setConversations] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);

  // Load conversation list
  useEffect(() => {
    const load = async () => {
      if (isAdmin) {
        const users = await getAllUsers();
        setConversations(users);
      } else {
        const admin = await getAdminUser();
        if (admin) {
          setConversations([admin]);
          setSelectedUser(admin);
        }
      }
      setLoading(false);
    };
    load();
  }, [isAdmin]);

  // Load messages for selected conversation
  const loadMessages = async () => {
    if (!selectedUser) return;
    const msgs = await getMessages(user.id);
    const filtered = msgs.filter(m =>
      (m.fromUserId === user.id && m.toUserId === selectedUser.id) ||
      (m.fromUserId === selectedUser.id && m.toUserId === user.id)
    );
    setMessages(filtered);
    await markMessagesRead(selectedUser.id, user.id);
  };

  useEffect(() => {
    if (!selectedUser) return;
    loadMessages();
    // Poll every 5 seconds for new messages
    pollRef.current = setInterval(loadMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [selectedUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !selectedUser) return;
    setSending(true);
    try {
      await sendMessage(user.id, selectedUser.id, user.name, text.trim());
      setText('');
      await loadMessages();
    } catch { alert('Erro ao enviar mensagem.'); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', paddingTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingTop: '64px', background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '1.25rem' }}>
          💬 <span style={{ color: 'var(--cyan)' }}>Mensagens</span>
        </h1>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isAdmin ? '280px 1fr' : '1fr', gap: '1rem', minHeight: 0 }}>
          {/* Sidebar — admin only */}
          {isAdmin && (
            <div className="card" style={{ overflow: 'auto', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conversas</div>
              {conversations.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 1rem' }}>Nenhum usuário cadastrado ainda.</div>
              )}
              {conversations.map(u => (
                <div key={u.id} onClick={() => setSelectedUser(u)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  background: selectedUser?.id === u.id ? 'var(--cyan-dim)' : 'transparent',
                  border: `1px solid ${selectedUser?.id === u.id ? 'var(--border-strong)' : 'transparent'}`,
                  transition: 'var(--transition)', marginBottom: '0.25rem',
                }}
                onMouseEnter={e => { if (selectedUser?.id !== u.id) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                onMouseLeave={e => { if (selectedUser?.id !== u.id) e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cyan), #0077b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.role === 'parent' ? '👨‍👩‍👦 Responsável' : '🎓 Aluno'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chat area */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
            {!selectedUser ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '2.5rem' }}>💬</div>
                <div>Selecione uma conversa para começar</div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cyan), #0077b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedUser.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {selectedUser.role === 'admin' ? '👩‍🏫 Professora' : selectedUser.role === 'parent' ? `👨‍👩‍👦 Responsável${selectedUser.childName ? ` — ${selectedUser.childName}` : ''}` : '🎓 Aluno'}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', animation: 'pulse-glow 2s ease infinite' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>online</span>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', margin: 'auto' }}>
                      Nenhuma mensagem ainda. Diga olá! 👋
                    </div>
                  )}
                  {messages.map(msg => {
                    const isMine = msg.fromUserId === user.id;
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%',
                          background: isMine ? 'linear-gradient(135deg, var(--cyan), #0077b6)' : 'var(--bg-card-hover)',
                          border: isMine ? 'none' : '1px solid var(--border)',
                          borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          padding: '0.65rem 1rem',
                          color: isMine ? '#fff' : 'var(--text-primary)',
                        }}>
                          <div style={{ fontSize: '0.92rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
                          <div style={{ fontSize: '0.68rem', opacity: 0.7, marginTop: '0.3rem', textAlign: isMine ? 'right' : 'left' }}>
                            {format(parseISO(msg.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem... (Enter para enviar)"
                    rows={1}
                    style={{
                      flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                      padding: '0.65rem 1rem', fontFamily: 'var(--font-body)', fontSize: '0.92rem',
                      resize: 'none', outline: 'none', transition: 'var(--transition)', maxHeight: 120, overflowY: 'auto',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <button type="submit" disabled={sending || !text.trim()} style={{
                    background: 'linear-gradient(135deg, var(--cyan), #0077b6)',
                    border: 'none', borderRadius: 'var(--radius-md)',
                    color: '#fff', padding: '0.65rem 1.1rem',
                    cursor: sending || !text.trim() ? 'not-allowed' : 'pointer',
                    opacity: sending || !text.trim() ? 0.5 : 1,
                    fontSize: '1.1rem', transition: 'var(--transition)', flexShrink: 0,
                  }}>
                    {sending ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : '➤'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
