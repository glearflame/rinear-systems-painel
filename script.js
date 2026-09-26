/* ===== PAINEL RINEAR SYSTEMS — JS ===== */

// ===== ESTADO GLOBAL =====
let leads = [];
let leadEditando = null;
let leadDetalhado = null;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
  // Garante que nenhum modal abra no load (bug de especificidade CSS resolvido + cinto-e-suspensórios)
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  initTabs();
  initCursorGlow();
  initYear();
  carregarPipeline();
  initModals();
  initKanbanClick();
  initForms();
  initAcoes();
});

// ===== TABS =====
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
    });
  });

  const priceTabs = document.querySelectorAll('.price-tab');
  priceTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.price;
      priceTabs.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.price-table-wrapper').forEach(w => w.classList.add('hidden'));
      btn.classList.add('active');
      document.getElementById(`price-${target}`).classList.remove('hidden');
    });
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
  document.getElementById(`tab-${tabName}`)?.classList.add('active');
}

// ===== CURSOR GLOW =====
function initCursorGlow() {
  const glow = document.querySelector('.cursor-glow');
  if (!glow) return;
  window.addEventListener('pointermove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
}

// ===== ANO NO FOOTER =====
function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

// ===== CARREGAR PIPELINE (CSV embutido + localStorage) =====
async function carregarPipeline() {
  // Ordem: localStorage (mais recente) > CSV embutido no HTML > CSV via fetch
  const salvo = localStorage.getItem('rinear-pipeline');
  if (salvo) {
    try { leads = JSON.parse(salvo); if (!Array.isArray(leads)) leads = []; } catch { leads = []; }
  } else {
    // CSV embutido (deploy Cloudflare: não há ../06_Prospeccao)
    const csvEl = document.getElementById('pipeline-csv');
    if (csvEl) leads = parseCSV(csvEl.textContent);
    else {
      try {
        const resp = await fetch('pipeline-leads.csv');
        if (resp.ok) leads = parseCSV(await resp.text());
      } catch (e) { leads = []; }
    }
  }
  if (!Array.isArray(leads)) leads = [];
  renderPipeline();
  atualizarMetricas();
  atualizarAtividadeRecente();
}

function parseCSV(texto) {
  const linhas = texto.trim().split('\n');
  if (linhas.length <= 1) return [];
  const headers = linhas[0].split(',').map(h => h.trim());
  return linhas.slice(1).map(linha => {
    const vals = linha.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = vals[i] || '');
    // Garantir campos padrão
    if (!obj.id) obj.id = 'lead-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    // Mapeia status do pipeline-leads.csv (06_Prospeccao) pro kanban do painel
    const STATUS_MAP = { novo: 'contato', contato: 'contato', respondeu: 'respondeu', proposta: 'proposta', 'follow-up': 'followup', followup: 'followup', fechado: 'fechado', frio: 'frio' };
    obj.status = STATUS_MAP[(obj.status || '').toLowerCase()] || 'contato';
    if (!obj.data) obj.data = new Date().toISOString().split('T')[0];
    return obj;
  });
}

function salvarPipeline() {
  localStorage.setItem('rinear-pipeline', JSON.stringify(leads));
  // Também tenta salvar no CSV (só funciona se tiver permissão de escrita via File System Access API)
  // Por enquanto só localStorage
}

// ===== RENDER KANBAN =====
function renderPipeline() {
  const statusOrder = ['contato', 'respondeu', 'proposta', 'followup', 'fechado', 'frio'];
  statusOrder.forEach(status => {
    const col = document.getElementById(`col-${status}`);
    const countEl = document.getElementById(`count-${status}`);
    const leadsStatus = leads.filter(l => l.status === status);
    if (countEl) countEl.textContent = leadsStatus.length;
    if (col) {
      col.innerHTML = '';
      leadsStatus.forEach(lead => {
        const card = createLeadCard(lead);
        col.appendChild(card);
      });
    }
  });
}

function createLeadCard(lead) {
  const card = document.createElement('div');
  card.className = 'kanban-card';
  card.dataset.id = lead.id;

  const header = document.createElement('div');
  header.className = 'kanban-card-header';

  const name = document.createElement('span');
  name.className = 'kanban-card-name';
  name.textContent = lead.nome || 'Sem nome';
  header.appendChild(name);

  if (lead.valor_proposto) {
    const value = document.createElement('span');
    value.className = 'kanban-card-value';
    value.textContent = 'R$ ' + Number(lead.valor_proposto).toLocaleString('pt-BR');
    header.appendChild(value);
  }

  const meta = document.createElement('div');
  meta.className = 'kanban-card-meta';

  if (lead.nicho) {
    const s = document.createElement('span');
    s.textContent = '🏷️ ' + lead.nicho;
    meta.appendChild(s);
  }
  if (lead.cidade) {
    const s = document.createElement('span');
    s.textContent = '📍 ' + lead.cidade;
    meta.appendChild(s);
  }
  if (lead.canal) {
    const tag = document.createElement('span');
    tag.className = 'kanban-card-tag';
    tag.textContent = lead.canal;
    meta.appendChild(tag);
  }
  if (lead.contato) {
    const s = document.createElement('span');
    const ehTel = /[0-9]{8,}/.test(lead.contato);
    s.textContent = (ehTel ? '📱 ' : '📸 ') + lead.contato;
    meta.appendChild(s);
  }

  card.appendChild(header);
  card.appendChild(meta);
  card.addEventListener('click', () => abrirDetalhesLead(lead));
  return card;
}

function initKanbanClick() {
  // Clique na coluna vazia para adicionar lead (opcional)
  document.querySelectorAll('.kanban-cards').forEach(col => {
    col.addEventListener('click', e => {
      if (e.target === col) {
        const status = col.closest('.kanban-column')?.dataset.status;
        if (status) abrirModalLead(null, status);
      }
    });
  });
}

// ===== MÉTRICAS =====
function atualizarMetricas() {
  const receita = leads
    .filter(l => l.status === 'fechado' && l.valor_proposto)
    .reduce((sum, l) => sum + Number(l.valor_proposto || 0), 0);
  const leadsAtivos = leads.filter(l => !['fechado', 'frio'].includes(l.status)).length;
  const propostas = leads.filter(l => l.status === 'proposta').length;
  const contratos = leads.filter(l => l.status === 'fechado').length;

  document.getElementById('m-receita').textContent = 'R$ ' + receita.toLocaleString('pt-BR');
  document.getElementById('m-leads').textContent = leadsAtivos;
  document.getElementById('m-propostas').textContent = propostas;
  document.getElementById('m-contratos').textContent = contratos;
}

// ===== ATIVIDADE RECENTE =====
function atualizarAtividadeRecente() {
  const container = document.getElementById('activity-list');
  if (!container) return;

  const recentes = [...leads]
    .sort((a, b) => new Date(b.ultimo_contato || b.data) - new Date(a.ultimo_contato || a.data))
    .slice(0, 5);

  if (recentes.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhuma atividade recente. Adicione seu primeiro lead!</p>';
    return;
  }

  container.innerHTML = '';
  recentes.forEach(lead => {
    const statusLabels = {
      contato: 'Novo contato',
      respondeu: 'Respondeu',
      proposta: 'Proposta enviada',
      followup: 'Em follow-up',
      fechado: 'Fechado ✓',
      frio: 'Esfriou'
    };
    const statusColors = {
      contato: 'novo',
      respondeu: 'ativo',
      proposta: 'ativo',
      followup: 'ativo',
      fechado: 'fechado',
      frio: 'frio'
    };
    const data = lead.ultimo_contato || lead.data;

    const item = document.createElement('div');
    item.className = 'activity-item';

    const dot = document.createElement('span');
    dot.className = 'activity-dot ' + (statusColors[lead.status] || 'ativo');
    item.appendChild(dot);

    const text = document.createElement('span');
    text.className = 'activity-text';
    const strong = document.createElement('strong');
    strong.textContent = lead.nome;
    text.appendChild(strong);
    text.appendChild(document.createTextNode(' — ' + (statusLabels[lead.status] || lead.status)));
    if (lead.nicho) {
      text.appendChild(document.createTextNode(' (' + lead.nicho + ')'));
    }
    item.appendChild(text);

    const time = document.createElement('span');
    time.className = 'activity-time';
    time.textContent = formatDataBR(data);
    item.appendChild(time);

    container.appendChild(item);
  });
}

// ===== MODAL LEAD =====
function initModals() {
  // Modal Lead
  const modalLead = document.getElementById('modal-lead');
  const btnNovoLead = document.getElementById('btn-novo-lead');
  const btnCancelLead = modalLead?.querySelector('.modal-cancel');
  const btnCloseLead = modalLead?.querySelector('.modal-close');
  const backdropLead = modalLead?.querySelector('.modal-backdrop');

  btnNovoLead?.addEventListener('click', () => abrirModalLead());
  btnCancelLead?.addEventListener('click', () => fecharModal(modalLead));
  btnCloseLead?.addEventListener('click', () => fecharModal(modalLead));
  backdropLead?.addEventListener('click', () => fecharModal(modalLead));

  // Modal Detalhes
  const modalDetalhes = document.getElementById('modal-detalhes');
  const btnCloseDetalhes = modalDetalhes?.querySelector('.modal-close');
  const backdropDetalhes = modalDetalhes?.querySelector('.modal-backdrop');
  const btnMoverFrio = document.getElementById('btn-mover-frio');
  const btnAvancar = document.getElementById('btn-avancar');

  btnCloseDetalhes?.addEventListener('click', () => fecharModal(modalDetalhes));
  backdropDetalhes?.addEventListener('click', () => fecharModal(modalDetalhes));
  btnMoverFrio?.addEventListener('click', () => moverLeadFrio());
  btnAvancar?.addEventListener('click', () => avancarLead());

  // Modal Contrato
  const modalContrato = document.getElementById('modal-contrato');
  const btnGerarContrato = document.getElementById('btn-gerar-contrato');
  const btnCloseContrato = modalContrato?.querySelector('.modal-close');
  const backdropContrato = modalContrato?.querySelector('.modal-backdrop');
  const btnCancelContrato = modalContrato?.querySelector('.modal-cancel');

  btnGerarContrato?.addEventListener('click', () => abrirModalContrato());
  btnCloseContrato?.addEventListener('click', () => fecharModal(modalContrato));
  btnCancelContrato?.addEventListener('click', () => fecharModal(modalContrato));
  backdropContrato?.addEventListener('click', () => fecharModal(modalContrato));

  // Fechar com ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal:not(.hidden)').forEach(m => fecharModal(m));
    }
  });
}

function abrirModalLead(lead = null, statusInicial = 'contato') {
  const modal = document.getElementById('modal-lead');
  const form = document.getElementById('form-lead');
  leadEditando = lead;

  form.reset();
  if (lead) {
    form.nome.value = lead.nome || '';
    form.nicho.value = lead.nicho || '';
    form.cidade.value = lead.cidade || '';
    form.canal.value = lead.canal || 'instagram';
    form.contato.value = lead.contato || '';
    form.valor.value = lead.valor_proposto || '';
    form.observacoes.value = lead.observacoes || '';
    if (form.status) form.status.value = lead.status || 'contato';
  } else if (form.status) {
    form.status.value = statusInicial;
  }
  modal.classList.remove('hidden');
  setTimeout(() => form.nome.focus(), 50);
}

function fecharModal(modal) {
  modal.classList.add('hidden');
  leadEditando = null;
  leadDetalhado = null;
}

function abrirDetalhesLead(lead) {
  leadDetalhado = lead;
  const modal = document.getElementById('modal-detalhes');
  document.getElementById('detalhe-nome').textContent = lead.nome || 'Sem nome';

  const statusLabels = {
    contato: 'Contato Inicial',
    respondeu: 'Respondeu',
    proposta: 'Proposta Enviada',
    followup: 'Follow-up',
    fechado: 'Fechado ✓',
    frio: 'Frio'
  };

  const container = document.getElementById('detalhe-conteudo');
  const grid = document.createElement('div');
  grid.className = 'detalhe-grid';

  function addItem(label, value, isValueHighlight = false, isFull = false) {
    const item = document.createElement('div');
    item.className = 'detalhe-item' + (isFull ? ' full' : '');
    const lbl = document.createElement('span');
    lbl.className = 'detalhe-label';
    lbl.textContent = label;
    const val = document.createElement('span');
    val.className = 'detalhe-value';
    if (isValueHighlight) {
      val.style.cssText = 'color:var(--pink);font-family:var(--serif);font-size:18px';
    }
    val.textContent = value;
    item.appendChild(lbl);
    item.appendChild(val);
    grid.appendChild(item);
  }

  addItem('Status', statusLabels[lead.status] || lead.status);
  if (lead.nicho) addItem('Nicho', lead.nicho);
  if (lead.cidade) addItem('Cidade', lead.cidade);
  if (lead.canal) addItem('Canal', lead.canal);
  if (lead.contato) {
    addItem('Contato', lead.contato);
    // Botão de ação: WhatsApp se for telefone, Instagram se for @
    const digits = lead.contato.replace(/\D/g, '');
    let url = null, txt = null;
    if (digits.length >= 10) {
      const num = digits.length <= 11 ? '55' + digits : digits;
      url = `https://wa.me/${num}?text=${encodeURIComponent('Oi! Tudo bem? Sou da Rinear Systems, estúdio de sites aqui da região 🙌')}`;
      txt = '📱 Chamar no WhatsApp';
    } else if (lead.contato.startsWith('@')) {
      url = `https://instagram.com/${lead.contato.slice(1)}`;
      txt = '📸 Abrir Instagram';
    }
    if (url) {
      const item = document.createElement('div');
      item.className = 'detalhe-item full';
      const btn = document.createElement('a');
      btn.href = url; btn.target = '_blank'; btn.rel = 'noopener';
      btn.className = 'btn btn-primary';
      btn.style.cssText = 'width:100%;text-align:center;margin-top:4px';
      btn.textContent = txt;
      item.appendChild(btn);
      grid.appendChild(item);
    }
  }
  if (lead.valor_proposto) addItem('Valor Proposto', 'R$ ' + Number(lead.valor_proposto).toLocaleString('pt-BR'), true);
  if (lead.observacoes) addItem('Observações', lead.observacoes, false, true);
  addItem('Criado em', formatDataBR(lead.data));
  if (lead.ultimo_contato) addItem('Último contato', formatDataBR(lead.ultimo_contato));

  container.innerHTML = '';
  container.appendChild(grid);

  const btnFrio = document.getElementById('btn-mover-frio');
  const btnAvancar = document.getElementById('btn-avancar');
  if (lead.status === 'fechado' || lead.status === 'frio') {
    btnFrio.style.display = 'none';
    btnAvancar.style.display = 'none';
  } else {
    btnFrio.style.display = 'inline-flex';
    btnAvancar.style.display = 'inline-flex';
  }

  modal.classList.remove('hidden');
}

function avancarLead() {
  if (!leadDetalhado) return;
  const ordem = ['contato', 'respondeu', 'proposta', 'followup', 'fechado'];
  const idx = ordem.indexOf(leadDetalhado.status);
  if (idx < ordem.length - 1) {
    leadDetalhado.status = ordem[idx + 1];
    leadDetalhado.ultimo_contato = new Date().toISOString().split('T')[0];
    salvarLead(leadDetalhado);
    fecharModal(document.getElementById('modal-detalhes'));
    renderPipeline();
    atualizarMetricas();
    atualizarAtividadeRecente();
  }
}

function moverLeadFrio() {
  if (!leadDetalhado) return;
  leadDetalhado.status = 'frio';
  leadDetalhado.ultimo_contato = new Date().toISOString().split('T')[0];
  salvarLead(leadDetalhado);
  fecharModal(document.getElementById('modal-detalhes'));
  renderPipeline();
  atualizarMetricas();
  atualizarAtividadeRecente();
}

// ===== FORMULÁRIO LEAD =====
function initForms() {
  const formLead = document.getElementById('form-lead');
  formLead?.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(formLead);
    const lead = {
      id: leadEditando?.id || 'lead-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      nome: fd.get('nome'),
      nicho: fd.get('nicho'),
      cidade: fd.get('cidade'),
      canal: fd.get('canal'),
      contato: fd.get('contato'),
      valor_proposto: fd.get('valor') || '',
      observacoes: fd.get('observacoes'),
      status: leadEditando?.status || (formLead.querySelector('[name="status"]')?.value) || 'contato',
      data: leadEditando?.data || new Date().toISOString().split('T')[0],
      ultimo_contato: new Date().toISOString().split('T')[0]
    };
    salvarLead(lead);
    fecharModal(document.getElementById('modal-lead'));
    renderPipeline();
    atualizarMetricas();
    atualizarAtividadeRecente();
  });

  const formContrato = document.getElementById('form-contrato');
  formContrato?.addEventListener('submit', e => {
    e.preventDefault();
    gerarContrato(new FormData(formContrato));
  });
}

function salvarLead(lead) {
  const idx = leads.findIndex(l => l.id === lead.id);
  if (idx >= 0) leads[idx] = lead;
  else leads.push(lead);
  salvarPipeline();
}

// ===== CONTRATO =====
function abrirModalContrato() {
  const modal = document.getElementById('modal-contrato');
  const form = document.getElementById('form-contrato');
  form.reset();
  document.getElementById('contrato-gerado').classList.add('hidden');
  modal.classList.remove('hidden');
}

function gerarContrato(fd) {
  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  const contrato = `# Contrato de Prestação de Serviços — Rinear Systems

**CONTRATADA:** Rinear Systems, responsável: [SEU NOME COMPLETO], CPF/CNPJ: [SEU CPF/CNPJ], WhatsApp: (34) 99129-7581.
**CONTRATANTE:** ${fd.get('cliente_nome')}, CPF/CNPJ: ${fd.get('cliente_cpfcnpj')}, responsável: ${fd.get('cliente_responsavel')}, e-mail: ${fd.get('cliente_email')}.

## Cláusula 1ª — Objeto
A CONTRATADA prestará serviços de criação de ${fd.get('tipo_projeto') === 'lp' ? 'Landing Page' : 'Site Institucional'}, pacote **${fd.get('pacote')}**, conforme escopo descrito na proposta comercial aprovada (Anexo I).

## Cláusula 2ª — Preço e pagamento
O valor total é de **R$ ${Number(fd.get('valor_total')).toLocaleString('pt-BR')},00**, pago da seguinte forma: 50% (R$ ${(Number(fd.get('valor_total'))/2).toLocaleString('pt-BR')},00) na assinatura deste contrato e 50% (R$ ${(Number(fd.get('valor_total'))/2).toLocaleString('pt-BR')},00) na entrega final. Pagamento via Pix: **${fd.get('pix_chave')}**. O atraso superior a 10 dias autoriza a suspensão dos trabalhos.

## Cláusula 3ª — Prazo
O prazo estimado é de **${fd.get('prazo')} dias úteis**, contados a partir do recebimento da entrada **e** de todo o material necessário (textos, logotipo, imagens, acessos). Atrasos no envio de material pelo CONTRATANTE prorrogam o prazo na mesma proporção.

## Cláusula 4ª — Revisões
Estão inclusas **2 (duas) rodadas de revisão**. Rodadas adicionais serão orçadas à parte (R$ 147/rodada). Mudanças de escopo geram aditivo contratual.

## Cláusula 5ª — Obrigações da CONTRATADA
Executar os serviços com qualidade, manter o CONTRATANTE informado do andamento e entregar os arquivos/acessos ao final mediante quitação total.

## Cláusula 6ª — Obrigações do CONTRATANTE
Fornecer materiais, informações e aprovações nos prazos combinados; garantir que os conteúdos fornecidos não violam direitos de terceiros.

## Cláusula 7ª — Direitos autorais e portfólio
Após a quitação total, os direitos de uso do site são transferidos ao CONTRATANTE. A CONTRATADA poderá exibir o trabalho em seu portfólio, salvo oposição escrita.

## Cláusula 8ª — Rescisão
Em caso de desistência da CONTRATANTE, os valores já pagos não serão devolvidos, correspondendo ao trabalho executado até então. A CONTRATADA poderá rescindir em caso de inadimplência, mediante aviso de 5 dias.

## Cláusula 9ª — Foro
Fica eleito o foro da comarca de **${fd.get('foro')}** para dirimir controvérsias deste contrato.

${fd.get('foro')}, ${dataFormatada}.

______________________________                    ______________________________
Rinear Systems (Contratada)                                          ${fd.get('cliente_nome')} (Contratante)
`;

  document.getElementById('contrato-texto').textContent = contrato;
  document.getElementById('contrato-gerado').classList.remove('hidden');
  navigator.clipboard.writeText(contrato).then(() => {
    // Feedback visual
    const btn = document.querySelector('#form-contrato button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = '✅ Copiado!';
    setTimeout(() => btn.textContent = original, 2000);
  });
}

// ===== MARKETING / DOCS / AÇÕES (delegação + embeds) — funciona em file:// e Cloudflare Pages =====
const RINEAR = {
  links: {
    site: 'https://github.com/glearflame/rinear-systems-site',
    painel: 'https://github.com/glearflame/rinear-systems-painel',
    wa: 'https://wa.me/5534991297581?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Rinear%20Systems%20e%20gostaria%20de%20falar%20sobre%20um%20projeto'
  },
  docs: {
    'bio-instagram': {
      titulo: 'Bio Instagram — Rinear Systems',
      texto: `Opção 1 (recomendada):
Rinear Systems ✦ Web Studio
Ideias em sistemas reais.
Landing pages & sites institucionais
modernos, rápidos e responsivos.
📲 Peça seu projeto pelo WhatsApp ↓

Opção 2 (editorial):
RINEAR SYSTEMS
Ideias que ganham presença.
✦ Landing Pages de conversão
✦ Sites Institucionais
Seu site pode estar aqui ↓

Informações do perfil:
- Nome de exibição: Rinear Systems | Sites & Landing Pages
- Usuário sugerido: @rinear.systems (verificar disponibilidade)
- Link na bio: https://wa.me/5534991297581?text=Olá!%20Vim%20pelo%20Instagram%20da%20Rinear%20Systems
- Categoria: Serviço de design / Empresa de software
- Destaques sugeridos: Portfólio | Processo | Orçamento | Feedbacks`
    },
    'bio-linkedin': {
      titulo: 'LinkedIn — Página de Empresa',
      texto: `Tagline (até 120 caracteres):
Landing pages e sites institucionais modernos, rápidos e responsivos. Ideias em sistemas reais.

Sobre nós:
A Rinear Systems é um web studio focado em transformar marcas em presença digital real.

Criamos landing pages e sites institucionais modernos, rápidos e responsivos — projetos pensados para empresas e profissionais que entendem que um site não é só um endereço na internet: é a primeira impressão do negócio.

O que fazemos:
✦ Landing Pages — páginas de conversão que conduzem o visitante até a ação
✦ Sites Institucionais — presença digital completa que transmite confiança desde o primeiro clique

Nosso processo:
1. Direção — entendemos sua marca, objetivo e público
2. Construção — design e desenvolvimento em uma experiência responsiva
3. Entrega — revisão, publicação e tudo pronto para usar

📲 Atendimento direto pelo WhatsApp: (34) 99129-7581

Ideias em sistemas reais.

Dados da página:
- Setor: Desenvolvimento de software / Design
- Tamanho: 1–10 funcionários
- Especialidades: Web Design, Landing Pages, Sites Institucionais, UX/UI, Desenvolvimento Web`
    },
    'roteiro': {
      titulo: 'Roteiro de Prospecção — Primeiros Clientes',
      texto: `Quem prospectar (nichos-quente em Uberlândia/região):
1. Clínicas e consultórios (estética, odonto, psicólogos)
2. Profissionais liberais (advogados, contadores, arquitetos, personal trainers)
3. Comércios locais sem site ou com site antigo
4. Infoprodutores e lançamentos (precisam de LP de captura)
5. Eventos locais (LP de inscrição)

Onde encontrar:
- Instagram: buscar nichos + cidade; perfis sem link na bio
- Google Maps: empresas com boas avaliações mas sem site
- Indicações (programa de R$ 150 de crédito)
- Grupos de Facebook/WhatsApp de empreendedores locais

Mensagem de abertura (botão "Copiar Msg. Abertura" copia pronta).

Follow-up:
- D+2: "passando só pra ver se fez sentido pra você 🙂"
- D+5: enviar mockup/exemplo do mesmo nicho
- D+10: última mensagem com prazo da condição de lançamento
- Depois: "frio" e retomar em 60 dias.

Diagnóstico de 3 perguntas:
1. Hoje, quando alguém procura vocês no Google, o que encontra?
2. Vocês recebem pedidos de orçamento pelo Instagram que um site responderia sozinho?
3. Se o site ideal existisse, o que ele precisaria ter?

Metas: 10 contatos/dia × 5 dias · ~20% respondem · 2–3 clientes/mês.`
    },
    'modelo-contrato': {
      titulo: 'Modelo de Contrato de Prestação de Serviços',
      texto: `Uso interno — revisar com advogado antes do primeiro uso.

Cláusulas do modelo padrão:
1ª — Objeto (LP ou Site Institucional, pacote + escopo do Anexo I)
2ª — Preço e pagamento (50% entrada + 50% entrega, Pix)
3ª — Prazo (conta do recebimento da entrada + material completo)
4ª — Revisões (2 rodadas inclusas; extras a R$ 147)
5ª — Obrigações da Contratada (qualidade, informação, entrega após quitação)
6ª — Obrigações do Contratante (materiais no prazo; conteúdo sem violar direitos de terceiros)
7ª — Direitos autorais e portfólio (transferência após quitação; exibição no portfólio salvo oposição)
8ª — Rescisão (valores pagos não devolvidos em desistência; rescisão por inadimplência com aviso de 5 dias)
9ª — Foro (comarca de Uberlândia/MG)

Use a aba Contratos → "Gerar Novo Contrato" para preencher um modelo completo e copiar pronto.`
    }
  },
  copiar: {
    'bio-instagram': 'Rinear Systems ✦ Web Studio\nIdeias em sistemas reais.\nLanding pages & sites institucionais\nmodernos, rápidos e responsivos.\n📲 Peça seu projeto pelo WhatsApp ↓',
    'bio-linkedin': 'Landing pages e sites institucionais modernos, rápidos e responsivos. Ideias em sistemas reais.',
    'abertura': 'Oi, [nome]! Tudo bem? Sou da Rinear Systems, um estúdio aqui da região focado em sites e landing pages.\n\nVi o perfil da [empresa] e achei o trabalho de vocês muito bom — mas percebi que [vocês não têm site / o link da bio leva para X].\n\nEstou selecionando alguns negócios locais para montar meu portfólio de lançamento, com uma condição especial pros primeiros 5 clientes. Posso te mandar uma proposta rapidinha de como ficaria o site da [empresa]? Sem compromisso 🙂',
    'wa': 'https://wa.me/5534991297581?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Rinear%20Systems%20e%20gostaria%20de%20falar%20sobre%20um%20projeto'
  }
};

function feedbackBtn(btn, okText) {
  if (!btn) return;
  const original = btn.textContent;
  btn.textContent = okText;
  setTimeout(() => { btn.textContent = original; }, 2000);
}

function copiarTexto(texto, btn) {
  const done = () => feedbackBtn(btn, '✅ Copiado!');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(texto).then(done).catch(() => copiarFallback(texto, done));
  } else {
    copiarFallback(texto, done);
  }
}
function copiarFallback(texto, done) {
  const ta = document.createElement('textarea');
  ta.value = texto;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(ta);
  done();
}

function abrirDoc(chave) {
  const doc = RINEAR.docs[chave];
  if (!doc) return;
  const modal = document.getElementById('modal-doc');
  document.getElementById('doc-titulo').textContent = doc.titulo;
  document.getElementById('doc-conteudo').textContent = doc.texto;
  modal.dataset.docKey = chave;
  modal.classList.remove('hidden');
}

function initAcoes() {
  // Delegação: qualquer botão com data-action
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const a = btn.dataset.action;
    switch (a) {
      case 'open-site':
        window.open(RINEAR.links.site, '_blank', 'noopener');
        break;
      case 'open-modelo-contrato':
        abrirDoc('modelo-contrato');
        break;
      case 'open-pasta-assinados':
      case 'open-pasta-posts':
        copiarTexto('C:\\Users\\lonw wys\\Documents\\Rinear Systems\\' +
          (a === 'open-pasta-posts' ? '03_Marketing_e_Redes\\planejamento-posts' : '05_Contratos\\assinados\\clientes'), btn);
        break;
      case 'view-doc':
        abrirDoc(btn.dataset.doc);
        break;
      case 'copy-bio':
        copiarTexto(RINEAR.copiar[btn.dataset.bio === 'linkedin' ? 'bio-linkedin' : 'bio-instagram'], btn);
        break;
      case 'copy-abertura':
        copiarTexto(RINEAR.copiar['abertura'], btn);
        break;
      case 'open-csv':
        copiarTexto('C:\\Users\\lonw wys\\Documents\\Rinear Systems\\06_Prospeccao\\pipeline-leads.csv', btn);
        break;
      case 'copy-wa':
        copiarTexto(RINEAR.links.wa, btn);
        break;
      case 'open-logo-ref':
      case 'open-logo-site':
        copiarTexto('C:\\Users\\lonw wys\\Documents\\Rinear Systems\\' +
          (a === 'open-logo-ref' ? '02_Identidade_Visual\\logo-ref.png' : '01_Site\\v2-atual\\logo-ref.png'), btn);
        break;
    }
  });

  // Modal doc viewer
  const modalDoc = document.getElementById('modal-doc');
  modalDoc?.querySelector('.modal-close')?.addEventListener('click', () => fecharModal(modalDoc));
  modalDoc?.querySelector('.modal-backdrop')?.addEventListener('click', () => fecharModal(modalDoc));
  document.getElementById('btn-copiar-doc')?.addEventListener('click', function () {
    const conteudo = document.getElementById('doc-conteudo').textContent;
    copiarTexto(conteudo, this);
  });

  // Copiar contrato gerado
  document.getElementById('btn-copiar-contrato')?.addEventListener('click', function () {
    copiarTexto(document.getElementById('contrato-texto').textContent, this);
  });
}

function formatDataBR(dataStr) {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}