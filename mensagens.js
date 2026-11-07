// ============================================
// MENSAGENS WHATSAPP AUTOMÁTICAS
// ============================================

const MODELOS_PADRAO = [
  { nome: 'Boas-vindas', texto: 'Olá! Bem-vindo(a) ao {{nome_restaurante}}. Aqui você confere nosso cardápio e faz seu pedido rapidinho. {{link_cardapio}}' },
  { nome: 'Horário de funcionamento', texto: 'Nosso horário de funcionamento é: {{horario}}. Estamos te esperando! {{link_cardapio}}' },
  { nome: 'Cardápio', texto: 'Aqui está nosso cardápio completo: {{link_cardapio}}. Qualquer dúvida, é só chamar.' },
  { nome: 'Pedido recebido', texto: 'Oi {{cliente}}! Recebemos seu pedido #{{numero}} e já estamos preparando com carinho. Em breve enviamos atualizações.' },
  { nome: 'Pedido em preparo', texto: 'Seu pedido #{{numero}} está em preparo. Já vai ficar pronto! 🍽️' },
  { nome: 'Pedido saiu para entrega', texto: 'Seu pedido #{{numero}} saiu para entrega. Fique atento(a) ao entregador. 🛵' },
  { nome: 'Pedido pronto para retirada', texto: 'Seu pedido #{{numero}} está pronto para retirada aqui no {{nome_restaurante}}. Te esperamos!' },
  { nome: 'Follow-up de cliente', texto: 'Oi {{cliente}}! Tudo bem com o seu último pedido? Aqui está nosso cardápio para quando quiser pedir novamente: {{link_cardapio}}' },
  { nome: 'Promoção', texto: '🔥 Promoção especial no {{nome_restaurante}}: {{detalhe}}. Confira: {{link_cardapio}}' }
];

async function renderMensagens() {
  await carregarEstadoSupabase();
  const rid = state.restauranteAtivo;
  const rest = state.restaurantes.find(r => String(r.id) === String(rid));

  if (!rid) {
    document.getElementById('main').innerHTML = `
    <div class="page active" id="page-mensagens">
      <div class="page-head">
        <div>
          <h1>Mensagens WhatsApp</h1>
          <p>Selecione um restaurante — modelos editáveis de envio automático.</p>
        </div>
      </div>
      <div class="card empty-state">
        <h3>Selecione um restaurante</h3>
        <p>Escolha um restaurante no Cardápio para gerenciar modelos de mensagem.</p>
      </div>
    </div>`;
    return;
  }

  const html = `
  <div class="page active" id="page-mensagens">
    <div class="page-head">
      <div>
        <h1>Mensagens WhatsApp</h1>
        <p>${rest ? rest.nome : 'Restaurante'} — modelos editáveis de envio automático.</p>
      </div>
    </div>
    <div class="card">
      <h3>Modelos</h3>
      <div id="listaModelos" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px"></div>
    </div>
    <div class="card" style="margin-top:20px">
      <h3>Criar novo modelo</h3>
      <form id="formMsg" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">
        <div class="field"><label>Nome do modelo</label><input name="nome" required></div>
        <div class="field full"><label>Texto (use {{nome_restaurante}}, {{link_cardapio}}, {{cliente}}, {{numero}}, {{horario}})</label>
          <textarea name="texto" rows="3" required></textarea>
        </div>
        <div class="actions" style="grid-column:1/-1">
          <button type="submit" class="btn btn-primary">Salvar modelo</button>
        </div>
      </form>
    </div>
  </div>`;

  document.getElementById('main').innerHTML = html;
  renderListaModelos();

  const form = document.getElementById('formMsg');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const d = Object.fromEntries(fd);
      try {
        await window.dbInsert('mensagens', {
          restaurante_id: rid,
          nome: d.nome,
          texto: d.texto
        });
        await carregarEstadoSupabase(true);
        renderMensagens();
        toast('Modelo salvo.');
      } catch (err) {
        toast('Erro ao salvar modelo.');
        console.error(err);
      }
    };
  }
}

function renderListaModelos() {
  const rid = state.restauranteAtivo;
  const el = document.getElementById('listaModelos');
  if (!rid || !el) return;

  const msgs = state.mensagens.filter(m => String(m.restauranteId) === String(rid));
  const todos = [
    ...MODELOS_PADRAO.map(m => ({ ...m, padrao: true })),
    ...msgs
  ];

  el.innerHTML = todos.map(m => {
    const minha = msgs.find(x => x.nome === m.nome);
    return `
    <div class="card" style="padding:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong style="font-size:13px">${m.nome}</strong>
        ${minha ? `<button class="btn-icon" onclick="enviarModelo('${minha.id}')" title="Copiar para WhatsApp">▶</button>` : ''}
      </div>
      <p style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:10px">${m.texto}</p>
      <div class="row-actions">
        ${minha
          ? `<button class="btn btn-sm btn-ghost" onclick="editarModelo('${minha.id}')">Editar</button>
             <button class="btn btn-sm btn-ghost" onclick="excluirModelo('${minha.id}')" style="color:#ef4444">Excluir</button>`
          : `<button class="btn btn-sm btn-ghost" onclick="salvarModeloPadrao('${encodeURIComponent(m.nome)}','${encodeURIComponent(m.texto)}')">Salvar cópia</button>`}
      </div>
    </div>`;
  }).join('');
}

async function salvarModeloPadrao(nomeEnc, textoEnc) {
  const rid = state.restauranteAtivo;
  if (!rid) return;
  try {
    await window.dbInsert('mensagens', {
      restaurante_id: rid,
      nome: decodeURIComponent(nomeEnc),
      texto: decodeURIComponent(textoEnc)
    });
    await carregarEstadoSupabase(true);
    renderMensagens();
    toast('Modelo salvo.');
  } catch (e) {
    toast('Erro ao salvar.');
    console.error(e);
  }
}

function enviarModelo(id) {
  const m = state.mensagens.find(x => String(x.id) === String(id));
  if (!m) return;
  const rest = state.restaurantes.find(r => String(r.id) === String(state.restauranteAtivo));
  const link = 'https://rinear-systems-site.glear-games-mk.workers.dev/cardapio.html?id=' + state.restauranteAtivo;
  let texto = m.texto
    .replace(/\{\{nome_restaurante\}\}/g, rest ? rest.nome : '')
    .replace(/\{\{link_cardapio\}\}/g, link)
    .replace(/\{\{cliente\}\}/g, '')
    .replace(/\{\{numero\}\}/g, '')
    .replace(/\{\{horario\}\}/g, '')
    .replace(/\{\{detalhe\}\}/g, '');
  const wa = rest && rest.whatsapp ? rest.whatsapp.replace(/\D/g, '') : '';
  const url = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
}

async function editarModelo(id) {
  const m = state.mensagens.find(x => String(x.id) === String(id));
  if (!m) return;
  const novoTexto = prompt('Editar texto do modelo:', m.texto);
  if (novoTexto === null) return;
  try {
    await window.dbUpdate('mensagens', id, { texto: novoTexto });
    await carregarEstadoSupabase(true);
    renderMensagens();
    toast('Modelo atualizado.');
  } catch (e) {
    toast('Erro ao atualizar.');
    console.error(e);
  }
}

async function excluirModelo(id) {
  if (!confirm('Excluir este modelo?')) return;
  try {
    await window.dbDelete('mensagens', id);
    await carregarEstadoSupabase(true);
    renderMensagens();
    toast('Modelo excluído.');
  } catch (e) {
    toast('Erro ao excluir.');
    console.error(e);
  }
}

window.renderMensagens = renderMensagens;
window.salvarModeloPadrao = salvarModeloPadrao;
window.enviarModelo = enviarModelo;
window.editarModelo = editarModelo;
window.excluirModelo = excluirModelo;
