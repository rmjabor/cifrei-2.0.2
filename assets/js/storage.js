
// storage.js
// Camada de persistência do Cifrei 3.0 usando Supabase
(function () {
  'use strict';

  const TABLE_NAME = 'cifragem_records';
  const FALLBACK_SUPABASE_URL = 'https://bgfchuxvuanjiepchfxq.supabase.co';
  const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_QJzlVnYT2CF8-BrTbsfOlw_EJcrY8bv';

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function getInitializedClient() {
    return window.cifreiSupabase || window.supabaseClient || null;
  }

  function tryLazyInitClient() {
    const existing = getInitializedClient();
    if (existing) return existing;

    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        const client = window.supabase.createClient(
          FALLBACK_SUPABASE_URL,
          FALLBACK_SUPABASE_PUBLISHABLE_KEY,
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true
            }
          }
        );
        window.cifreiSupabase = client;
        window.supabaseClient = client;
        console.log('[Cifrei] Supabase client inicializado sob demanda pelo storage.js.');
        return client;
      } catch (err) {
        console.error('[Cifrei] Falha ao inicializar client do Supabase sob demanda:', err);
      }
    }

    return null;
  }

  async function ensureSupabaseClient() {
    let client = getInitializedClient() || tryLazyInitClient();
    if (client && client.auth && typeof client.auth.getUser === 'function') {
      return client;
    }

    const timeoutAt = Date.now() + 7000;
    while (Date.now() < timeoutAt) {
      client = getInitializedClient() || tryLazyInitClient();
      if (client && client.auth && typeof client.auth.getUser === 'function') {
        return client;
      }
      await sleep(100);
    }

    throw new Error('Cliente Supabase não inicializado. Verifique o carregamento do SDK e do supabaseClient.js.');
  }

  async function getAuthenticatedUserId() {
    const supabase = await ensureSupabaseClient();

    let user = null;

    if (supabase.auth && typeof supabase.auth.getUser === 'function') {
      const result = await supabase.auth.getUser();
      if (result && result.error) throw result.error;
      user = result && result.data ? result.data.user : null;
    }

    if (!user && supabase.auth && typeof supabase.auth.getSession === 'function') {
      const result = await supabase.auth.getSession();
      if (result && result.error) throw result.error;
      user = result && result.data && result.data.session ? result.data.session.user : null;
    }

    if (!user || !user.id) {
      throw new Error('Usuário não autenticado.');
    }

    return user.id;
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
    const supabase = await ensureSupabaseClient();
    const userId = await getAuthenticatedUserId();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .eq('name', name)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return mapDbRecordToApp(data);
  }

  async function getCifragemCount() {
    const supabase = await ensureSupabaseClient();
    const userId = await getAuthenticatedUserId();

    const { count, error } = await supabase
      .from(TABLE_NAME)
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
    const supabase = await ensureSupabaseClient();
    const userId = await getAuthenticatedUserId();

    const payload = {
      user_id: userId,
      name: data && data.name ? data.name : '',
      key75: data && data.key75 ? data.key75 : '',
      ciphertext: data && data.ciphertext ? data.ciphertext : '',
      notes: data && data.notes ? data.notes : ''
    };

    const { data: inserted, error } = await supabase
      .from(TABLE_NAME)
      .insert(payload)
      .select('id')
      .single();

    if (error) throw error;
    return inserted.id;
  }

  async function updateCifragemRecord(id, fields) {
    const supabase = await ensureSupabaseClient();
    const userId = await getAuthenticatedUserId();

    const payload = {
      name: fields && fields.name ? fields.name : '',
      key75: fields && fields.key75 ? fields.key75 : '',
      ciphertext: fields && fields.ciphertext ? fields.ciphertext : '',
      notes: fields && fields.notes ? fields.notes : ''
    };

    const { error } = await supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  async function deleteCifragemRecord(id) {
    const supabase = await ensureSupabaseClient();
    const userId = await getAuthenticatedUserId();

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  async function getAllCifragemRecordsSortedByName() {
    const supabase = await ensureSupabaseClient();
    const userId = await getAuthenticatedUserId();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapDbRecordToApp);
  }

  async function getCifragemRecordById(id) {
    const supabase = await ensureSupabaseClient();
    const userId = await getAuthenticatedUserId();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return mapDbRecordToApp(data);
  }

  window.cifreiStorage = {
    ensureSupabaseClient,
    getAuthenticatedUserId,
    findCifragemByName,
    getCifragemCount,
    getNextCifragemDefaultName,
    saveCifragemRecord,
    updateCifragemRecord,
    deleteCifragemRecord,
    getAllCifragemRecordsSortedByName,
    getCifragemRecordById
  };

  window.findCifragemByName = findCifragemByName;
  window.getCifragemCount = getCifragemCount;
  window.getNextCifragemDefaultName = getNextCifragemDefaultName;
  window.saveCifragemRecord = saveCifragemRecord;
  window.updateCifragemRecord = updateCifragemRecord;
  window.deleteCifragemRecord = deleteCifragemRecord;
  window.getAllCifragemRecordsSortedByName = getAllCifragemRecordsSortedByName;
  window.getCifragemRecordById = getCifragemRecordById;
})();
