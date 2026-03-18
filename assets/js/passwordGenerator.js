const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUM   = "0123456789";
const SPEC  = "!@#$%&*-_";

let passwordGeneratorInitialized = false;
let passwordGeneratorParamsLoaded = false;
const PASSWORD_GEN_DEFAULTS = Object.freeze({
  total: 8,
  upper: 1,
  number: 1,
  special: 1
});

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

function getCurrentPasswordGenParams() {
  return {
    total: num("inputCaracTotais"),
    upper: num("inputMaiusc"),
    number: num("inputNumero"),
    special: num("inputEspec")
  };
}

function normalizePasswordGenParamsLocal(params) {
  const src = params && typeof params === "object" ? params : {};

  let total = Number.parseInt(src.total, 10);
  let upper = Number.parseInt(src.upper, 10);
  let number = Number.parseInt(src.number, 10);
  let special = Number.parseInt(src.special, 10);

  if (!Number.isFinite(total)) total = PASSWORD_GEN_DEFAULTS.total;
  if (!Number.isFinite(upper)) upper = PASSWORD_GEN_DEFAULTS.upper;
  if (!Number.isFinite(number)) number = PASSWORD_GEN_DEFAULTS.number;
  if (!Number.isFinite(special)) special = PASSWORD_GEN_DEFAULTS.special;

  total = Math.min(30, Math.max(4, total));
  upper = Math.min(9, Math.max(0, upper));
  number = Math.min(9, Math.max(0, number));
  special = Math.min(9, Math.max(0, special));

  const sum = upper + number + special;
  if (sum > total) total = Math.min(30, sum);

  return { total, upper, number, special };
}

function applyPasswordGenParams(params) {
  const normalized = normalizePasswordGenParamsLocal(params);
  setVal("inputCaracTotais", normalized.total);
  setVal("inputMaiusc", normalized.upper);
  setVal("inputNumero", normalized.number);
  setVal("inputEspec", normalized.special);
  return normalized;
}

function sanitizeNumericInput(id, maxDigits, options = {}) {
  const el = document.getElementById(id);
  if (!el) return;

  const {
    clampOnInput = false,
    clampOnBlur = true,
    clampOnlyWhenMaxDigitsReached = false
  } = options;

  el.setAttribute("maxlength", String(maxDigits));

  el.addEventListener("input", function () {
    let v = this.value.replace(/\D/g, "");
    if (maxDigits) v = v.slice(0, maxDigits);
    this.value = v;

    if (clampOnInput) {
      const shouldClamp =
        !clampOnlyWhenMaxDigitsReached || v.length >= maxDigits;

      if (shouldClamp) {
        enforcePasswordRules();
        generatePassword();
      }
    }
  });

  if (clampOnBlur) {
    el.addEventListener("blur", function () {
      if (this.value === "") {
        if (id === "inputCaracTotais") this.value = String(PASSWORD_GEN_DEFAULTS.total);
        else this.value = "0";
      }

      enforcePasswordRules();
      generatePassword();
    });
  }
}

function enforcePasswordRules() {
  return applyPasswordGenParams(getCurrentPasswordGenParams());
}

function generatePassword() {
  const params = enforcePasswordRules();

  const total   = params.total;
  const upper   = params.upper;
  const number  = params.number;
  const special = params.special;
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
  applyPasswordGenParams(PASSWORD_GEN_DEFAULTS);
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

async function loadPasswordGeneratorParams() {
  let params = PASSWORD_GEN_DEFAULTS;

  if (typeof getProfilePasswordGenParams === "function") {
    try {
      params = await getProfilePasswordGenParams();
    } catch (err) {
      console.warn("[Cifrei] Não foi possível carregar os parâmetros do gerador de senha:", err);
    }
  }

  passwordGeneratorParamsLoaded = true;
  applyPasswordGenParams(params);
  generatePassword();
  return normalizePasswordGenParamsLocal(params);
}

async function persistPasswordGeneratorParams() {
  const params = normalizePasswordGenParamsLocal(getCurrentPasswordGenParams());
  applyPasswordGenParams(params);

  if (typeof saveProfilePasswordGenParams === "function") {
    try {
      await saveProfilePasswordGenParams(params);
    } catch (err) {
      console.warn("[Cifrei] Não foi possível salvar os parâmetros do gerador de senha:", err);
    }
  }

  return params;
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

  sanitizeNumericInput("inputCaracTotais", 2, {
    clampOnInput: true,
    clampOnBlur: true,
    clampOnlyWhenMaxDigitsReached: true
  });

  sanitizeNumericInput("inputMaiusc", 1, {
    clampOnInput: true,
    clampOnBlur: true
  });

  sanitizeNumericInput("inputNumero", 1, {
    clampOnInput: true,
    clampOnBlur: true
  });

  sanitizeNumericInput("inputEspec", 1, {
    clampOnInput: true,
    clampOnBlur: true
  });

  document.getElementById("divIconeRefresh").addEventListener("click", generatePassword);
  document.getElementById("btnUsarSenhaGerada").addEventListener("click", async () => {
    await persistPasswordGeneratorParams();
    useGeneratedPassword();
  });

  document.getElementById("iconPlusCaracTotais").addEventListener("click", () => inc("inputCaracTotais", 30));
  document.getElementById("iconPlusMaiusc").addEventListener("click", () => inc("inputMaiusc", 9));
  document.getElementById("iconPlusNumero").addEventListener("click", () => inc("inputNumero", 9));
  document.getElementById("iconPlusEspec").addEventListener("click", () => inc("inputEspec", 9));

  document.getElementById("iconMinusCaracTotais").addEventListener("click", decTotal);
  document.getElementById("iconMinusMaiusc").addEventListener("click", () => decGeneric("inputMaiusc"));
  document.getElementById("iconMinusNumero").addEventListener("click", () => decGeneric("inputNumero"));
  document.getElementById("iconMinusEspec").addEventListener("click", () => decGeneric("inputEspec"));

  passwordGeneratorInitialized = true;

  if (passwordGeneratorParamsLoaded) {
    generatePassword();
  } else {
    resetPasswordPopup();
  }
}
