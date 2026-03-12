// inputMask.js

document.addEventListener('DOMContentLoaded', function () {

  if (typeof setupInputFraseSegredo === 'function') {
    setupInputFraseSegredo();
  }

  if (typeof setupTxtMsgEntradaMask === 'function') {
    setupTxtMsgEntradaMask();
  }

  if (typeof setupChaveEMsgEBtnCifrarValidation === 'function') {
    setupChaveEMsgEBtnCifrarValidation();
  }

  if (typeof setupChaveEMsgEBtnDecifrarValidation === 'function') {
    setupChaveEMsgEBtnDecifrarValidation();
  }

});

document.addEventListener('DOMContentLoaded', function () {
  const campo = document.getElementById('inputFraseSegredo');
  if (!campo) return;

  campo.addEventListener('input', function () {
    let valor = this.value;
    valor = valor.replace(/ /g, '_');
    valor = valor.replace(/[^a-zA-Z0-9_]/g, '');
    valor = valor.replace(/_+/g, '_');
    this.value = valor;
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const campo = document.getElementById('inputFraseSegredoDec');
  if (!campo) return;

  campo.addEventListener('input', function () {
    let valor = this.value;
    valor = valor.replace(/ /g, '_');
    valor = valor.replace(/[^a-zA-Z0-9_]/g, '');
    valor = valor.replace(/_+/g, '_');
    this.value = valor;
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const campo = document.getElementById('txtMsgEntrada');
  if (!campo) return;

  campo.addEventListener('input', function () {
    // A mensagem/código pode conter qualquer caractere Unicode.
    // Mantemos o listener apenas para preservar o fluxo de eventos do app,
    // sem aplicar filtros ou substituições no conteúdo digitado/colado.
    this.value = this.value;
  });
});

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

    const msgTemConteudo = (txtMsgEntrada.value || '').trim().length > 0;
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
