/* ===== PAINEL RINEAR SYSTEMS — JS ===== */

// ===== ESTADO GLOBAL =====
let leads = [];
let leadEditando = null;
let leadDetalhado = null;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initCursorGlow();
  initYear();
  carregarPipeline();
  initModals();
  initKanbanClick();
  initForms();
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

// ===== CARREGAR PIPELINE DO CSV =====
async function carregarPipeline() {
  try {
    // Tentar carregar do arquivo local (via fetch relativo)
    const resp = await fetch('../06_Prospeccao/pipeline-leads.csv');
    if (!resp.ok) throw new Error('CSV não encontrado');
    const texto = await resp.text();
    leads = parseCSV(texto);
    renderPipeline();
    atualizarMetricas();
    atualizarAtividadeRecente();
  } catch (e) {
    console.warn('Não foi possível carregar CSV local, usando localStorage:', e);
    // Fallback: localStorage
    const salvo = localStorage.getItem('rinear-pipeline');
    if (salvo) {
      leads = JSON.parse(salvo);
      renderPipeline();
      atualizarMetricas();
      atualizarAtividadeRecente();
    } else {
      // Dados de exemplo vazios
      leads = [];
      renderPipeline();
      atualizarMetricas();
      atualizarAtividadeRecente();
    }
  }
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
    if (!obj.status) obj.status = 'contato';
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
  } else {
    // Pré-preencher status via hidden field se quiser
  }
  modal.classList.remove('hidden');
  form.nome.focus();
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
  if (lead.contato) addItem('Contato', lead.contato);
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
      status: leadEditando?.status || 'contato',
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

function copiarContrato() {
  const texto = document.getElementById('contrato-texto').textContent;
  navigator.clipboard.writeText(texto);
  const btn = event.target;
  const original = btn.textContent;
  btn.textContent = '✅ Copiado!';
  setTimeout(() => btn.textContent = original, 2000);
}

// ===== MARKETING COPY =====
function abrirArquivo(caminho) {
  // Tenta abrir via protocolo file: (pode não funcionar no browser por segurança)
  // Melhor: copiar o caminho para a área de transferência
  navigator.clipboard.writeText(caminho).then(() => {
    alert(`Caminho copiado: ${caminho}\n\nCole no Explorer (Win+E) ou no terminal para abrir.`);
  });
}

function copiarBio(tipo) {
  const bios = {
    instagram: `Rinear Systems ✦ Web Studio
Ideias em sistemas reais.
Landing pages & sites institucionais
modernos, rápidos e responsivos.
📲 Peça seu projeto pelo WhatsApp ↓`,
    linkedin: `Landing pages e sites institucionais modernos, rápidos e responsivos. Ideias em sistemas reais.`
  };
  navigator.clipboard.writeText(bios[tipo]).then(() => {
    const btn = event.target;
    const original = btn.textContent;
    btn.textContent = '✅ Copiado!';
    setTimeout(() => btn.textContent = original, 2000);
  });
}

function copiarMensagemAbertura() {
  const msg = `Oi, [nome]! Tudo bem? Sou da Rinear Systems, um estúdio aqui da região focado em sites e landing pages.

Vi o perfil da [empresa] e achei o trabalho de vocês muito bom — mas percebi que [vocês não têm site / o link da bio leva para X].

Estou selecionando alguns negócios locais para montar meu portfólio de lançamento, com uma **condição especial pros primeiros 5 clientes**. Posso te mandar uma proposta rapidinha de como ficaria o site da [empresa]? Sem compromisso 🙂`;
  navigator.clipboard.writeText(msg).then(() => {
    const btn = event.target;
    const original = btn.textContent;
    btn.textContent = '✅ Copiado!';
    setTimeout(() => btn.textContent = original, 2000);
  });
}

function copiarWhatsApp() {
  const link = 'https://wa.me/5534991297581?text=Olá!%20Vim%20pelo%20site%20da%20Rinear%20Systems%20e%20gostaria%20de%20falar%20sobre%20um%20projeto';
  navigator.clipboard.writeText(link).then(() => {
    const btn = event.target;
    const original = btn.textContent;
    btn.textContent = '✅ Copiado!';
    setTimeout(() => btn.textContent = original, 2000);
  });
}

// ===== UTILITÁRIOS =====
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function formatDataBR(dataStr) {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}