import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSiteConfig, updateSiteConfig } from '../utils/storage';

const DEFAULT_CONFIG: Record<string, string> = {
  hero_title: 'Matemática que faz sentido',
  hero_subtitle: 'Do fundamental ao vestibular, com metodologia personalizada, paciência e dedicação. Agende sua aula e transforme sua relação com a matemática.',
  about_text: 'Professora de matemática com experiência em escola pública e aulas particulares, apaixonada por tornar o aprendizado da matemática acessível e envolvente. Cada aluno recebe atenção individualizada, respeitando seu ritmo e estilo de aprendizagem.',
  teacher_name: 'Professora',
  teacher_photo: '',
  stat_students: '100+',
  stat_rating: '5★',
  stat_years: '3+',
  tags: 'Graduada em Matemática,Pós-graduanda em Educação,ENEM e Vestibulares,Online e Presencial',
  cta_text: 'Cadastre-se gratuitamente e agende sua primeira aula.',
  feature_1_icon: '📐', feature_1_title: 'Ensino Fundamental', feature_1_desc: 'Da 6ª ao 9º ano, base sólida e metodologia clara.',
  feature_2_icon: '📊', feature_2_title: 'Ensino Médio', feature_2_desc: 'Álgebra, geometria, funções e trigonometria.',
  feature_3_icon: '🎯', feature_3_title: 'Pré-vestibular', feature_3_desc: 'Preparação intensiva para ENEM e vestibulares.',
  feature_4_icon: '♾️', feature_4_title: 'Ensino Superior', feature_4_desc: 'Cálculo, álgebra linear e estatística.',
  testimonial_1_name: 'Ana Lima', testimonial_1_text: 'Minhas notas melhoraram muito! A explicação é clara e paciente.', testimonial_1_stars: '5',
  testimonial_2_name: 'Carlos Souza', testimonial_2_text: 'Meu filho foi aprovado no vestibular graças às aulas particulares.', testimonial_2_stars: '5',
  testimonial_3_name: 'Beatriz Neves', testimonial_3_text: 'Finalmente entendi trigonometria. Recomendo demais!', testimonial_3_stars: '5',
};

// ─── Editable Text Component ─────────────────────────────
function EditableText({ value, onSave, isAdmin, multiline = false, style = {}, placeholder = '' }: {
  value: string; onSave: (v: string) => void; isAdmin: boolean;
  multiline?: boolean; style?: React.CSSProperties; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);

  const save = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (!isAdmin) return <span style={style}>{value || placeholder}</span>;

  if (editing) return (
    <span style={{ display: 'inline-block', width: '100%' }}>
      {multiline
        ? <textarea value={draft} onChange={e => setDraft(e.target.value)} autoFocus rows={3}
            style={{ ...style, width: '100%', background: 'var(--bg-input)', border: '2px solid var(--cyan)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '0.5rem', fontFamily: 'var(--font-body)', fontSize: 'inherit', resize: 'vertical' }} />
        : <input value={draft} onChange={e => setDraft(e.target.value)} autoFocus
            style={{ ...style, width: '100%', background: 'var(--bg-input)', border: '2px solid var(--cyan)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '0.4rem 0.6rem', fontFamily: 'var(--font-body)', fontSize: 'inherit' }} />
      }
      <span style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
        <button onClick={save} style={{ background: 'var(--cyan)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer' }}>✓ Salvar</button>
        <button onClick={cancel} style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer' }}>✗ Cancelar</button>
      </span>
    </span>
  );

  return (
    <span onClick={() => setEditing(true)} title="Clique para editar" style={{
      ...style, cursor: 'pointer', position: 'relative', display: 'inline-block',
      outline: '2px dashed rgba(0,180,216,0.4)', outlineOffset: 4, borderRadius: 4,
    }}>
      {value || placeholder}
      <span style={{ position: 'absolute', top: -18, right: 0, background: 'var(--cyan)', color: '#fff', fontSize: '0.65rem', padding: '1px 6px', borderRadius: 3, whiteSpace: 'nowrap', pointerEvents: 'none' }}>✎ editar</span>
    </span>
  );
}

// ─── Editable Icon picker ─────────────────────────────────
const ICON_OPTIONS = ['📐','📊','🎯','♾️','📚','✏️','🔢','📏','🧮','🧠','⚡','🌟','💡','🏆','🎓','📝'];

function EditableIcon({ value, onSave, isAdmin }: { value: string; onSave: (v: string) => void; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  if (!isAdmin) return <span style={{ fontSize: '2rem' }}>{value}</span>;
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span onClick={() => setOpen(!open)} title="Clique para trocar o ícone" style={{
        fontSize: '2rem', cursor: 'pointer', display: 'inline-block',
        outline: '2px dashed rgba(0,180,216,0.4)', outlineOffset: 4, borderRadius: 4,
      }}>{value}</span>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, zIndex: 50,
          background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)', padding: '0.5rem',
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {ICON_OPTIONS.map(ic => (
            <button key={ic} onClick={() => { onSave(ic); setOpen(false); }} style={{
              background: ic === value ? 'var(--cyan-dim)' : 'transparent',
              border: '1px solid transparent', borderRadius: 6,
              fontSize: '1.3rem', cursor: 'pointer', padding: '0.3rem',
              transition: 'var(--transition)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--cyan-dim)'}
            onMouseLeave={e => e.currentTarget.style.background = ic === value ? 'var(--cyan-dim)' : 'transparent'}
            >{ic}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Star rating editor ───────────────────────────────────
function EditableStars({ value, onSave, isAdmin }: { value: string; onSave: (v: string) => void; isAdmin: boolean }) {
  const n = parseInt(value) || 5;
  if (!isAdmin) return <div style={{ color: 'var(--warning)', marginBottom: '1rem' }}>{'★'.repeat(n)}</div>;
  return (
    <div style={{ display: 'flex', gap: 2, marginBottom: '1rem' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} onClick={() => onSave(String(i))} style={{
          fontSize: '1.2rem', cursor: 'pointer',
          color: i <= n ? 'var(--warning)' : 'var(--text-dim)',
          transition: 'var(--transition)',
        }}>★</span>
      ))}
    </div>
  );
}

// ─── Main Home Component ──────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const fileRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<Record<string, string>>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    getSiteConfig().then(data => {
      if (Object.keys(data).length > 0) setConfig({ ...DEFAULT_CONFIG, ...data });
      setLoading(false);
    });
  }, []);

  const handleSave = useCallback(async (key: string, value: string) => {
    try {
      await updateSiteConfig(key, value);
      setConfig(prev => ({ ...prev, [key]: value }));
      setSaveMsg('Salvo!');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch { alert('Erro ao salvar. Tente novamente.'); }
  }, []);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5000000) { alert('Foto muito grande! Use uma imagem menor que 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = ev => handleSave('teacher_photo', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const tags = (config.tags || '').split(',').filter(Boolean);

  const features = [1,2,3,4].map(i => ({
    icon: config[`feature_${i}_icon`],
    title: config[`feature_${i}_title`],
    desc: config[`feature_${i}_desc`],
    i,
  }));

  const testimonials = [1,2,3].map(i => ({
    name: config[`testimonial_${i}_name`],
    text: config[`testimonial_${i}_text`],
    stars: config[`testimonial_${i}_stars`],
    i,
  }));

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  return (
    <div className="page-container">
      {/* Admin banner */}
      {isAdmin && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
          background: 'rgba(0,100,160,0.97)', backdropFilter: 'blur(8px)',
          padding: '0.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--cyan-bright)' }}>
            ✎ Modo admin — clique em qualquer texto ou ícone para editar
          </span>
          {saveMsg && <span style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 600 }}>✓ {saveMsg}</span>}
        </div>
      )}

      {/* ── HERO ── */}
      <section className="grid-bg" style={{
        minHeight: '100vh', paddingTop: isAdmin ? '108px' : '64px',
        display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '15%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(0,180,216,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(0,119,182,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
            <div className="animate-fade">
              <div className="badge badge-cyan" style={{ marginBottom: '1.5rem' }}>✦ Aulas Particulares de Matemática</div>
              <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                <EditableText value={config.hero_title} onSave={v => handleSave('hero_title', v)} isAdmin={isAdmin}
                  style={{ background: 'linear-gradient(90deg, var(--cyan), #0077b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: isAdmin ? undefined : 'transparent', color: isAdmin ? 'var(--cyan)' : undefined }} />
              </h1>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.7, maxWidth: 480 }}>
                <EditableText value={config.hero_subtitle} onSave={v => handleSave('hero_subtitle', v)} isAdmin={isAdmin} multiline />
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {user
                  ? <Link to="/agendar"><button className="btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>Agendar Aula →</button></Link>
                  : <>
                      <Link to="/cadastro"><button className="btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>Começar agora →</button></Link>
                      <Link to="/login"><button className="btn-ghost" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>Já tenho conta</button></Link>
                    </>
                }
              </div>
              <div style={{ display: 'flex', gap: '2.5rem', marginTop: '3rem' }}>
                {[
                  { key: 'stat_students', label: 'Alunos atendidos' },
                  { key: 'stat_rating', label: 'Avaliação média' },
                  { key: 'stat_years', label: 'Anos de experiência' },
                ].map(s => (
                  <div key={s.key}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.6rem', color: 'var(--cyan)' }}>
                      <EditableText value={config[s.key]} onSave={v => handleSave(s.key, v)} isAdmin={isAdmin} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo */}
            <div className="animate-fade-delay" style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '1px dashed var(--border-strong)', animation: 'spin 20s linear infinite', opacity: 0.4 }} />
                <div style={{ position: 'absolute', inset: -32, borderRadius: '50%', border: '1px dashed var(--border)', animation: 'spin 30s linear infinite reverse', opacity: 0.2 }} />
                <div onClick={() => isAdmin && fileRef.current?.click()} style={{
                  width: 320, height: 320, borderRadius: '50%',
                  border: '2px solid var(--border-strong)', background: 'var(--bg-card)',
                  overflow: 'hidden', position: 'relative',
                  cursor: isAdmin ? 'pointer' : 'default',
                  boxShadow: '0 0 60px rgba(0,180,216,0.15)',
                }}>
                  {config.teacher_photo
                    ? <img src={config.teacher_photo} alt="Professora" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '3rem' }}>👩‍🏫</div>
                        <span style={{ fontSize: '0.8rem', color: isAdmin ? 'var(--cyan)' : 'var(--text-muted)', textAlign: 'center', padding: '0 1rem' }}>
                          {isAdmin ? 'Clique para adicionar sua foto' : 'Professora de Matemática'}
                        </span>
                      </div>
                  }
                  {isAdmin && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'var(--transition)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,180,216,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'} />
                  )}
                </div>
                <div style={{ position: 'absolute', bottom: 16, right: -12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'pulse-glow 2s ease infinite' }} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Aceitando alunos</span>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section style={{ background: 'var(--bg-surface)', padding: '5rem 2rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '1.5rem' }}>
            Sobre a <span style={{ color: 'var(--cyan)' }}>
              <EditableText value={config.teacher_name} onSave={v => handleSave('teacher_name', v)} isAdmin={isAdmin} />
            </span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: 700, margin: '0 auto 2rem' }}>
            <EditableText value={config.about_text} onSave={v => handleSave('about_text', v)} isAdmin={isAdmin} multiline />
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {tags.map((tag, i) => <span key={i} className="badge badge-cyan">{tag}</span>)}
            {isAdmin && (
              <button onClick={() => {
                const nova = prompt('Tags separadas por vírgula:\n' + config.tags);
                if (nova !== null) handleSave('tags', nova);
              }} style={{ background: 'var(--cyan-dim)', border: '1px dashed var(--border-strong)', color: 'var(--cyan)', borderRadius: 100, padding: '0.2rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                ✎ editar tags
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>Modalidades de <span style={{ color: 'var(--cyan)' }}>Ensino</span></h2>
            <p style={{ color: 'var(--text-secondary)' }}>Atendimento personalizado para cada fase escolar</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {features.map(f => (
              <div key={f.i} className="card" style={{ padding: '1.75rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <EditableIcon value={f.icon} onSave={v => handleSave(`feature_${f.i}_icon`, v)} isAdmin={isAdmin} />
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>
                  <EditableText value={f.title} onSave={v => handleSave(`feature_${f.i}_title`, v)} isAdmin={isAdmin} />
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  <EditableText value={f.desc} onSave={v => handleSave(`feature_${f.i}_desc`, v)} isAdmin={isAdmin} multiline />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: 'var(--bg-surface)', padding: '5rem 2rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.2rem' }}>O que dizem os <span style={{ color: 'var(--cyan)' }}>alunos</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {testimonials.map(t => (
              <div key={t.i} className="card" style={{ padding: '1.5rem' }}>
                <EditableStars value={t.stars} onSave={v => handleSave(`testimonial_${t.i}_stars`, v)} isAdmin={isAdmin} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1rem', fontStyle: 'italic' }}>
                  "<EditableText value={t.text} onSave={v => handleSave(`testimonial_${t.i}_text`, v)} isAdmin={isAdmin} multiline />"
                </p>
                <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--cyan-light)' }}>
                  <EditableText value={t.name} onSave={v => handleSave(`testimonial_${t.i}_name`, v)} isAdmin={isAdmin} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!user && (
        <section style={{ padding: '5rem 2rem', textAlign: 'center' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>Pronto para começar?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              <EditableText value={config.cta_text} onSave={v => handleSave('cta_text', v)} isAdmin={isAdmin} />
            </p>
            <Link to="/cadastro">
              <button className="btn-primary" style={{ fontSize: '1.05rem', padding: '1rem 2.5rem' }}>Criar minha conta →</button>
            </Link>
          </div>
        </section>
      )}

      <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--cyan)', fontWeight: 600 }}>MathAulas</span>
        {' '}— Transformando vidas através da matemática © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
