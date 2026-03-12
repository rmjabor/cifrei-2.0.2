// cipherFunctions.js
// Funções "core" de criptografia do Cifrei 2.0

// ---------------------------------------------
// 1) Conjunto de caracteres válidos (75 chars)
// ---------------------------------------------
// espaço + 26 minúsculas + 26 maiúsculas + 10 dígitos + 13 especiais
// ! @ # $ % & * ( ) - _ = +
const ALL_CHARS_75 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*()-_=+";

// ---------------------------------------------
// 2) Geração de chave aleatória (75 caracteres)
// ---------------------------------------------
function generateKey() {
  const arr = ALL_CHARS_75.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

// ---------------------------------------------
// 3) Derivação determinística da BASE (passphrase → PBKDF2 → Fisher-Yates)
// ---------------------------------------------
// ---------------------------------------------
// Helper para garantir acesso ao Web Crypto (subtle)
// ---------------------------------------------

function getSubtleCrypto() {
  const globalCrypto =
    (typeof window !== 'undefined' && window.crypto) ||
    (typeof self !== 'undefined' && self.crypto) ||
    null;

  if (!globalCrypto || !globalCrypto.subtle) {
    throw new Error(
      "Web Crypto API (crypto.subtle) indisponível.\n" +
      "Abra o Cifrei em um contexto seguro (https:// ou http://localhost).\n" +
      "O Cifrei 2.0 não funciona via file://"
    );
  }

  return globalCrypto.subtle;
}

async function deriveBytesFromPassphrase(
  passphrase,
  salt = "cifrei2-salt-v1",
  length = 512
) {
  const enc = new TextEncoder();
const subtle = getSubtleCrypto();

const passKey = await subtle.importKey(
  "raw",
  enc.encode(passphrase),
  { name: "PBKDF2" },
  false,
  ["deriveBits"]
);

  const params = {
    name: "PBKDF2",
    salt: enc.encode(salt),
    iterations: 200000,
    hash: "SHA-256"
  };

  const bits = await crypto.subtle.deriveBits(params, passKey, length * 8);
  return new Uint8Array(bits);
}

function byteStreamRandom(byteArray) {
  let idx = 0;
  return function (maxExclusive) {
    if (idx + 4 > byteArray.length) idx = 0;

    const v =
      (byteArray[idx] << 24) |
      (byteArray[idx + 1] << 16) |
      (byteArray[idx + 2] << 8) |
      byteArray[idx + 3];

    idx += 4;
    return (v >>> 0) % maxExclusive;
  };
}

function shuffleDeterministic(arr, randFn) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randFn(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.join("");
}

async function generateBaseFromPassphrase(passphrase) {
  const bytes = await deriveBytesFromPassphrase(passphrase, "cifrei2-salt-v1", 512);
  const rand = byteStreamRandom(bytes);
  return shuffleDeterministic(ALL_CHARS_75.split(""), rand);
}

// ---------------------------------------------
// 4) Normalização de textos para cifrar/decifrar
// ---------------------------------------------
function normalizePlainTextForEncrypt(text) {
  if (!text) return "";
  let t = text.replace(/\s+/g, " "); // múltiplos espaços
  t = t.trim();
  return t;
}

function denormalizePlainTextAfterDecrypt(text) {
  if (!text) return "";
  let  t = text.replace(/\s+/g, " ");
  t = t.trim();
  return t;
}

// ---------------------------------------------
// 5) Validação da chave
// ---------------------------------------------
function isValidKey75(chave) {
  if (!chave || chave.length !== ALL_CHARS_75.length) return false;
  const set = new Set(chave.split(""));
  if (set.size !== ALL_CHARS_75.length) return false;

  for (const c of ALL_CHARS_75) {
    if (!set.has(c)) return false;
  }
  return true;
}

// ---------------------------------------------
// 6) Função de CIFRAGEM: encrypt
//
//    - textoAberto → string
//    - chave → permutação dos 75 chars
//    - passphrase → string
// ---------------------------------------------
async function encrypt(textoAberto, chave, passphrase) {
  const pass = (passphrase || "").trim();
  if (!pass) {
    throw new Error("Passphrase inválida ou vazia.");
  }

  if (!isValidKey75(chave)) {
    throw new Error("Chave inválida para Cifrei 2.0 (75 caracteres sem repetição).");
  }

  const base = await generateBaseFromPassphrase(pass);

  const normalizada = normalizePlainTextForEncrypt(textoAberto || "");
  if (!normalizada) return "";

  const mapa = {};
  for (let i = 0; i < base.length; i++) {
    mapa[base[i]] = chave[i];
  }

  let resultado = "";
  for (const ch of normalizada) {
    resultado += mapa[ch] || "";
  }

  return resultado;
}

// ---------------------------------------------
// 7) Função de DECIFRAGEM: decrypt
// ---------------------------------------------
async function decrypt(textoCifrado, chave, passphrase) {
  const pass = (passphrase || "").trim();
  if (!pass) {
    throw new Error("Passphrase inválida ou vazia.");
  }

  if (!isValidKey75(chave)) {
    throw new Error("Chave inválida para Cifrei 2.0 (75 caracteres sem repetição).");
  }

  const base = await generateBaseFromPassphrase(pass);

  const mapaInverso = {};
  for (let i = 0; i < base.length; i++) {
    mapaInverso[chave[i]] = base[i];
  }

  let intermediaria = "";
  for (const ch of (textoCifrado || "")) {
    intermediaria += mapaInverso[ch] || "";
  }

  return denormalizePlainTextAfterDecrypt(intermediaria);
}

// ---------------------------------------------
// Exposição opcional (se quiser usar via módulos)
// ---------------------------------------------
// export {
//   generateKey,
//   encrypt,
//   decrypt,
//   isValidKey75,
//   generateBaseFromPassphrase
// };
