// ============================================
// SUPABASE CLIENT - Rinear Systems Painel
// Configuração do cliente Supabase para o painel
// Estas chaves são públicas (anon/publishable) e seguras para expor no frontend.
// NUNCA coloque a service_role key aqui.
// ============================================

const SUPABASE_URL = 'https://ntzguazamuqhoggjcoqe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_RZFu3MnWyTNCXS-t9WZF_w_BEHSJWxF';

// Inicializa o cliente Supabase (será carregado via CDN no index.html)
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
  if (!supabaseClient) {
    supabaseClient = initSupabase();
  }
  return supabaseClient;
}

// Funções de operações CRUD genéricas
async function dbSelect(table, options = {}) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase não inicializado');
  let q = sb.from(table).select(options.columns || '*');
  if (options.filter) q = q.filter(options.filter.column, options.filter.operator, options.filter.value);
  if (options.order) q = q.order(options.order.column, { ascending: options.order.ascending !== false });
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

// Sincronizar dados do localStorage para o Supabase (migração única)
async function migrarLocalStorageParaSupabase() {
  const raw = localStorage.getItem('rinear_painel_v1');
  if (!raw) return;
  const local = JSON.parse(raw);
  const sb = getSupabase();
  if (!sb) return;

  // Migrar restaurantes
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

  // Migrar categorias
  for (const c of (local.categorias || [])) {
    await dbInsert('categorias', {
      restaurante_id: c.restauranteId,
      nome: c.nome,
      ordem: c.ordem || 0
    });
  }

  // Migrar produtos
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

  // Migrar pedidos
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

  // Migrar mensagens
  for (const m of (local.mensagens || [])) {
    await dbInsert('mensagens', {
      restaurante_id: m.restauranteId,
      nome: m.nome,
      texto: m.texto
    });
  }

  // Migrar mídia
  for (const m of (local.midia || [])) {
    await dbInsert('midia', {
      restaurante_id: m.restauranteId,
      tipo: m.tipo,
      nome: m.nome,
      url: m.url,
      tamanho: m.tamanho
    });
  }
}

// Expor globalmente
window.supabaseInit = initSupabase;
window.getSupabase = getSupabase;
window.dbSelect = dbSelect;
window.dbInsert = dbInsert;
window.dbUpdate = dbUpdate;
window.dbDelete = dbDelete;
window.migrarLocalStorageParaSupabase = migrarLocalStorageParaSupabase;