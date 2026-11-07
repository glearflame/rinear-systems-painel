// ============================================
// RELATÓRIOS SIMPLES
// Prioridade 6
// ============================================

function renderRelatorios(){
  const rest = state.restaurantes;
  const porStatus = {};
  rest.forEach(r=>{ porStatus[r.status] = (porStatus[r.status]||0)+1; });
  const entreguesMes = rest.filter(r=>r.status==='entregue' && r.dataEntrega && new Date(r.dataEntrega).getMonth()===new Date().getMonth()).length;
  const manutencao = rest.filter(r=>r.status==='manutencao').length;
  const valorPrevisto = rest.reduce((s,r)=>s+(parseFloat(r.valor)||0),0);
  const valorRecebido = rest.filter(r=>r.status==='entregue').reduce((s,r)=>s+(parseFloat(r.valor)||0),0);
  const html = `
  <div class="page active" id="page-relatorios">
    <div class="page-head">
      <h1>Relatórios</h1>
      <p>Indicadores simples de gestão de restaurantes e entregas.</p>
    </div>
    <div class="stats">
      <div class="stat"><div class="v">${rest.length}</div><div class="l">Total de restaurantes</div></div>
      <div class="stat"><div class="v">${entreguesMes}</div><div class="l">Entregues este mês</div></div>
      <div class="stat"><div class="v">${manutencao}</div><div class="l">Manutenção mensal</div></div>
      <div class="stat"><div class="v">R$ ${valorPrevisto.toLocaleString('pt-BR')}</div><div class="l">Receita prevista</div></div>
      <div class="stat"><div class="v">R$ ${valorRecebido.toLocaleString('pt-BR')}</div><div class="l">Receita recebida</div></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <h3>Restaurantes por status</h3>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${Object.entries(porStatus).map(([s,v])=>` 
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px">${s.charAt(0).toUpperCase()+s.slice(1)}</span>
            <span style="font-weight:700;font-variant-numeric:tabular-nums">${v}</span>
          </div>`).join('')||'<div class="empty-state" style="padding:12px">Sem dados.</div>'}
        </div>
      </div>
      <div class="card">
        <h3>Receita</h3>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;justify-content:space-between"><span>Prevista</span><strong>R$ ${valorPrevisto.toLocaleString('pt-BR')}</strong></div>
          <div style="display:flex;justify-content:space-between"><span>Recebida (entregues)</span><strong style="color:#22c55e">R$ ${valorRecebido.toLocaleString('pt-BR')}</strong></div>
          <div style="display:flex;justify-content:space-between"><span>Pendente</span><strong>R$ ${(valorPrevisto-valorRecebido).toLocaleString('pt-BR')}</strong></div>
        </div>
      </div>
    </div>
    <div class="card">
      <h3>Follow-ups pendentes</h3>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${rest.filter(r=>r.status==='lead' || r.status==='em negociacao').map(r=>`
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <div><strong>${r.nome}</strong><div style="font-size:12px;color:var(--muted)">${r.whatsapp||'-'}</div></div>
          <a href="https://wa.me/${r.whatsapp}?text=Ol%C3%A1%20${encodeURIComponent(r.nome.split(' ')[0])}%2C%20tudo%20bem%3F" class="btn btn-sm btn-ghost" target="_blank">Contatar</a>
        </div>`).join('')||'<div class="empty-state" style="padding:12px">Nenhum follow-up pendente.</div>'}
      </div>
    </div>
  </div>`;
  document.getElementById('main').innerHTML = html;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-relatorios').classList.add('active');
}

window.renderRelatorios = renderRelatorios;