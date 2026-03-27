// storage.js
// Camada de persistência do Cifrei 3.0 usando Supabase

function ensureSupabaseClient() {
  const client = window.cifreiSupabase || window.supabaseClient || null;

  if (!client) {
    throw new Error('Cliente Supabase não inicializado. Verifique supabaseClient.js.');
  }

  if (!client.auth || typeof client.auth.getUser !== 'function') {
    throw new Error('Objeto encontrado não é um client válido do Supabase.');
  }

  return client;
}

async function getAuthenticatedUserId() {
  const supabase = ensureSupabaseClient();

  // 1) tenta via sessão local, que costuma estar disponível mais cedo após navegação
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (!sessionError && sessionData && sessionData.session && sessionData.session.user && sessionData.session.user.id) {
      return sessionData.session.user.id;
    }
  } catch (e) {
    console.warn('[Cifrei] getSession falhou, vou tentar getUser():', e);
  }

  // 2) fallback para getUser
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data || !data.user || !data.user.id) {
    throw new Error('Usuário não autenticado.');
  }

  return data.user.id;
}

function mapDbRecordToApp(rec) {
  if (!rec) return null;

  return {
    id: rec.id,
    user_id: rec.user_id,
    name: rec.name || '',
    key75: rec.key75 || '',
    ciphertext: rec.ciphertext || '',
    notes: rec.notes || '',
    createdAt: rec.created_at || null,
    updatedAt: rec.updated_at || null
  };
}

async function findCifragemByName(name) {
  const supabase = ensureSupabaseClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('cifragem_records')
    .select('*')
    .eq('user_id', userId)
    .eq('name', name)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return mapDbRecordToApp(data);
}

async function getCifragemCount() {
  const supabase = ensureSupabaseClient();
  const userId = await getAuthenticatedUserId();

  const { count, error } = await supabase
    .from('cifragem_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return count || 0;
}

async function getNextCifragemDefaultName() {
  const count = await getCifragemCount();
  const nextNumber = (count || 0) + 1;
  return `Cifra #${nextNumber}`;
}

async function saveCifragemRecord(data) {
  const supabase = ensureSupabaseClient();
  const userId = await getAuthenticatedUserId();

  const payload = {
    user_id: userId,
    name: data.name || '',
    key75: data.key75 || '',
    ciphertext: data.ciphertext || '',
    notes: data.notes || ''
  };

  const { data: inserted, error } = await supabase
    .from('cifragem_records')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return inserted.id;
}

async function updateCifragemRecord(id, { name, key75, ciphertext, notes }) {
  const supabase = ensureSupabaseClient();
  const userId = await getAuthenticatedUserId();

  const payload = {
    name: name || '',
    key75: key75 || '',
    ciphertext: ciphertext || '',
    notes: notes || ''
  };

  const { error } = await supabase
    .from('cifragem_records')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

async function deleteCifragemRecord(id) {
  const supabase = ensureSupabaseClient();
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from('cifragem_records')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

async function getAllCifragemRecordsSortedByName() {
  const supabase = ensureSupabaseClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('cifragem_records')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapDbRecordToApp);
}

async function getCifragemRecordById(id) {
  const supabase = ensureSupabaseClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('cifragem_records')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return mapDbRecordToApp(data);
}


const DEFAULT_PASSWORD_GEN_PARAMS = Object.freeze({
  total: 8,
  upper: 1,
  number: 1,
  special: 1
});

function normalizePasswordGenParams(params) {
  const src = params && typeof params === 'object' ? params : {};

  let total = Number.parseInt(src.total, 10);
  let upper = Number.parseInt(src.upper, 10);
  let number = Number.parseInt(src.number, 10);
  let special = Number.parseInt(src.special, 10);

  if (!Number.isFinite(total)) total = DEFAULT_PASSWORD_GEN_PARAMS.total;
  if (!Number.isFinite(upper)) upper = DEFAULT_PASSWORD_GEN_PARAMS.upper;
  if (!Number.isFinite(number)) number = DEFAULT_PASSWORD_GEN_PARAMS.number;
  if (!Number.isFinite(special)) special = DEFAULT_PASSWORD_GEN_PARAMS.special;

  total = Math.min(30, Math.max(4, total));
  upper = Math.min(9, Math.max(0, upper));
  number = Math.min(9, Math.max(0, number));
  special = Math.min(9, Math.max(0, special));

  const sum = upper + number + special;
  if (sum > total) {
    total = Math.min(30, sum);
  }

  return { total, upper, number, special };
}

async function getProfilePasswordGenParams() {
  const supabase = ensureSupabaseClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('profiles')
    .select('password_gen_params')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return normalizePasswordGenParams(data && data.password_gen_params ? data.password_gen_params : DEFAULT_PASSWORD_GEN_PARAMS);
}

async function saveProfilePasswordGenParams(params) {
  const supabase = ensureSupabaseClient();
  const userId = await getAuthenticatedUserId();
  const normalized = normalizePasswordGenParams(params);

  const payload = {
    password_gen_params: normalized,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data || !data.id) {
    throw new Error('Perfil do usuário não encontrado para salvar password_gen_params.');
  }

  return normalized;
}


function addDaysToIsoString(baseDate, daysToAdd) {
  const date = baseDate ? new Date(baseDate) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new Error('Data inválida para cálculo de próxima solicitação de avaliação.');
  }

  date.setDate(date.getDate() + Number(daysToAdd || 0));
  return date.toISOString();
}

async function getProfileAvaliacaoPromptState() {
  const supabase = ensureSupabaseClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('profiles')
    .select('prox_pedido_avalia, contador_uso_relevante')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  return {
    userId,
    proxPedidoAvalia: data && data.prox_pedido_avalia ? data.prox_pedido_avalia : null,
    contadorUsoRelevante: data && Number.isFinite(Number(data.contador_uso_relevante))
      ? Number(data.contador_uso_relevante)
      : 0
  };
}

async function incrementProfileRelevantUsage() {
  const supabase = ensureSupabaseClient();
  const userId = await getAuthenticatedUserId();

  const { data: current, error: selectError } = await supabase
    .from('profiles')
    .select('contador_uso_relevante')
    .eq('id', userId)
    .maybeSingle();

  if (selectError) throw selectError;

  const currentCount = current && Number.isFinite(Number(current.contador_uso_relevante))
    ? Number(current.contador_uso_relevante)
    : 0;

  const { data, error } = await supabase
    .from('profiles')
    .update({
      contador_uso_relevante: currentCount + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select('contador_uso_relevante')
    .maybeSingle();

  if (error) throw error;
  return data && Number.isFinite(Number(data.contador_uso_relevante))
    ? Number(data.contador_uso_relevante)
    : currentCount + 1;
}

async function deferProfileAvaliacaoPrompt(daysToAdd) {
  const supabase = ensureSupabaseClient();
  const userId = await getAuthenticatedUserId();
  const proxPedidoAvalia = addDaysToIsoString(null, daysToAdd);

  const { data, error } = await supabase
    .from('profiles')
    .update({
      prox_pedido_avalia: proxPedidoAvalia,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select('id, prox_pedido_avalia')
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function submitUserEvaluation(payload) {
  const supabase = ensureSupabaseClient();
  const userId = await getAuthenticatedUserId();

  const nota = Number.parseInt(payload && payload.nota, 10);
  if (!Number.isFinite(nota) || nota < 1 || nota > 5) {
    throw new Error('A nota da avaliação deve estar entre 1 e 5.');
  }

  const comentarios = payload && typeof payload.comentarios === 'string'
    ? payload.comentarios.trim()
    : '';

  const { data: inserted, error: insertError } = await supabase
    .from('avaliacoes')
    .insert({
      user_id: userId,
      nota,
      comentarios: comentarios || null,
      vigente: true
    })
    .select('id')
    .single();

  if (insertError) throw insertError;

  const { data: profileUpdate, error: updateError } = await supabase
    .from('profiles')
    .update({
      prox_pedido_avalia: addDaysToIsoString(null, 45),
      contador_uso_relevante: 0,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select('id, prox_pedido_avalia, contador_uso_relevante')
    .maybeSingle();

  if (updateError) throw updateError;

  return {
    avaliacaoId: inserted && inserted.id ? inserted.id : null,
    profile: profileUpdate || null
  };
}
