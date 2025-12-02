// storage.js
// Banco local do Cifrei 2.0 usando IndexedDB

const CIFREI_DB_NAME    = 'Cifrei2DB';
const CIFREI_DB_VERSION = 1;
const CIFREI_STORE_NAME = 'cifragemRecords';

// Abre (ou cria) o banco
function openCifreiDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CIFREI_DB_NAME, CIFREI_DB_VERSION);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(CIFREI_STORE_NAME)) {
        const store = db.createObjectStore(CIFREI_STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true // id sequencial
        });

        store.createIndex('name', 'name', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = function (event) {
      resolve(event.target.result);
    };

    request.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

// Procura uma cifra pelo nome exato (case-sensitive)
async function findCifragemByName(name) {
  const db = await openCifreiDb();

  return new Promise((resolve, reject) => {
    const tx    = db.transaction(CIFREI_STORE_NAME, 'readonly');
    const store = tx.objectStore(CIFREI_STORE_NAME);
    let index;

    try {
      index = store.index('name');
    } catch (e) {
      console.error('[Cifrei] Índice "name" não encontrado na store.', e);
      reject(e);
      return;
    }

    const req = index.get(name);

    req.onsuccess = function () {
      resolve(req.result || null);
    };

    req.onerror = function () {
      reject(req.error);
    };
  });
}


// Conta quantos registros existem (para sugerir "Cifra #N")
async function getCifragemCount() {
  const db = await openCifreiDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(CIFREI_STORE_NAME, 'readonly');
    const store = tx.objectStore(CIFREI_STORE_NAME);
    const countRequest = store.count();

    countRequest.onsuccess = function () {
      resolve(countRequest.result || 0);
    };

    countRequest.onerror = function () {
      reject(countRequest.error);
    };
  });
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
  const db = await openCifreiDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(CIFREI_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CIFREI_STORE_NAME);

    const nowIso = new Date().toISOString();

    const record = {
      // id é autoIncrement, deixamos sem definir
      name:        data.name,
      key75:       data.key75,
      ciphertext:  data.ciphertext,  // pode ser "" se salvar só a chave
      notes:       data.notes || '',
      createdAt:   nowIso,
      updatedAt:   null
    };

    const req = store.add(record);

    req.onsuccess = function () {
      resolve(req.result); // id gerado
    };

    req.onerror = function () {
      reject(req.error);
    };
  });
}

// Atualiza um registro existente pelo id
async function updateCifragemRecord(id, { name, key75, ciphertext, notes }) {
  const db = await openCifreiDb();

  return new Promise((resolve, reject) => {
    const tx    = db.transaction(CIFREI_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CIFREI_STORE_NAME);

    const getReq = store.get(id);

    getReq.onsuccess = function () {
      const rec = getReq.result;
      if (!rec) {
        reject(new Error('Registro não encontrado para update (id=' + id + ')'));
        return;
      }

      rec.name       = name;
      rec.key75      = key75;
      rec.ciphertext = ciphertext;
      rec.notes      = notes || '';
      rec.updatedAt  = new Date().toISOString();

      const putReq = store.put(rec);

      putReq.onsuccess = function () {
        resolve(true);
      };

      putReq.onerror = function () {
        reject(putReq.error);
      };
    };

    getReq.onerror = function () {
      reject(getReq.error);
    };
  });
}


// Exclui um registro de cifragem pelo id
async function deleteCifragemRecord(id) {
  const db = await openCifreiDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(CIFREI_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CIFREI_STORE_NAME);

    const req = store.delete(id);

    req.onsuccess = function () {
      resolve();
    };

    req.onerror = function () {
      reject(req.error);
    };
  });
}

// Retorna todas as cifras salvas, ordenadas por nome (crescente)
async function getAllCifragemRecordsSortedByName() {
  const db = await openCifreiDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(CIFREI_STORE_NAME, 'readonly');
    const store = tx.objectStore(CIFREI_STORE_NAME);

    let source;

    // Se o índice "name" existir, usamos ele para ordenar
    if (store.indexNames.contains('name')) {
      source = store.index('name');
    } else {
      source = store;
    }

    const records = [];
    const request = source.openCursor(null, 'next');

    request.onsuccess = function (event) {
      const cursor = event.target.result;
      if (cursor) {
        records.push(cursor.value);
        cursor.continue();
      } else {
        // nada mais
        resolve(records);
      }
    };

    request.onerror = function () {
      reject(request.error);
    };
  });
}

// Busca um registro específico pelo id
async function getCifragemRecordById(id) {
  const db = await openCifreiDb();

  return new Promise((resolve, reject) => {
    const tx    = db.transaction(CIFREI_STORE_NAME, 'readonly');
    const store = tx.objectStore(CIFREI_STORE_NAME);

    const req = store.get(Number(id));

    req.onsuccess = function () {
      // se não achar, devolve null
      resolve(req.result || null);
    };

    req.onerror = function () {
      reject(req.error);
    };
  });
}
