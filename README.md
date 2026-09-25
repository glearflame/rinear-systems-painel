# Painel Interno — Rinear Systems

Dashboard privado da Rinear Systems com identidade visual completa.

## Funcionalidades

| Aba | Descrição |
|-----|-----------|
| **Visão Geral** | Métricas (receita estimada, leads ativos, propostas, contratos), ações rápidas e atividade recente |
| **Preços** | Tabela completa (Landing Pages, Sites Institucionais, Adicionais) com regras comerciais |
| **Pipeline** | Kanban drag-and-drop visual (Contato → Respondeu → Proposta → Follow-up → Fechado/Frio) com modal para novo lead e detalhes |
| **Contratos** | Modelo padrão, gerador de contrato preenchido (copia para clipboard) e link para pasta de assinados |
| **Marketing** | Bios Instagram/LinkedIn (copiar), roteiro de prospecção, link WhatsApp, pipeline CSV |
| **Identidade Visual** | Paleta de cores, tipografia, logo, guidelines de estilo |

## Tecnologias

- HTML5 + CSS3 (variáveis CSS, Grid, Flexbox) + Vanilla JS (ES6+)
- Fontes: **DM Serif Display** + **Inter** (Google Fonts)
- Cores: `--pink:#ff5ba8`, `--violet:#8b5cff`, `--accent:#e6c866`, fundo escuro `#071d22`
- Dados persistem em `localStorage` (pipeline) e leem CSV local quando possível

## Como usar

```bash
# Abrir direto no navegador
start index.html
# ou duplo-clique no arquivo
```

> **Nota:** Para ler o `pipeline-leads.csv` automaticamente, sirva via HTTP local (ex.: `npx serve` ou `python -m http.server`) — o navegador bloqueia `fetch` em `file://` por política CORS. O fallback `localStorage` funciona offline.

## Estrutura

```
painel-rinear/
├── index.html      # Dashboard completo (6 abas)
├── style.css       # Estilos com identidade Rinear
├── script.js       # Lógica: tabs, kanban, modais, contratos, CSV, localStorage
└── logo-ref.png    # Logo da marca
```

## Repositório

**Privado:** https://github.com/glearflame/rinear-systems-painel

---

*Rinear Systems — Ideias em sistemas reais*