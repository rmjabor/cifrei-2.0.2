const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUM   = "0123456789";
const SPEC  = "!@#$%&*-_";

let passwordGeneratorInitialized = false;

function secureRandom(max) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

function randomChar(str) {
  return str[secureRandom(str.length)];
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function num(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  return parseInt(el.value, 10) || 0;
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function sanitizeNumericInput(id, maxDigits) {
  const el = document.getElementById(id);
  if (!el) return;

  el.setAttribute("maxlength", String(maxDigits));

  el.addEventListener("input", function () {
    let v = this.value.replace(/\D/g, "");
    if (maxDigits) v = v.slice(0, maxDigits);
    this.value = v;

    enforcePasswordRules();
    generatePassword();
  });
}

function enforcePasswordRules() {
  let total   = Math.min(30, Math.max(4, num("inputCaracTotais")));
  let upper   = Math.min(9, Math.max(0, num("inputMaiusc")));
  let number  = Math.min(9, Math.max(0, num("inputNumero")));
  let special = Math.min(9, Math.max(0, num("inputEspec")));

  const sum = upper + number + special;

  if (sum > total) {
    total = sum;
  }

  if (total > 30) {
    total = 30;
  }

  setVal("inputCaracTotais", total);
  setVal("inputMaiusc", upper);
  setVal("inputNumero", number);
  setVal("inputEspec", special);
}

function generatePassword() {
  enforcePasswordRules();

  const total   = num("inputCaracTotais");
  const upper   = num("inputMaiusc");
  const number  = num("inputNumero");
  const special = num("inputEspec");
  const lower   = total - upper - number - special;

  let chars = [];

  for (let i = 0; i < upper; i++) chars.push(randomChar(UPPER));
  for (let i = 0; i < number; i++) chars.push(randomChar(NUM));
  for (let i = 0; i < special; i++) chars.push(randomChar(SPEC));
  for (let i = 0; i < lower; i++) chars.push(randomChar(LOWER));

  shuffle(chars);

  const out = document.getElementById("inputSenhaAleatGerada");
  if (out) out.value = chars.join("");
}

function inc(id, max) {
  let v = num(id);
  if (v < max) {
    setVal(id, v + 1);
    enforcePasswordRules();
    generatePassword();
  }
}

function decTotal() {
  const total = num("inputCaracTotais");
  const sum = num("inputMaiusc") + num("inputNumero") + num("inputEspec");
  const min = Math.max(4, sum);

  if (total > min) {
    setVal("inputCaracTotais", total - 1);
    generatePassword();
  }
}

function decGeneric(id) {
  let v = num(id);
  if (v > 0) {
    setVal(id, v - 1);
    enforcePasswordRules();
    generatePassword();
  }
}

function resetPasswordPopup() {
  setVal("inputCaracTotais", 8);
  setVal("inputMaiusc", 1);
  setVal("inputNumero", 1);
  setVal("inputEspec", 1);
  generatePassword();
}

function useGeneratedPassword() {
  const senhaEl = document.getElementById("inputSenhaAleatGerada");
  const destEl  = document.getElementById("txtMsgEntrada");

  if (senhaEl && destEl) {
    destEl.value = senhaEl.value;
    destEl.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function initPasswordGenerator() {
  if (passwordGeneratorInitialized) {
    generatePassword();
    return;
  }

  const requiredIds = [
    "inputCaracTotais",
    "inputMaiusc",
    "inputNumero",
    "inputEspec",
    "inputSenhaAleatGerada",
    "divIconeRefresh",
    "btnUsarSenhaGerada",
    "btnFecharSenhaAleat",
    "iconMinusCaracTotais",
    "iconPlusCaracTotais",
    "iconMinusMaiusc",
    "iconPlusMaiusc",
    "iconMinusNumero",
    "iconPlusNumero",
    "iconMinusEspec",
    "iconPlusEspec"
  ];

  for (const id of requiredIds) {
    if (!document.getElementById(id)) return;
  }

  sanitizeNumericInput("inputCaracTotais", 2);
  sanitizeNumericInput("inputMaiusc", 1);
  sanitizeNumericInput("inputNumero", 1);
  sanitizeNumericInput("inputEspec", 1);

  document.getElementById("divIconeRefresh").addEventListener("click", generatePassword);
  document.getElementById("btnUsarSenhaGerada").addEventListener("click", useGeneratedPassword);

  document.getElementById("iconPlusCaracTotais").addEventListener("click", () => inc("inputCaracTotais", 30));
  document.getElementById("iconPlusMaiusc").addEventListener("click", () => inc("inputMaiusc", 9));
  document.getElementById("iconPlusNumero").addEventListener("click", () => inc("inputNumero", 9));
  document.getElementById("iconPlusEspec").addEventListener("click", () => inc("inputEspec", 9));

  document.getElementById("iconMinusCaracTotais").addEventListener("click", decTotal);
  document.getElementById("iconMinusMaiusc").addEventListener("click", () => decGeneric("inputMaiusc"));
  document.getElementById("iconMinusNumero").addEventListener("click", () => decGeneric("inputNumero"));
  document.getElementById("iconMinusEspec").addEventListener("click", () => decGeneric("inputEspec"));

  passwordGeneratorInitialized = true;
  generatePassword();
}