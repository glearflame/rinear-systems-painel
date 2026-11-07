// ============================================
// PEDIDOS + GERADOR DE CARDÁPIO PÚBLICO
// Prioridade 3 e 4
// ============================================

let qriousLoaded = false;

async function renderPedidos(){
  await carregarEstadoSupabase();
  const rid = state.restauranteAtivo;
  const rest = state.restaurantes.find(r=>r.id===rid);
  const html = `
  <div class="page active" id="page-pedidos">
    <div class="page-head">
      <div>
        <h1>Pedidos</h1>
        <p>${rest?rest.nome:'Selecione um restaurante'} — fluxo de status dos pedidos.</p>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <h3>Gerar cardápio público (preview)</h3>
        <p style="color:var(--muted);font-size:13px;margin-bottom:12px">Link e QR Code para o restaurante selecionado.</p>
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
          <input id="linkPublico" type="text" value="" placeholder="Link do cardápio" style="flex:1;min-width:200px;padding:10px 12px;background:var(--bg);border:1px solid var(--border);color:var(--ink);border-radius:8px" readonly>
          <button class="btn btn-sm btn-ghost" onclick="copiarLink()">Copiar</button>
        </div>
        <div id="qrcode" style="display:inline-block;padding:14px;background:#fff;border-radius:8px"></div>
        <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="abrirCardapioPublico()">Abrir cardápio público</button>
          <button class="btn btn-ghost" onclick="imprimirQR()">Imprimir QR Code</button>
        </div>
      </div>
      <div class="card">
        <h3>Pedidos recentes</h3>
        <div id="listaPedidos" style="display:flex;flex-direction:column;gap:8px">
          ${renderListaPedidos()}
        </div>
      </div>
    </div>
  </div>`;
  document.getElementById('main').innerHTML = html;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-pedidos').classList.add('active');
  const link = 'https://rinear-systems-site.glear-games-mk.workers.dev/cardapio.html?id=' + rid;
  const linkInput = document.getElementById('linkPublico');
  if (linkInput) linkInput.value = link;
  renderQR(rid);
}

async function loadQRious() {
  if (qriousLoaded) return true;
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
    script.onload = () => { qriousLoaded = true; resolve(true); };
    script.onerror = () => { console.error('Falha ao carregar QRious'); resolve(false); };
    document.head.appendChild(script);
  });
}

async function renderQR(rid){
  const el = document.getElementById('qrcode');
  if (!el) return;
  el.innerHTML = '<div style="color:var(--muted);font-size:12px">Carregando QR Code...</div>';
  const loaded = await loadQRious();
  if (loaded && window.QRious) {
    try {
      new QRious({
        element: el,
        value: 'https://rinear-systems-site.glear-games-mk.workers.dev/cardapio.html?id='+rid,
        size: 180,
        background: '#ffffff',
        foreground: '#071d22'
      });
    } catch (e) {
      el.innerHTML = '<div style="color:var(--muted);font-size:12px">Erro ao gerar QR Code</div>';
      console.error(e);
    }
  } else {
    el.innerHTML = '<div style="color:var(--muted);font-size:12px">QR Code indisponível (biblioteca não carregou)</div>';
  }
}

function copiarLink(){
  const inp = document.getElementById('linkPublico');
  if (!inp) return;
  inp.select(); 
  document.execCommand('copy'); 
  toast('Link copiado.');
}
function abrirCardapioPublico(){
  const rid = state.restauranteAtivo;
  window.open('https://rinear-systems-site.glear-games-mk.workers.dev/cardapio.html?id='+rid,'_blank');
}
function imprimirQR(){ window.print(); toast('Imprima o QR Code para colar no balcão/mesa.'); }

function renderListaPedidos(){
  const rid = state.restauranteAtivo;
  const peds = state.pedidos.filter(p=>p.restauranteId===rid).slice(-10).reverse();
  if(!peds.length) return '<div class="empty-state" style="padding:16px">Nenhum pedido ainda.</div>';
  return peds.map(p=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--bg);flex-wrap:wrap;gap:8px">
      <div>
        <strong>#${p.id}</strong> — ${p.cliente||'Cliente'}
        <div style="font-size:12px;color:var(--muted)">${new Date(p.data).toLocaleString('pt-BR')} • R$ ${parseFloat(p.total||0).toFixed(2)}</div>
      </div>
      <select onchange="mudarStatusPedido('${p.id}',this.value)" style="padding:6px 10px;background:var(--bg-sec);border:1px solid var(--border);color:var(--ink);border-radius:6px;font-size:12px">
        <option value="recebido" ${p.status==='recebido'?'selected':''}>Recebido</option>
        <option value="em preparo" ${p.status==='em preparo'?'selected':''}>Em preparo</option>
        <option value="saiu entrega" ${p.status==='saiu entrega'?'selected':''}>Saiu para entrega</option>
        <option value="pronto retirada" ${p.status==='pronto retirada'?'selected':''}>Pronto para retirada</option>
        <option value="concluido" ${p.status==='concluido'?'selected':''}>Concluído</option>
        <option value="cancelado" ${p.status==='cancelado'?'selected':''}>Cancelado</option>
      </select>
    </div>`).join('');
}
async function mudarStatusPedido(id,novo){
  try {
    await window.dbUpdate('pedidos', id, { status: novo });
    await carregarEstadoSupabase();
    toast('Pedido #' + id + ' → ' + novo);
    renderPedidos();
  } catch(e){ toast('Erro ao atualizar pedido.'); console.error(e); }
}

// ---------- Novo pedido a partir do cardápio público ----------
window.novoPedidoPublico = async function(rid, itens, total, cliente, forma, endereco, obs){
  try {
    await window.dbInsert('pedidos', {
      restaurante_id: rid, cliente, forma, endereco, observacoes: obs,
      itens, total, status: 'recebido'
    });
    await carregarEstadoSupabase();
    toast('Pedido recebido!');
  } catch(e){ toast('Erro ao registrar pedido.'); console.error(e); }
};

window.renderPedidos = renderPedidos;