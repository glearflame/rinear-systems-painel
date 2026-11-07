// ============================================
// PEDIDOS + GERADOR DE CARDÁPIO PÚBLICO
// ============================================

let qriousLoaded = false;

async function renderPedidos() {
  await carregarEstadoSupabase();
  const rid = state.restauranteAtivo;
  const rest = state.restaurantes.find(r => String(r.id) === String(rid));

  const html = `
  <div class="page active" id="page-pedidos">
    <div class="page-head">
      <div>
        <h1>Pedidos</h1>
        <p>${rest ? rest.nome : 'Selecione um restaurante'} — fluxo de status dos pedidos.</p>
      </div>
    </div>
    ${rid ? `
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
    </div>` : `
    <div class="card empty-state">
      <h3>Selecione um restaurante</h3>
      <p>Escolha um restaurante no Cardápio (ou defina o ativo) para ver os pedidos e gerar o QR.</p>
    </div>`}
  </div>`;

  document.getElementById('main').innerHTML = html;

  if (rid) {
    const link = 'https://rinear-systems-site.glear-games-mk.workers.dev/cardapio.html?id=' + rid;
    const linkInput = document.getElementById('linkPublico');
    if (linkInput) linkInput.value = link;
    renderQR(rid);
  }
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

async function renderQR(rid) {
  const el = document.getElementById('qrcode');
  if (!el) return;
  el.innerHTML = '<div style="color:#666;font-size:12px">Carregando QR Code...</div>';
  const loaded = await loadQRious();
  if (loaded && window.QRious) {
    try {
      el.innerHTML = '';
      const canvas = document.createElement('canvas');
      el.appendChild(canvas);
      new QRious({
        element: canvas,
        value: 'https://rinear-systems-site.glear-games-mk.workers.dev/cardapio.html?id=' + rid,
        size: 180,
        background: '#ffffff',
        foreground: '#071d22'
      });
    } catch (e) {
      el.innerHTML = '<div style="color:#666;font-size:12px">Erro ao gerar QR Code</div>';
      console.error(e);
    }
  } else {
    el.innerHTML = '<div style="color:#666;font-size:12px">QR Code indisponível</div>';
  }
}

function copiarLink() {
  const inp = document.getElementById('linkPublico');
  if (!inp) return;
  inp.select();
  try {
    document.execCommand('copy');
    toast('Link copiado.');
  } catch {
    navigator.clipboard?.writeText(inp.value).then(() => toast('Link copiado.'));
  }
}

function abrirCardapioPublico() {
  const rid = state.restauranteAtivo;
  if (!rid) return;
  window.open('https://rinear-systems-site.glear-games-mk.workers.dev/cardapio.html?id=' + rid, '_blank');
}

function imprimirQR() {
  window.print();
  toast('Imprima o QR Code para colar no balcão/mesa.');
}

function renderListaPedidos() {
  const rid = state.restauranteAtivo;
  if (!rid) return '<div class="empty-state" style="padding:16px">Selecione um restaurante primeiro.</div>';
  const peds = state.pedidos
    .filter(p => String(p.restauranteId) === String(rid))
    .slice(0, 15);
  if (!peds.length) return '<div class="empty-state" style="padding:16px">Nenhum pedido ainda.</div>';
  return peds.map(p => {
    const dataStr = p.data || p.created_at;
    const dataFmt = dataStr ? new Date(dataStr).toLocaleString('pt-BR') : '-';
    return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--bg);flex-wrap:wrap;gap:8px">
      <div>
        <strong>#${String(p.id).slice(0, 8)}</strong> — ${p.cliente || 'Cliente'}
        <div style="font-size:12px;color:var(--muted)">${dataFmt} • R$ ${parseFloat(p.total || 0).toFixed(2)}</div>
      </div>
      <select onchange="mudarStatusPedido('${p.id}', this.value)" style="padding:6px 10px;background:var(--bg-sec);border:1px solid var(--border);color:var(--ink);border-radius:6px;font-size:12px">
        <option value="recebido" ${p.status === 'recebido' ? 'selected' : ''}>Recebido</option>
        <option value="em preparo" ${p.status === 'em preparo' ? 'selected' : ''}>Em preparo</option>
        <option value="saiu entrega" ${p.status === 'saiu entrega' ? 'selected' : ''}>Saiu para entrega</option>
        <option value="pronto retirada" ${p.status === 'pronto retirada' ? 'selected' : ''}>Pronto para retirada</option>
        <option value="concluido" ${p.status === 'concluido' ? 'selected' : ''}>Concluído</option>
        <option value="cancelado" ${p.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
      </select>
    </div>`;
  }).join('');
}

async function mudarStatusPedido(id, novo) {
  try {
    await window.dbUpdate('pedidos', id, { status: novo });
    await carregarEstadoSupabase(true);
    toast('Pedido atualizado → ' + novo);
    renderPedidos();
  } catch (e) {
    toast('Erro ao atualizar pedido.');
    console.error(e);
  }
}

window.novoPedidoPublico = async function (rid, itens, total, cliente, forma, endereco, obs) {
  try {
    await window.dbInsert('pedidos', {
      restaurante_id: rid,
      cliente,
      forma,
      endereco,
      observacoes: obs,
      itens,
      total,
      status: 'recebido'
    });
    await carregarEstadoSupabase(true);
    toast('Pedido recebido!');
  } catch (e) {
    toast('Erro ao registrar pedido.');
    console.error(e);
  }
};

window.renderPedidos = renderPedidos;
window.mudarStatusPedido = mudarStatusPedido;
window.copiarLink = copiarLink;
window.abrirCardapioPublico = abrirCardapioPublico;
window.imprimirQR = imprimirQR;
