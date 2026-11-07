// ============================================
// GESTOR DE CARDÁPIO - Rinear Systems Painel
// Prioridade 2
// ============================================

function renderCardapio(){
  const rest = state.restaurantes;
  if (!rest.length) {
    document.getElementById('main').innerHTML = `
    <div class="page active" id="page-cardapio">
      <div class="page-head">
        <h1>Gestor de Cardápio</h1>
        <p>Categorias, produtos, adicionais e variações por restaurante.</p>
      </div>
      <div class="card empty-state"><h3>Nenhum restaurante</h3><p>Cadastre um restaurante primeiro.</p></div>
    </div>`;
    return;
  }
  const restSelect = rest.map(r=>`<option value="${r.id}">${r.nome}</option>`).join('');
  const html = `
  <div class="page active" id="page-cardapio">
    <div class="page-head">
      <div>
        <h1>Gestor de Cardápio</h1>
        <p>Categorias, produtos, adicionais e variações por restaurante.</p>
      </div>
      <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">
        <select id="restCardapio" style="width:260px;padding:10px 12px;background:var(--bg);border:1px solid var(--border);color:var(--ink);border-radius:8px">${restSelect}</select>
        <button class="btn btn-primary" onclick="novaCategoria()">+ Nova categoria</button>
        <button class="btn btn-primary" onclick="novoProduto()">+ Novo produto</button>
      </div>
    </div>

    <!-- Categorias -->
    <div class="card" style="margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3>Categorias</h3>
      </div>
      <div id="listaCategorias" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px"></div>
    </div>

    <!-- Produtos -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
        <h3>Produtos</h3>
        <div style="display:flex;gap:8px;align-items:center">
          <label style="font-size:12px;color:var(--muted)">Filtrar por categoria:</label>
          <select id="filtroCategoria" style="padding:8px 12px;background:var(--bg);border:1px solid var(--border);color:var(--ink);border-radius:8px">
            <option value="">Todas</option>
          </select>
          <button class="btn btn-sm btn-ghost" onclick="filtrarProdutos()">Aplicar</button>
        </div>
      </div>
      <div id="listaProdutos" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px"></div>
    </div>
  </div>`;
  document.getElementById('main').innerHTML = html;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-cardapio').classList.add('active');
  
  // Selecionar restaurante ativo ou o primeiro
  const selectEl = document.getElementById('restCardapio');
  if (state.restauranteAtivo) {
    selectEl.value = state.restauranteAtivo;
  } else if (rest[0]) {
    state.restauranteAtivo = rest[0].id;
    selectEl.value = rest[0].id;
  }
  selectEl.onchange = (e)=>{ state.restauranteAtivo = parseInt(e.target.value); renderCardapio(); };
  
  renderCategorias();
  renderFiltroCategorias();
  renderProdutos();
}

function renderFiltroCategorias() {
  const rid = state.restauranteAtivo;
  const select = document.getElementById('filtroCategoria');
  if (!rid || !select) {
    if (select) select.innerHTML = '<option value="">Selecione um restaurante</option>';
    return;
  }
  const cats = state.categorias.filter(c=>c.restauranteId===rid);
  select.innerHTML = '<option value="">Todas</option>' + cats.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
}

function renderCategorias(){
  const rid = state.restauranteAtivo;
  const el = document.getElementById('listaCategorias');
  if (!rid || !el) {
    if (el) el.innerHTML = '<div class="empty-state"><p>Selecione um restaurante primeiro.</p></div>';
    return;
  }
  const cats = state.categorias.filter(c=>c.restauranteId===rid);
  if(!cats.length){ el.innerHTML='<div class="empty-state"><p>Nenhuma categoria ainda.</p></div>'; return; }
  el.innerHTML = cats.map(c=>`
    <div class="card" style="padding:14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><strong style="font-size:14px">${c.nome}</strong><br><small style="color:var(--muted)">Ordem: ${c.ordem||0}</small></div>
        <div class="row-actions">
          <button class="btn-icon" onclick="editarCategoria('${c.id}')">✏️</button>
          <button class="btn-icon" style="color:var(--muted)" onclick="excluirCategoria('${c.id}')">🗑️</button>
        </div>
      </div>
    </div>`).join('');
}

function renderProdutos(){
  const rid = state.restauranteAtivo;
  const el = document.getElementById('listaProdutos');
  if (!rid || !el) {
    if (el) el.innerHTML = '<div class="empty-state"><p>Selecione um restaurante primeiro.</p></div>';
    return;
  }
  const catFiltro = document.getElementById('filtroCategoria')?.value;
  let prods = state.produtos.filter(p=>p.restauranteId===rid);
  if (catFiltro) prods = prods.filter(p=>p.categoriaId === catFiltro);
  if(!prods.length){ el.innerHTML='<div class="empty-state"><p>Nenhum produto cadastrado para este restaurante/categoria.</p></div>'; return; }
  el.innerHTML = prods.map(p=>`
    <div class="card" style="padding:14px;display:flex;gap:12px;align-items:center">
      <img src="${p.foto||'https://via.placeholder.com/80x80?text=Sem+foto'}" style="width:64px;height:64px;object-fit:cover;border-radius:8px" onerror="this.src='https://via.placeholder.com/80x80?text=Sem+foto'">
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:center"><strong>${p.nome}</strong><span class="badge bg-${p.disponivel==='nao'?'bg-perdido':'bg-producao'}">${p.disponivel==='nao'?'Esgotado':'Disponível'}</span></div>
        <div style="color:var(--muted);font-size:12px">${p.categoria||'-'} • ${p.descricao?p.descricao.slice(0,40):''}</div>
        <div style="font-weight:700;margin-top:4px">R$ ${parseFloat(p.preco||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
      </div>
      <div class="row-actions">
        <button class="btn-icon" onclick="editarProduto('${p.id}')">✏️</button>
        <button class="btn-icon" style="color:var(--muted)" onclick="excluirProduto('${p.id}')">🗑️</button>
      </div>
    </div>`).join('');
}

// ---------- Categorias ----------
async function novaCategoria(){
  const nome = prompt('Nome da categoria (ex: Hambúrgueres, Bebidas, Sobremesas):');
  if(!nome) return;
  const rid = state.restauranteAtivo;
  if(!rid){ toast('Selecione um restaurante primeiro.'); return; }
  try {
    const ordem = (state.categorias.filter(c=>c.restauranteId===rid).length||0)+1;
    await window.dbInsert('categorias', { restaurante_id: rid, nome, ordem });
    await carregarEstadoSupabase();
    renderCardapio(); toast('Categoria criada.');
  } catch(e){ toast('Erro ao criar categoria.'); console.error(e); }
}
async function editarCategoria(id){
  const c = state.categorias.find(x=>x.id===id);
  if(!c) return;
  const novo = prompt('Novo nome da categoria:', c.nome);
  if(novo===null) return;
  try {
    await window.dbUpdate('categorias', id, { nome: novo });
    await carregarEstadoSupabase();
    renderCardapio(); toast('Categoria atualizada.');
  } catch(e){ toast('Erro ao atualizar categoria.'); console.error(e); }
}
async function excluirCategoria(id){
  if(!confirm('Excluir categoria? Produtos dela ficarão sem categoria.')) return;
  try {
    await window.dbDelete('categorias', id);
    await carregarEstadoSupabase();
    renderCardapio(); toast('Categoria excluída.');
  } catch(e){ toast('Erro ao excluir categoria.'); console.error(e); }
}

// ---------- Produtos ----------
function novoProduto(){
  const rid = state.restauranteAtivo;
  if(!rid){ toast('Selecione um restaurante primeiro.'); return; }
  const cats = state.categorias.filter(c=>c.restauranteId===rid);
  const catOpts = cats.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
  document.getElementById('modal').innerHTML = `
  <div class="modal open">
    <div class="panel" style="max-width:640px">
      <button class="close" onclick="closeModal()">✕</button>
      <h3>Novo produto</h3>
      <form id="formProduto">
        <div class="grid-2">
          <div class="field"><label>Nome <span style="color:#ef4444">*</span></label><input name="nome" required></div>
          <div class="field"><label>Categoria</label><select name="categoriaId">${catOpts}</select></div>
          <div class="field"><label>Preço (R$) <span style="color:#ef4444">*</span></label><input type="number" name="preco" step="0.01" required></div>
          <div class="field"><label>Foto (URL)</label><input name="foto" value="https://via.placeholder.com/300x300"></div>
        </div>
        <div class="field full"><label>Descrição</label><textarea name="descricao" rows="2"></textarea></div>
        <div class="grid-2">
          <div class="field"><label>Adicionais (ex: bacon, queijo extra)</label><input name="adicionais"></div>
          <div class="field"><label>Tamanhos/Variações (ex: P, M, G)</label><input name="tamanhos"></div>
        </div>
        <div class="field full"><label>Horário de funcionamento</label><input name="horario"></div>
        <div class="grid-2">
          <div class="field"><label>Taxa de entrega</label><input type="number" name="taxaEntrega" step="0.01" value="0"></div>
          <div class="field"><label>Área de entrega</label><input name="areaEntrega"></div>
        </div>
        <div class="field full"><label>Formas de pagamento</label><input name="pagamento" placeholder="Pix, cartão, dinheiro"></div>
        <div class="field"><label>Disponibilidade</label><select name="disponivel"><option value="sim">Disponível</option><option value="nao">Esgotado</option></select></div>
        <div class="field"><label>Ordem de exibição</label><input type="number" name="ordem" value="0"></div>
        <div class="field"><label>Promoção</label><input name="promocao" placeholder="Desconto ou preço promocional"></div>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar produto</button>
      </div>
    </div>
  </div>`;
  document.getElementById('modal').classList.add('open');
  document.getElementById('formProduto').onsubmit=async(e)=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    const d=Object.fromEntries(fd);
    d.disponivel = d.disponivel==='nao'?'nao':'sim';
    const cat = state.categorias.find(c=>c.id===d.categoriaId);
    const registro = {
      restaurante_id: rid,
      categoria_id: d.categoriaId || null,
      categoria: cat?cat.nome:'',
      nome: d.nome,
      descricao: d.descricao,
      preco: parseFloat(d.preco)||0,
      foto: d.foto,
      adicionais: d.adicionais,
      tamanhos: d.tamanhos,
      disponivel: d.disponivel,
      ordem: parseInt(d.ordem)||0,
      promocao: d.promocao,
      horario: d.horario,
      taxa_entrega: parseFloat(d.taxaEntrega)||0,
      area_entrega: d.areaEntrega,
      pagamento: d.pagamento
    };
    try {
      await window.dbInsert('produtos', registro);
      await carregarEstadoSupabase();
      closeModal(); renderProdutos(); toast('Produto criado.');
    } catch(err){ toast('Erro ao criar produto.'); console.error(err); }
  };
}
async function editarProduto(id){
  const p = state.produtos.find(x=>x.id===id);
  if(!p) return;
  const rid = state.restauranteAtivo;
  const cats = state.categorias.filter(c=>c.restauranteId===rid);
  const catOpts = cats.map(c=>`<option value="${c.id}" ${c.id===p.categoriaId?'selected':''}>${c.nome}</option>`).join('');
  document.getElementById('modal').innerHTML = `
  <div class="modal open">
    <div class="panel" style="max-width:640px">
      <button class="close" onclick="closeModal()">✕</button>
      <h3>Editar produto</h3>
      <form id="formEditProduto">
        <div class="grid-2">
          <div class="field"><label>Nome <span style="color:#ef4444">*</span></label><input name="nome" value="${p.nome||''}" required></div>
          <div class="field"><label>Categoria</label><select name="categoriaId">${catOpts}</select></div>
          <div class="field"><label>Preço (R$) <span style="color:#ef4444">*</span></label><input type="number" name="preco" step="0.01" value="${p.preco||''}" required></div>
          <div class="field"><label>Foto (URL)</label><input name="foto" value="${p.foto||''}"></div>
        </div>
        <div class="field full"><label>Descrição</label><textarea name="descricao" rows="2">${p.descricao||''}</textarea></div>
        <div class="grid-2">
          <div class="field"><label>Adicionais</label><input name="adicionais" value="${p.adicionais||''}"></div>
          <div class="field"><label>Tamanhos/Variações</label><input name="tamanhos" value="${p.tamanhos||''}"></div>
        </div>
        <div class="field full"><label>Horário de funcionamento</label><input name="horario" value="${p.horario||''}"></div>
        <div class="grid-2">
          <div class="field"><label>Taxa de entrega</label><input type="number" name="taxaEntrega" step="0.01" value="${p.taxaEntrega||0}"></div>
          <div class="field"><label>Área de entrega</label><input name="areaEntrega" value="${p.areaEntrega||''}"></div>
        </div>
        <div class="field full"><label>Formas de pagamento</label><input name="pagamento" value="${p.pagamento||''}"></div>
        <div class="field"><label>Disponibilidade</label><select name="disponivel"><option value="sim" ${p.disponivel!=='nao'?'selected':''}>Disponível</option><option value="nao" ${p.disponivel==='nao'?'selected':''}>Esgotado</option></select></div>
        <div class="field"><label>Ordem de exibição</label><input type="number" name="ordem" value="${p.ordem||0}"></div>
        <div class="field"><label>Promoção</label><input name="promocao" value="${p.promocao||''}"></div>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar alterações</button>
      </div>
    </div>
  </div>`;
  document.getElementById('modal').classList.add('open');
  document.getElementById('formEditProduto').onsubmit=async(e)=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    const d=Object.fromEntries(fd);
    d.disponivel = d.disponivel==='nao'?'nao':'sim';
    const cat = state.categorias.find(c=>c.id===d.categoriaId);
    const registro = {
      categoria_id: d.categoriaId || null,
      categoria: cat?cat.nome:'',
      nome: d.nome,
      descricao: d.descricao,
      preco: parseFloat(d.preco)||0,
      foto: d.foto,
      adicionais: d.adicionais,
      tamanhos: d.tamanhos,
      disponivel: d.disponivel,
      ordem: parseInt(d.ordem)||0,
      promocao: d.promocao,
      horario: d.horario,
      taxa_entrega: parseFloat(d.taxaEntrega)||0,
      area_entrega: d.areaEntrega,
      pagamento: d.pagamento
    };
    try {
      await window.dbUpdate('produtos', id, registro);
      await carregarEstadoSupabase();
      closeModal(); renderProdutos(); toast('Produto atualizado.');
    } catch(err){ toast('Erro ao atualizar produto.'); console.error(err); }
  };
}
async function excluirProduto(id){
  if(!confirm('Excluir este produto?')) return;
  try {
    await window.dbDelete('produtos', id);
    await carregarEstadoSupabase();
    renderProdutos(); toast('Produto excluído.');
  } catch(err){ toast('Erro ao excluir produto.'); console.error(err); }
}
function filtrarProdutos(){ renderProdutos(); renderFiltroCategorias(); }

// Expor para uso global
window.renderCardapio = renderCardapio;