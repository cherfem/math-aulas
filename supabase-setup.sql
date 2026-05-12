-- =============================================
-- MathAulas — Script de configuração do banco
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student', 'parent')),
  phone TEXT,
  child_name TEXT,
  child_age TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de agendamentos
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  student_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de configurações do site (textos e foto editáveis pela admin)
CREATE TABLE IF NOT EXISTS site_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Inserir admin padrão
INSERT INTO users (id, name, email, password, role, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Professora',
  'admin@mathaulas.com',
  'Admin@2024!',
  'admin',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 5. Inserir textos padrão do site
INSERT INTO site_config (key, value) VALUES
  ('hero_title', 'Matemática que faz sentido'),
  ('hero_subtitle', 'Do fundamental ao vestibular, com metodologia personalizada, paciência e dedicação. Agende sua aula e transforme sua relação com a matemática.'),
  ('about_text', 'Professora de matemática com experiência em escola pública e aulas particulares, apaixonada por tornar o aprendizado da matemática acessível e envolvente. Cada aluno recebe atenção individualizada, respeitando seu ritmo e estilo de aprendizagem.'),
  ('teacher_name', 'Professora'),
  ('teacher_photo', ''),
  ('stat_students', '100+'),
  ('stat_rating', '5★'),
  ('stat_years', '3+'),
  ('tags', 'Graduada em Matemática,Pós-graduanda em Educação,ENEM e Vestibulares,Online e Presencial'),
  ('whatsapp', ''),
  ('cta_text', 'Cadastre-se gratuitamente e agende sua primeira aula.')
ON CONFLICT (key) DO NOTHING;

-- 6. Desabilitar RLS (Row Level Security) para simplicidade
-- O site usa sua própria lógica de autenticação
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_config DISABLE ROW LEVEL SECURITY;

-- 7. Permitir acesso anônimo via API
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON appointments TO anon, authenticated;
GRANT ALL ON site_config TO anon, authenticated;
