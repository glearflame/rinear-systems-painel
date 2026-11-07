// ============================================
// SUPABASE CLIENT - Rinear Systems Painel
// Chaves públicas (anon/publishable). NUNCA coloque service_role aqui.
// ============================================

const SUPABASE_URL = 'https://ntzguazamuqhoggjcoqe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_RZFu3MnWyTNCXS-t9WZF_w_BEHSJWxF';

let supabaseClient = null;

function initSupabase() {
  if (typeof window.supabase === 'undefined') {
    console.warn('supabase-js não carregado ainda');
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

function getSupabase() {
  if (!supabaseClient) supabaseClient = initSupabase();
  return supabaseClient;
}

async function dbSelect(table, options = {}) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase não inicializado');
  let q = sb.from(table).select(options.columns || '*');
  if (options.filter) {
    const { column, operator, value } = options.filter;
    if (operator === 'eq') q = q.eq(column, value);
    else if (operator === 'neq') q = q.neq(column, value);
    else if (operator === 'gt') q = q.gt(column, value);
    else if (operator === 'lt') q = q.lt(column, value);
    else if (operator === 'gte') q = q.gte(column, value);
    else if (operator === 'lte') q = q.lte(column, value);
    else if (operator === 'like') q = q.like(column, value);
    else if (operator === 'ilike') q = q.ilike(column, value);
    else q = q.filter(column, operator, value);
  }
  if (options.order) {
    q = q.order(options.order.column, { ascending: options.order.ascending !== false });
  }
  if (options.limit) q = q.limit(options.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function dbInsert(table, record) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase não inicializado');
  const { data, error } = await sb.from(table).insert([record]).select();
  if (error) throw error;
  return data && data[0];
}

async function dbUpdate(table, id, record) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase não inicializado');
  const { data, error } = await sb.from(table).update(record).eq('id', id).select();
  if (error) throw error;
  return data && data[0];
}

async function dbDelete(table, id) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase não inicializado');
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) throw error;
  return true;
}

// Migração única do localStorage → Supabase (só roda se ainda não migrou)
async function migrarLocalStorageParaSupabase() {
  const flag = localStorage.getItem('rinear_migrated_v1');
  if (flag === '1') return;

  const raw = localStorage.getItem('rinear_painel_v1');
  if (!raw) {
    localStorage.setItem('rinear_migrated_v1', '1');
    return;
  }

  let local;
  try { local = JSON.parse(raw); } catch { return; }
  const sb = getSupabase();
  if (!sb) return;

  try {
    for (const r of (local.restaurantes || [])) {
      await dbInsert('restaurantes', {
        nome: r.nome,
        tipo: r.tipo,
        responsavel: r.responsavel,
        whatsapp: r.whatsapp,
        instagram: r.instagram,
        email: r.email,
        cidade: r.cidade,
        bairro: r.bairro,
        googlemaps: r.googlemaps,
        sitio: r.sitio,
        observacoes: r.observacoes,
        status: r.status,
        valor: parseFloat(r.valor) || 0,
        data_inicio: r.dataInicio || null,
        data_entrega: r.dataEntrega || null,
        data_renovacao: r.dataRenovacao || null
      });
    }
    for (const c of (local.categorias || [])) {
      await dbInsert('categorias', {
        restaurante_id: c.restauranteId,
        nome: c.nome,
        ordem: c.ordem || 0
      });
    }
    for (const p of (local.produtos || [])) {
      await dbInsert('produtos', {
        restaurante_id: p.restauranteId,
        categoria_id: p.categoriaId || null,
        categoria: p.categoria,
        nome: p.nome,
        descricao: p.descricao,
        preco: parseFloat(p.preco) || 0,
        foto: p.foto,
        adicionais: p.adicionais,
        tamanhos: p.tamanhos,
        disponivel: p.disponivel,
        ordem: p.ordem || 0,
        promocao: p.promocao,
        horario: p.horario,
        taxa_entrega: parseFloat(p.taxaEntrega) || 0,
        area_entrega: p.areaEntrega,
        pagamento: p.pagamento
      });
    }
    for (const p of (local.pedidos || [])) {
      await dbInsert('pedidos', {
        restaurante_id: p.restauranteId,
        cliente: p.cliente,
        forma: p.forma,
        endereco: p.endereco,
        observacoes: p.obs,
        itens: p.itens || [],
        total: parseFloat(p.total) || 0,
        status: p.status
      });
    }
    for (const m of (local.mensagens || [])) {
      await dbInsert('mensagens', {
        restaurante_id: m.restauranteId,
        nome: m.nome,
        texto: m.texto
      });
    }
    for (const m of (local.midia || [])) {
      await dbInsert('midia', {
        restaurante_id: m.restauranteId,
        tipo: m.tipo,
        nome: m.nome,
        url: m.url,
        tamanho: m.tamanho
      });
    }
    localStorage.setItem('rinear_migrated_v1', '1');
  } catch (e) {
    console.warn('Migração parcial/falhou:', e.message);
  }
}

window.supabaseInit = initSupabase;
window.getSupabase = getSupabase;
window.dbSelect = dbSelect;
window.dbInsert = dbInsert;
window.dbUpdate = dbUpdate;
window.dbDelete = dbDelete;
window.migrarLocalStorageParaSupabase = migrarLocalStorageParaSupabase;
