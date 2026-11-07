// ============================================
// MENSAGENS WHATSAPP AUTOMÁTICAS
// Prioridade 5
// ============================================

const MODELOS_PADRAO = [
  {nome:'Boas-vindas',texto:'Olá! Bem-vindo(a) ao {{nome_restaurante}}. Aqui você confere nosso cardápio e faz seu pedido rapidinho. {{link_cardapio}}'},
  {nome:'Horário de funcionamento',texto:'Nosso horário de funcionamento é: {{horario}}. Estamos te esperando! {{link_cardapio}}'},
  {nome:'Cardápio',texto:'Aqui está nosso cardápio completo: {{link_cardapio}}. Qualquer dúvida, é só chamar.'},
  {nome:'Pedido recebido',texto:'Oi {{cliente}}! Recebemos seu pedido #{{numero}} e já estamos preparando com carinho. Em breve enviamos atualizações.'},
  {nome:'Pedido em preparo',texto:'Seu pedido #{{numero}} está em preparo. Já vai ficar pronto! 🍽️'},
  {nome:'Pedido saiu para entrega',texto:'Seu pedido #{{numero}} saiu para entrega. Fique atento(a) ao entregador. 🛵'},
  {nome:'Pedido pronto para retirada',texto:'Seu pedido #{{numero}} está pronto para retirada aqui no {{nome_restaurante}}. Te esperamos!'},
  {nome:'Follow-up de cliente',texto:'Oi {{cliente}}! Tudo bem com o seu último pedido? Aqui está nosso cardápio para quando quiser pedir novamente: {{link_cardapio}}'},
  {nome:'Promoção',texto:'🔥 Promoção especial no {{nome_restaurante}}: {{detalhe}}. Confira: {{link_cardapio}}'}
];

async function renderMensagens(){
  await carregarEstadoSupabase();
  const rid = state.restauranteAtivo;
  const rest = state.restaurantes.find(r=>r.id===rid);
  const msgs = state.mensagens.filter(m=>m.restauranteId===rid);
  const html = `
  <div class="page active" id="page-mensagens">
    <div class="page-head">
      <div>
        <h1>Mensagens WhatsApp</h1>
        <p>${rest?rest.nome:'Selecione um restaurante'} — modelos editáveis de envio automático.</p>
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
        <div class="field full"><label>Texto (use {{nome_restaurante}}, {{link_cardapio}}, {{cliente}}, {{numero}}, {{horario}})</label><textarea name="texto" rows="3" required></textarea></div>
        <div class="actions" style="grid-column:1/-1">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar modelo</button>
        </div>
      </form>
    </div>
  </div>`;
  document.getElementById('main').innerHTML = html;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-mensagens').classList.add('active');
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
        await carregarEstadoSupabase();
        closeModal(); renderMensagens(); toast('Modelo salvo.');
      } catch(err){ toast('Erro ao salvar modelo.'); console.error(err); }
    };
  }
}

function renderListaModelos(){
  const rid = state.restauranteAtivo;
  const msgs = state.mensagens.filter(m=>m.restauranteId===rid);
  const todos = [...MODELOS_PADRAO.map(m=>({...m,padrao:true})), ...msgs];
  const el = document.getElementById('listaModelos');
  if (!el) return;
  el.innerHTML = todos.map(m=>{
    const minha = msgs.find(x=>x.nome===m.nome);
    return `
    <div class="card" style="padding:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong style="font-size:13px">${m.nome}</strong>
        ${minha?`<button class="btn-icon" onclick="enviarModelo('${minha.id}')" title="Enviar">▶</button>`:''}
      </div>
      <div style="font-size:12px;color:var(--muted);line-height:1.5">${m.texto}</div>
      ${!minha?`<div style="margin-top:8px"><button class="btn btn-sm btn-ghost" onclick="clonarModelo('${m.nome}','${m.texto.replace(/'/g, "\\'")}')">Usar como base</button></div>`:''}
    </div>`;
  }).join('');
}
function clonarModelo(nome,texto){
  document.getElementById('modal').innerHTML = `
  <div class="modal open">
    <div class="panel">
      <button class="close" onclick="closeModal()">✕</button>
      <h3>Usar modelo: ${nome}</h3>
      <form id="formClone">
        <div class="field"><label>Nome</label><input name="nome" value="${nome} cópia" required></div>
        <div class="field full"><label>Texto</label><textarea name="texto" rows="4" required>${texto}</textarea></div>
        <div class="actions">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    </div>
  </div>`;
  document.getElementById('modal').classList.add('open');
  const form = document.getElementById('formClone');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const d = Object.fromEntries(fd);
      try {
        await window.dbInsert('mensagens', {
          restaurante_id: state.restauranteAtivo,
          nome: d.nome,
          texto: d.texto
        });
        await carregarEstadoSupabase();
        closeModal(); renderMensagens(); toast('Modelo criado.');
      } catch(err){ toast('Erro ao criar modelo.'); console.error(err); }
    };
  }
}
function enviarModelo(id){
  const m = state.mensagens.find(x=>x.id===id);
  if(!m) return;
  const rid = state.restauranteAtivo;
  const rest = state.restaurantes.find(r=>r.id===rid);
  let texto = m.texto
    .replace(/{{nome_restaurante}}/g, rest?rest.nome:'')
    .replace(/{{link_cardapio}}/g, 'https://rinear-systems-site.glear-games-mk.workers.dev/cardapio.html?id='+rid)
    .replace(/{{horario}}/g, 'consulte o estabelecimento');
  location.href = 'https://wa.me/' + (rest?rest.whatsapp:'') + '?text=' + encodeURIComponent(texto);
  toast('Abrindo WhatsApp com o modelo: ' + m.nome);
}

window.renderMensagens = renderMensagens;