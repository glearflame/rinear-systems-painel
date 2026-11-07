# Rinear Systems — Painel Interno

Dashboard de gestão de restaurantes, cardápios digitais, pedidos, mensagens WhatsApp e mídia.

## O que foi consertado

### Bugs críticos
- **Estado nunca atualizava** depois do primeiro load (`dbLoaded` travava o `carregarEstadoSupabase`). Agora sempre recarrega do Supabase após insert/update/delete.
- **IDs tratados como número** (`parseInt`) quebravam com UUID do Supabase. Agora tudo usa comparação por string.
- **Modal quebrado** — HTML aninhado (`<div class="modal open">` dentro de `#modal`). Padronizado: só o `.panel` vai no `#modal` + classe `.open`.
- **Migração localStorage → Supabase** rodava em loop e criava duplicatas. Agora tem flag `rinear_migrated_v1`.

### Melhorias
- Filtros de comparação de ID consistentes em todos os módulos.
- Leads calculados a partir de restaurantes com status `lead`.
- QR Code gerado em canvas (mais estável).
- `dbSelect` com operadores tipados (`.eq`, `.neq`, etc.).
- Toasts e tratamento de erro em todas as mutações.
- Navegação unificada (sem placeholders “em breve”).

## Como usar

1. Abra `index.html` (ou sirva a pasta com qualquer static server).
2. Configure as tabelas no Supabase (veja abaixo).
3. Ajuste `SUPABASE_URL` e `SUPABASE_ANON_KEY` em `supabase.js` se necessário.

## Tabelas esperadas no Supabase

```sql
-- restaurantes
id uuid primary key default gen_random_uuid(),
nome text, tipo text, responsavel text, whatsapp text, instagram text, email text,
cidade text, bairro text, googlemaps text, sitio text, observacoes text,
status text, valor numeric, data_inicio date, data_entrega date, data_renovacao date,
created_at timestamptz default now()

-- categorias
id uuid primary key default gen_random_uuid(),
restaurante_id uuid references restaurantes(id),
nome text, ordem int default 0, created_at timestamptz default now()

-- produtos
id uuid primary key default gen_random_uuid(),
restaurante_id uuid, categoria_id uuid, categoria text, nome text, descricao text,
preco numeric, foto text, adicionais text, tamanhos text, disponivel text,
ordem int, promocao text, horario text, taxa_entrega numeric, area_entrega text,
pagamento text, created_at timestamptz default now()

-- pedidos
id uuid primary key default gen_random_uuid(),
restaurante_id uuid, cliente text, forma text, endereco text, observacoes text,
itens jsonb, total numeric, status text, created_at timestamptz default now()

-- mensagens
id uuid primary key default gen_random_uuid(),
restaurante_id uuid, nome text, texto text, created_at timestamptz default now()

-- midia
id uuid primary key default gen_random_uuid(),
restaurante_id uuid, tipo text, nome text, url text, tamanho text,
created_at timestamptz default now()
```

Habilite RLS conforme sua política de acesso (anon key só deve ter o necessário).

## Arquivos

| Arquivo        | Função                          |
|----------------|---------------------------------|
| `index.html`   | Shell, dashboard, restaurantes  |
| `supabase.js`  | Cliente + CRUD                  |
| `cardapio.js`  | Categorias e produtos           |
| `pedidos.js`   | Pedidos + QR/link público       |
| `mensagens.js` | Modelos WhatsApp                |
| `midia.js`     | Biblioteca de arquivos          |
| `relatorios.js`| Indicadores                     |
