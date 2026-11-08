-- ============================================
-- Rinear Systems Painel — Schema completo
-- Execute no Supabase SQL Editor
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- para gen_random_uuid()

-- ============================================
-- TABELAS
-- ============================================

-- restaurantes
CREATE TABLE IF NOT EXISTS restaurantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text,
  responsavel text,
  whatsapp text,
  instagram text,
  email text,
  cidade text,
  bairro text,
  googlemaps text,
  sitio text,
  observacoes text,
  status text NOT NULL DEFAULT 'lead' CHECK (status IN ('lead','em negociacao','em producao','entregue','manutencao','perdido')),
  valor numeric DEFAULT 0,
  data_inicio date,
  data_entrega date,
  data_renovacao date,
  created_at timestamptz DEFAULT now()
);

-- categorias
CREATE TABLE IF NOT EXISTS categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurante_id uuid NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  nome text NOT NULL,
  ordem int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- produtos
CREATE TABLE IF NOT EXISTS produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurante_id uuid NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  categoria_id uuid REFERENCES categorias(id) ON DELETE SET NULL,
  categoria text,
  nome text NOT NULL,
  descricao text,
  preco numeric DEFAULT 0,
  foto text,
  adicionais text,
  tamanhos text,
  disponivel text NOT NULL DEFAULT 'sim' CHECK (disponivel IN ('sim','nao')),
  ordem int DEFAULT 0,
  promocao text,
  horario text,
  taxa_entrega numeric DEFAULT 0,
  area_entrega text,
  pagamento text,
  created_at timestamptz DEFAULT now()
);

-- pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurante_id uuid NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  cliente text,
  forma text,
  endereco text,
  observacoes text,
  itens jsonb DEFAULT '[]'::jsonb,
  total numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'recebido' CHECK (status IN ('recebido','em preparo','saiu entrega','pronto retirada','concluido','cancelado')),
  created_at timestamptz DEFAULT now()
);

-- mensagens
CREATE TABLE IF NOT EXISTS mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurante_id uuid NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  nome text NOT NULL,
  texto text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- midia
CREATE TABLE IF NOT EXISTS midia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurante_id uuid NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('imagem','video','documento','outro')),
  nome text NOT NULL,
  url text NOT NULL,
  tamanho text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- ÍNDICES ÚTEIS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_restaurantes_status ON restaurantes(status);
CREATE INDEX IF NOT EXISTS idx_categorias_restaurante ON categorias(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_produtos_restaurante ON produtos(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_restaurante ON pedidos(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_mensagens_restaurante ON mensagens(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_midia_restaurante ON midia(restaurante_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Habilita RLS em todas as tabelas
ALTER TABLE restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE midia ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA ANON KEY (ajuste conforme sua necessidade)
-- ============================================
-- ATENÇÃO: Estas políticas permitem TUDO para anon.
-- Em produção, restrinja por auth.uid() ou tenant_id.

-- restaurantes
DROP POLICY IF EXISTS "anon_all_restaurantes" ON restaurantes;
CREATE POLICY "anon_all_restaurantes" ON restaurantes
  FOR ALL USING (true) WITH CHECK (true);

-- categorias
DROP POLICY IF EXISTS "anon_all_categorias" ON categorias;
CREATE POLICY "anon_all_categorias" ON categorias
  FOR ALL USING (true) WITH CHECK (true);

-- produtos
DROP POLICY IF EXISTS "anon_all_produtos" ON produtos;
CREATE POLICY "anon_all_produtos" ON produtos
  FOR ALL USING (true) WITH CHECK (true);

-- pedidos
DROP POLICY IF EXISTS "anon_all_pedidos" ON pedidos;
CREATE POLICY "anon_all_pedidos" ON pedidos
  FOR ALL USING (true) WITH CHECK (true);

-- mensagens
DROP POLICY IF EXISTS "anon_all_mensagens" ON mensagens;
CREATE POLICY "anon_all_mensagens" ON mensagens
  FOR ALL USING (true) WITH CHECK (true);

-- midia
DROP POLICY IF EXISTS "anon_all_midia" ON midia;
CREATE POLICY "anon_all_midia" ON midia
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- VERIFICAÇÃO RÁPIDA
-- ============================================
-- Rode isto depois para confirmar:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('restaurantes','categorias','produtos','pedidos','mensagens','midia');