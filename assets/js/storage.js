// storage.js
// Camada de persistência do Cifrei 3.0 usando Supabase

const CIFREI_TABLE_NAME = 'cifragem_records';

function getCifreiSupabaseClient() {
  return window.cifreiSupabase || window.supabaseClient || null;
}

async function getAuthenticatedUserOrThrow() {
  const supabase = getCifreiSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client não inicializado.');
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }

  const user = data?.user || null;
  if (!user?.id) {
    throw new Error('Usuário não autenticado.');
  }

  return { supabase, user };
}

function mapDbRowToLegacyRecord(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name || '',
    key75: row.key75 || '',
    ciphertext: row.ciphertext || '',
    notes: row.notes || '',
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

function buildDbPayload(data) {
  const payload = {};

  if (Object.prototype.hasOwnProperty.call(data, 'name')) {
    payload.name = data.name == null ? null : String(data.name);
  }
  if (Object.prototype.hasOwnProperty.call(data, 'key75')) {
    payload.key75 = String(data.key75 || '');
  }
  if (Object.prototype.hasOwnProperty.call(data, 'ciphertext')) {
    payload.ciphertext = String(data.ciphertext || '');
  }
  if (Object.prototype.hasOwnProperty.call(data, 'notes')) {
    payload.notes = data.notes == null ? '' : String(data.notes);
  }

  return payload;
}

// Procura uma cifra pelo nome exato (case-sensitive do app; comparação depende da collation do banco)
async function findCifragemByName(name) {
  const { supabase, user } = await getAuthenticatedUserOrThrow();

  const { data, error } = await supabase
    .from(CIFREI_TABLE_NAME)
    .select('id, name, key75, ciphertext, notes, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('name', name)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    throw error;
  }

  return mapDbRowToLegacyRecord(data?.[0] || null);
}

// Conta quantos registros existem (para sugerir "Cifra #N")
async function getCifragemCount() {
  const { supabase, user } = await getAuthenticatedUserOrThrow();

  const { count, error } = await supabase
    .from(CIFREI_TABLE_NAME)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) {
    throw error;
  }

  return count || 0;
}

// Retorna o nome padrão sugerido: "Cifra #N"
async function getNextCifragemDefaultName() {
  const count = await getCifragemCount();
  const nextNumber = (count || 0) + 1;
  return `Cifra #${nextNumber}`;
}

// Salva um registro de cifragem
// data: { name, key75, ciphertext, notes }
async function saveCifragemRecord(data) {
  const { supabase, user } = await getAuthenticatedUserOrThrow();

  const payload = buildDbPayload(data);
  payload.user_id = user.id;

  const { data: insertedRow, error } = await supabase
    .from(CIFREI_TABLE_NAME)
    .insert(payload)
    .select('id, name, key75, ciphertext, notes, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  const record = mapDbRowToLegacyRecord(insertedRow);
  return record?.id || null;
}

// Atualiza um registro existente pelo id
async function updateCifragemRecord(id, { name, key75, ciphertext, notes }) {
  const { supabase, user } = await getAuthenticatedUserOrThrow();

  const payload = buildDbPayload({ name, key75, ciphertext, notes });

  const { error } = await supabase
    .from(CIFREI_TABLE_NAME)
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    throw error;
  }

  return true;
}

// Exclui um registro de cifragem pelo id
async function deleteCifragemRecord(id) {
  const { supabase, user } = await getAuthenticatedUserOrThrow();

  const { error } = await supabase
    .from(CIFREI_TABLE_NAME)
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    throw error;
  }
}

// Retorna todas as cifras salvas, ordenadas por nome (crescente)
async function getAllCifragemRecordsSortedByName() {
  const { supabase, user } = await getAuthenticatedUserOrThrow();

  const { data, error } = await supabase
    .from(CIFREI_TABLE_NAME)
    .select('id, name, key75, ciphertext, notes, created_at, updated_at')
    .eq('user_id', user.id)
    .order('name', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map(mapDbRowToLegacyRecord);
}

// Busca um registro específico pelo id
async function getCifragemRecordById(id) {
  const { supabase, user } = await getAuthenticatedUserOrThrow();

  if (id == null || id === '') {
    return null;
  }

  const { data, error } = await supabase
    .from(CIFREI_TABLE_NAME)
    .select('id, name, key75, ciphertext, notes, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapDbRowToLegacyRecord(data || null);
}
