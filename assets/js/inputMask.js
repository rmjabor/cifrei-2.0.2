// inputMask.js

function sanitizeAsciiPrintable(value) {
  return Array.from(String(value || ''))
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 0x20 && code <= 0x7E;
    })
    .join('');
}

function sanitizeAsciiPrintableWithNewlines(value) {
  const normalized = String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  let result = '';
  for (const ch of normalized) {
    const code = ch.charCodeAt(0);
    const isPrintableAscii = code >= 0x20 && code <= 0x7E;
    const isNewline = ch === '\n';

    if (!isPrintableAscii && !isNewline) continue;
    if (isNewline && result.length === 0) continue; // não permite return como 1º caractere

    result += ch;
  }

  return result;
}

function preserveCursorAfterSanitize(input, sanitizedValue) {
  const currentValue = String(input.value || '');
  if (sanitizedValue === currentValue) return;

  const cursorStart = typeof input.selectionStart === 'number' ? input.selectionStart : currentValue.length;
  const beforeCursorOriginal = currentValue.slice(0, cursorStart);
  const beforeCursorSanitized = input.id === 'txtMsgEntrada'
    ? sanitizeAsciiPrintableWithNewlines(beforeCursorOriginal)
    : sanitizeAsciiPrintable(beforeCursorOriginal);

  input.value = sanitizedValue;

  const newCursor = beforeCursorSanitized.length;
  if (typeof input.setSelectionRange === 'function') {
    input.setSelectionRange(newCursor, newCursor);
  }
}

function setupAsciiPrintableInput(inputId) {
  const campo = document.getElementById(inputId);
  if (!campo) return;

  campo.addEventListener('input', function () {
    preserveCursorAfterSanitize(this, sanitizeAsciiPrintable(this.value));
  });
}

function setupTxtMsgEntradaMask() {
  const campo = document.getElementById('txtMsgEntrada');
  if (!campo) return;

  campo.addEventListener('input', function () {
    preserveCursorAfterSanitize(this, sanitizeAsciiPrintableWithNewlines(this.value));
  });

  campo.addEventListener('paste', function () {
    requestAnimationFrame(() => {
      preserveCursorAfterSanitize(campo, sanitizeAsciiPrintableWithNewlines(campo.value));
      campo.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
}

function sanitizeCifreiKeyInput(value) {
  return String(value || '')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, 25);
}

function isValidCifreiKeyInput(value) {
  const sanitized = sanitizeCifreiKeyInput(value);
  return sanitized.length >= 8 && sanitized.length <= 25;
}

function setupSharedKeyValidation(config) {
  const txtChave = document.getElementById('txtChave');
  const txtMsgEntrada = document.getElementById('txtMsgEntrada');
  const button = document.getElementById(config.buttonId);
  if (!txtChave || !button) return;

  const iconEl = button.querySelector('i, svg, span.bi, .icon, .icone');
  const iconHTML = iconEl ? iconEl.outerHTML : '';
  let labelSpan = button.querySelector(`#${config.labelId}`);

  if (!labelSpan) {
    labelSpan = document.createElement('span');
    labelSpan.id = config.labelId;
    button.innerHTML = '';
    if (iconHTML) button.insertAdjacentHTML('beforeend', iconHTML);
    button.appendChild(labelSpan);
  }

  function setLabel(texto) {
    labelSpan.textContent = texto;
  }

  function validarCamposEAtualizarBotao() {
    const valorChave = sanitizeCifreiKeyInput(txtChave.value);
    if (txtChave.value !== valorChave) txtChave.value = valorChave;

    if (!valorChave) {
      button.disabled = true;
      setLabel(' Digite uma chave');
      return;
    }

    if (!isValidCifreiKeyInput(valorChave)) {
      button.disabled = true;
      setLabel(' Chave inválida');
      return;
    }

    if (!txtMsgEntrada) {
      button.disabled = false;
      setLabel(config.readyLabel);
      return;
    }

    const msgTemConteudo = String(txtMsgEntrada.value || '').trim().length > 0;
    if (!msgTemConteudo) {
      button.disabled = true;
      setLabel(config.emptyMessageLabel);
      return;
    }

    button.disabled = false;
    setLabel(config.readyLabel);
  }

  txtChave.addEventListener('input', validarCamposEAtualizarBotao);
  if (txtMsgEntrada) txtMsgEntrada.addEventListener('input', validarCamposEAtualizarBotao);
  validarCamposEAtualizarBotao();
}

function setupChaveEMsgEBtnCifrarValidation() {
  setupSharedKeyValidation({
    buttonId: 'btnCifrar',
    labelId: 'lblBtnCifrar',
    readyLabel: ' Cifrar',
    emptyMessageLabel: ' Digite uma mensagem'
  });
}

function setupChaveEMsgEBtnDecifrarValidation() {
  setupSharedKeyValidation({
    buttonId: 'btnDecifrar',
    labelId: 'lblBtnDecifrar',
    readyLabel: ' Decifrar',
    emptyMessageLabel: ' Digite um código'
  });
}

document.addEventListener('DOMContentLoaded', function () {
  setupAsciiPrintableInput('inputFraseSegredo');
  setupAsciiPrintableInput('inputFraseSegredoDec');
  setupTxtMsgEntradaMask();
  setupChaveEMsgEBtnCifrarValidation();
  setupChaveEMsgEBtnDecifrarValidation();
});
