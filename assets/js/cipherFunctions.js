// cipherFunctions.js
// Criptografia compacta do Cifrei

const CIFREI_KEY_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const CIFREI_KEY_MIN_LENGTH = 8;
const CIFREI_KEY_MAX_LENGTH = 25;
const CIFREI_CODE_VERSION = 1;
const CIFREI_GCM_IV_LENGTH = 12;
const CIFREI_KDF_SALT_LENGTH = 16;
const CIFREI_KDF_ITERATIONS = 310000;

function getCryptoObject() {
  return (
    (typeof window !== 'undefined' && window.crypto) ||
    (typeof self !== 'undefined' && self.crypto) ||
    null
  );
}

function getSubtleCrypto() {
  const globalCrypto = getCryptoObject();

  if (!globalCrypto || !globalCrypto.subtle) {
    throw new Error(
      "Web Crypto API indisponível. Abra o Cifrei em https:// ou http://localhost."
    );
  }

  return globalCrypto.subtle;
}

function getSecureRandomBytes(length) {
  const cryptoObj = getCryptoObject();
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') {
    throw new Error('Fonte criptográfica aleatória indisponível.');
  }

  const bytes = new Uint8Array(length);
  cryptoObj.getRandomValues(bytes);
  return bytes;
}

function bytesToBase64Url(bytes) {
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlToBytes(base64url) {
  const normalized = String(base64url || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(paddingLength);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function normalizeSecretInput(value) {
  return String(value || '').trim().normalize('NFC');
}

function sanitizeKeyInput(value) {
  return String(value || '')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, CIFREI_KEY_MAX_LENGTH);
}

function isValidKey(value) {
  const key = String(value || '').trim();

  return (
    key.length >= CIFREI_KEY_MIN_LENGTH &&
    key.length <= CIFREI_KEY_MAX_LENGTH &&
    /^[A-Za-z0-9_-]+$/.test(key)
  );
}

function generateKey() {
  const randomBytes = getSecureRandomBytes(CIFREI_KEY_MAX_LENGTH);
  let result = '';

  for (let i = 0; i < CIFREI_KEY_MAX_LENGTH; i++) {
    result += CIFREI_KEY_ALPHABET[randomBytes[i] % CIFREI_KEY_ALPHABET.length];
  }

  return result;
}

async function deriveAesKeyFromPassphraseAndKey(passphrase, chave, saltBytes) {
  const subtle = getSubtleCrypto();
  const enc = new TextEncoder();
  const keyMaterialString = `CIFREI4|${normalizeSecretInput(passphrase)}|${sanitizeKeyInput(chave)}`;

  const keyMaterial = await subtle.importKey(
    'raw',
    enc.encode(keyMaterialString),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: CIFREI_KDF_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(textoAberto, chave, passphrase) {
  const normalizedSecret = normalizeSecretInput(passphrase);
  const normalizedKey = sanitizeKeyInput(chave);

  if (!normalizedSecret) throw new Error('Frase segredo inválida ou vazia.');
  if (!isValidKey(normalizedKey)) throw new Error('Chave inválida.');

  const subtle = getSubtleCrypto();
  const enc = new TextEncoder();
  const salt = getSecureRandomBytes(CIFREI_KDF_SALT_LENGTH);
  const iv = getSecureRandomBytes(CIFREI_GCM_IV_LENGTH);
  const aesKey = await deriveAesKeyFromPassphraseAndKey(normalizedSecret, normalizedKey, salt);

  const cipherBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: enc.encode('C4'),
      tagLength: 128
    },
    aesKey,
    enc.encode(String(textoAberto || '').normalize('NFC'))
  );

  const cipherBytes = new Uint8Array(cipherBuffer);
  const payload = new Uint8Array(1 + salt.length + iv.length + cipherBytes.length);
  payload[0] = CIFREI_CODE_VERSION;
  payload.set(salt, 1);
  payload.set(iv, 1 + salt.length);
  payload.set(cipherBytes, 1 + salt.length + iv.length);

  return bytesToBase64Url(payload);
}

function tryParseCompactCode(textoCifrado) {
  const payload = base64UrlToBytes(String(textoCifrado || '').trim());
  const minimumLength = 1 + CIFREI_KDF_SALT_LENGTH + CIFREI_GCM_IV_LENGTH + 16;
  if (payload.length < minimumLength) throw new Error('Código muito curto.');
  if (payload[0] !== CIFREI_CODE_VERSION) throw new Error('Versão de código incompatível.');

  return {
    salt: payload.slice(1, 1 + CIFREI_KDF_SALT_LENGTH),
    iv: payload.slice(1 + CIFREI_KDF_SALT_LENGTH, 1 + CIFREI_KDF_SALT_LENGTH + CIFREI_GCM_IV_LENGTH),
    ciphertext: payload.slice(1 + CIFREI_KDF_SALT_LENGTH + CIFREI_GCM_IV_LENGTH)
  };
}

async function decryptLegacyCIFREI3(textoCifrado, chave, passphrase) {
  const normalizedKey = sanitizeKeyInput(chave);
  if (!isValidKey(normalizedKey)) throw new Error('Chave inválida.');
  const encodedPayload = textoCifrado.slice('CIFREI3.'.length);
  const payloadBytes = base64UrlToBytes(encodedPayload);
  const payload = JSON.parse(new TextDecoder().decode(payloadBytes));

  const salt = base64UrlToBytes(payload.salt);
  const iv = base64UrlToBytes(payload.iv);
  const ciphertextBytes = base64UrlToBytes(payload.ct);
  const aesKey = await deriveAesKeyFromPassphraseAndKey(passphrase, normalizedKey, salt);
  const subtle = getSubtleCrypto();
  const enc = new TextEncoder();

  const plainBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: enc.encode('CIFREI3'), tagLength: 128 },
    aesKey,
    ciphertextBytes
  );

  return new TextDecoder().decode(plainBuffer);
}

async function decrypt(textoCifrado, chave, passphrase) {
  const normalizedSecret = normalizeSecretInput(passphrase);
  const normalizedKey = sanitizeKeyInput(chave);

  if (!normalizedSecret) throw new Error('Frase segredo inválida ou vazia.');
  if (!isValidKey(normalizedKey)) throw new Error('Chave inválida.');

  if (String(textoCifrado || '').startsWith('CIFREI3.')) {
    return decryptLegacyCIFREI3(String(textoCifrado || '').trim(), normalizedKey, normalizedSecret);
  }

  const parsed = tryParseCompactCode(textoCifrado);
  const aesKey = await deriveAesKeyFromPassphraseAndKey(normalizedSecret, normalizedKey, parsed.salt);
  const subtle = getSubtleCrypto();
  const enc = new TextEncoder();

  const plainBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: parsed.iv, additionalData: enc.encode('C4'), tagLength: 128 },
    aesKey,
    parsed.ciphertext
  );

  return new TextDecoder().decode(plainBuffer);
}
