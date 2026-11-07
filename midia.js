// ============================================
// BIBLIOTECA DE MÍDIA - Rinear Systems Painel
// ============================================

async function renderMidia(){
  await carregarEstadoSupabase();
  const rid = state.restauranteAtivo;
  const rest = state.restaurantes.find(r=>r.id===rid);
  const html = `
  <div class="page active" id="page-midia">
    <div class="page-head">
      <div>
        <h1>Biblioteca de Mídia</h1>
        <p>${rest?rest.nome:'Selecione um restaurante'} — Logos, fotos de pratos, banners e QR Codes.</p>
      </div>
      <button class="btn btn-primary" onclick="abrirUploadMidia()">+ Enviar arquivo</button>
    </div>
    <div class="card">
      <h3>Arquivos</h3>
      <div id="listaMidia" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px"></div>
    </div>
  </div>`;
  document.getElementById('main').innerHTML = html;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-midia').classList.add('active');
  renderListaMidia();
}

async function renderListaMidia(){
  const rid = state.restauranteAtivo;
  const el = document.getElementById('listaMidia');
  if (!rid) {
    if (el) el.innerHTML = '<div class="empty-state" style="padding:24px"><h3>Selecione um restaurante</h3><p>Escolha um restaurante no seletor acima para ver os arquivos.</p></div>';
    return;
  }
  try {
    const arquivos = await window.dbSelect('midia', {
      filter: { column: 'restaurante_id', operator: 'eq', value: rid },
      order: { column: 'created_at', ascending: false }
    });
    if(!arquivos.length){
      el.innerHTML = '<div class="empty-state" style="padding:24px">Nenhum arquivo enviado ainda.</div>';
      return;
    }
    el.innerHTML = arquivos.map(m => `
      <div class="card" style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:14px">
        ${m.tipo === 'imagem' ? `<img src="${m.url}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div style="width:100%;height:120px;background:var(--bg-sec);border:1px solid var(--border);border-radius:8px;display:none;align-items:center;justify-content:center;color:var(--muted);font-size:11px;margin-bottom:8px">Imagem não carregou</div>` : `<div style="width:100%;height:120px;background:var(--bg-sec);border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:11px;margin-bottom:8px">${m.tipo.toUpperCase()}</div>`}
        <div style="font-size:12px;color:var(--ink);font-weight:600;word-break:break-word">${m.nome}</div>
        <div style="font-size:11px;color:var(--muted)">${m.tipo.toUpperCase()}</div>
        <div class="row-actions" style="margin-top:8px">
          <button class="btn-icon" onclick="abrirUrlMidia('${m.url}')" title="Abrir">🔗</button>
          <button class="btn-icon" onclick="excluirMidia('${m.id}')" style="color:var(--muted)" title="Excluir">🗑️</button>
        </div>
      </div>
    `).join('');
  } catch(e){
    console.error(e);
    if (el) el.innerHTML = '<div class="empty-state" style="padding:24px">Erro ao carregar arquivos.</div>';
  }
}

function abrirUrlMidia(url){
  window.open(url, '_blank');
}

async function excluirMidia(id){
  if(!confirm('Excluir este arquivo?')) return;
  try {
    await window.dbDelete('midia', id);
    await carregarEstadoSupabase();
    renderMidia();
    toast('Arquivo excluído.');
  } catch(e){ toast('Erro ao excluir arquivo.'); console.error(e); }
}

function abrirUploadMidia(){
  const rid = state.restauranteAtivo;
  if(!rid){ toast('Selecione um restaurante primeiro.'); return; }
  const html = `
  <div class="modal open">
    <div class="panel" style="max-width:560px">
      <button class="close" onclick="closeModal()">✕</button>
      <h3>Enviar arquivo</h3>
      <form id="formMidia" style="display:flex;flex-direction:column;gap:12px">
        <div class="field"><label>Nome <span style="color:#ef4444">*</span></label><input name="nome" required></div>
        <div class="field"><label>Tipo</label><select name="tipo">
          <option value="imagem">Imagem</option>
          <option value="video">Vídeo</option>
          <option value="documento">Documento</option>
          <option value="outro">Outro</option>
        </select></div>
        <div class="field"><label>URL do arquivo <span style="color:#ef4444">*</span></label><input name="url" placeholder="https://..." required></div>
        <div class="actions" style="justify-content:flex-end">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">Enviar</button>
        </div>
      </form>
    </div>
  </div>`;
  document.getElementById('modal').innerHTML = html;
  document.getElementById('modal').classList.add('open');
  const form = document.getElementById('formMidia');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const dados = Object.fromEntries(fd);
      try {
        await window.dbInsert('midia', {
          restaurante_id: rid,
          tipo: dados.tipo,
          nome: dados.nome,
          url: dados.url,
          tamanho: null
        });
        await carregarEstadoSupabase();
        closeModal();
        renderMidia();
        toast('Arquivo enviado.');
      } catch(err){ toast('Erro ao enviar arquivo.'); console.error(err); }
    };
  }
}

window.renderMidia = renderMidia;