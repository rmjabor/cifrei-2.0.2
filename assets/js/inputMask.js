// inputMask.js

document.addEventListener('DOMContentLoaded', function () {

  if (typeof setupInputFraseSegredo === 'function') {    //não sei pra que serve
    setupInputFraseSegredo();
  }

  if (typeof setupTxtMsgEntradaMask === 'function') {    //não serve pra mais nada
    setupTxtMsgEntradaMask();
  }

  if (typeof setupChaveEMsgEBtnCifrarValidation === 'function') {
    setupChaveEMsgEBtnCifrarValidation();
  }

  if (typeof setupChaveEMsgEBtnDecifrarValidation === 'function') {
    setupChaveEMsgEBtnDecifrarValidation();
  }

});


//
// 1.1) Limita digitação do usuário no input frase modal
//
document.addEventListener('DOMContentLoaded', function () {
  const campo = document.getElementById('inputFraseSegredo');

  if (!campo) return;

  campo.addEventListener('input', function () {
    let valor = this.value;

    // 1) Troca qualquer espaço por underline
    valor = valor.replace(/ /g, '_');

    // 2) Permite apenas:
    //    - letras a-zA-Z
    //    - números 0-9
    //    - underline (_)
    valor = valor.replace(/[^a-zA-Z0-9_]/g, '');

    // 3) Converte múltiplos underlines consecutivos em apenas um (opcional)
    valor = valor.replace(/_+/g, '_');

    this.value = valor;
  });
});

//
// 1.2) Limita digitação do usuário no input frase segredo dec modal
//
document.addEventListener('DOMContentLoaded', function () {
  const campo = document.getElementById('inputFraseSegredoDec');

  if (!campo) return;

  campo.addEventListener('input', function () {
    let valor = this.value;

    // 1) Troca qualquer espaço por underline
    valor = valor.replace(/ /g, '_');

    // 2) Permite apenas:
    //    - letras a-zA-Z
    //    - números 0-9
    //    - underline (_)
    valor = valor.replace(/[^a-zA-Z0-9_]/g, '');

    // 3) Converte múltiplos underlines consecutivos em apenas um (opcional)
    valor = valor.replace(/_+/g, '_');

    this.value = valor;
  });
});

//
// 2) Limitar os caracteres para o campo de texto/mensagem (#txtMsgEntrada)
//    (máscara pura, sem mexer no estado do botão)

document.addEventListener('DOMContentLoaded', function () {
  const campo = document.getElementById('txtMsgEntrada');

  if (!campo) return;

  campo.addEventListener('input', function () {
    let valor = this.value;

    // 1) Troca qualquer espaço por underline
    valor = valor.replace(/ /g, '_');

    // 2) Permite apenas:
    //    - letras a-zA-Z
    //    - números 0-9
    //    - underline (_)
    //    - outros chars especiais !@#$%&*()-+=
    valor = valor.replace(/[^A-Za-z0-9!@#$%&*()\-+=_ ]/g, '');

    // 3) Converte múltiplos underlines consecutivos em apenas um (opcional)
    valor = valor.replace(/_+/g, '_');

    // 4) Converte múltiplos hífens consecutivos em apenas um (opcional)
    valor = valor.replace(/-+/g, '-');

    this.value = valor;
  });
});


//
// 3) Validação combinada de txtChave + txtMsgEntrada controlando o estado do #btnCifrar
//
function setupChaveEMsgEBtnCifrarValidation() {

  const txtChave      = document.getElementById('txtChave');
  const txtMsgEntrada = document.getElementById('txtMsgEntrada'); // pode não existir em algumas páginas
  const btnCifrar     = document.getElementById('btnCifrar');

  if (!txtChave || !btnCifrar) return;

  // --- Montagem do botão: ícone existente + span de texto ---

  // Captura o ícone que já EXISTE dentro do botão (i, svg, etc.)
  const iconEl  = btnCifrar.querySelector('i, svg, span.bi, .icon, .icone');
  let iconHTML  = '';

  if (iconEl) {
    iconHTML = iconEl.outerHTML; // markup completo do ícone original
  }

  // Garante que o botão passe a ter um <span> só para o texto
  let labelSpan = btnCifrar.querySelector('#lblBtnCifrar');

  if (!labelSpan) {
    labelSpan = document.createElement('span');
    labelSpan.id = 'lblBtnCifrar';

    // Limpamos o conteúdo atual e remontamos: ícone + span de texto
    btnCifrar.innerHTML = '';
    if (iconHTML) {
      btnCifrar.insertAdjacentHTML('beforeend', iconHTML);
    }
    btnCifrar.appendChild(labelSpan);
  }

  function setLabel(texto) {
    labelSpan.textContent = texto;
  }

  // --- Função central de validação de chave + mensagem ---
  function validarCamposEAtualizarBotao() {
    let valorChave = txtChave.value;

    // 1) Filtra caracteres permitidos da chave
    // abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*()-_=+
    valorChave = valorChave.replace(/[^A-Za-z0-9!@#$%&*()+=_-]/g, '');

    // 2) Limita a 75 caracteres
    if (valorChave.length > 75) {
      valorChave = valorChave.slice(0, 75);
    }

    // Atualiza o campo, caso tenha havido corte/remoção
    if (txtChave.value !== valorChave) {
      txtChave.value = valorChave;
    }

    // --- Regras de prioridade baseadas na CHAVE ---

    // 3) Está vazio → "Digite uma chave"
    if (!valorChave) {
      btnCifrar.disabled = true;
      setLabel(' Digite uma chave');
      return;
    }

    // 4) Tamanho diferente de 75 → inválida
    if (valorChave.length !== 75) {
      btnCifrar.disabled = true;
      setLabel(' Chave inválida');
      return;
    }

    // 5) Verificar repetição de caracteres
    const conjunto = new Set(valorChave.split(''));
    const temRepetidos = (conjunto.size !== 75);

    if (temRepetidos) {
      btnCifrar.disabled = true;
      setLabel(' Chave inválida');
      return;
    }

    // --- Se chegou aqui → chave perfeita ---

    // Se não existe campo de mensagem nessa página,
    // mantemos o comportamento antigo: chave ok → botão habilitado.
    if (!txtMsgEntrada) {
      btnCifrar.disabled = false;
      setLabel(' Cifrar');
      return;
    }

    // 6) Agora avaliamos o texto da mensagem
    const msgValorBruto = txtMsgEntrada.value || '';
    const msgTemConteudo = msgValorBruto.trim().length > 0;

    if (!msgTemConteudo) {
      btnCifrar.disabled = true;
      setLabel(' Digite um texto para cifragem');
      return;
    }

    // 7) Chave válida + texto com pelo menos um caractere → pode cifrar
    btnCifrar.disabled = false;
    setLabel(' Cifrar');
  }

  // Dispara a validação sempre que a chave mudar
  txtChave.addEventListener('input', validarCamposEAtualizarBotao);

  // E sempre que a mensagem mudar (para ligar txtMsgEntrada ao estado do botão)
  if (txtMsgEntrada) {
    txtMsgEntrada.addEventListener('input', validarCamposEAtualizarBotao);
  }

  // E uma vez na carga da página
  validarCamposEAtualizarBotao();
}
//
// 4) Validação combinada de txtChave + txtMsgEntrada controlando o estado do #btnDecifrar
//
function setupChaveEMsgEBtnDecifrarValidation() {

  const txtChave      = document.getElementById('txtChave');
  const txtMsgEntrada = document.getElementById('txtMsgEntrada'); // pode não existir em algumas páginas
  const btnDecifrar     = document.getElementById('btnDecifrar');

  if (!txtChave || !btnDecifrar) return;

  // --- Montagem do botão: ícone existente + span de texto ---

  // Captura o ícone que já EXISTE dentro do botão (i, svg, etc.)
  const iconEl  = btnDecifrar.querySelector('i, svg, span.bi, .icon, .icone');
  let iconHTML  = '';

  if (iconEl) {
    iconHTML = iconEl.outerHTML; // markup completo do ícone original
  }

  // Garante que o botão passe a ter um <span> só para o texto
  let labelSpan = btnDecifrar.querySelector('#lblBtnDecifrar');

  if (!labelSpan) {
    labelSpan = document.createElement('span');
    labelSpan.id = 'lblBtnDecifrar';

    // Limpamos o conteúdo atual e remontamos: ícone + span de texto
    btnDecifrar.innerHTML = '';
    if (iconHTML) {
      btnDecifrar.insertAdjacentHTML('beforeend', iconHTML);
    }
    btnDecifrar.appendChild(labelSpan);
  }

  function setLabel(texto) {
    labelSpan.textContent = texto;
  }

  // --- Função central de validação de chave + mensagem ---
  function validarCamposEAtualizarBotao() {
    let valorChave = txtChave.value;

    // 1) Filtra caracteres permitidos da chave
    // abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*()-_=+
    valorChave = valorChave.replace(/[^A-Za-z0-9!@#$%&*()+=_-]/g, '');

    // 2) Limita a 75 caracteres
    if (valorChave.length > 75) {
      valorChave = valorChave.slice(0, 75);
    }

    // Atualiza o campo, caso tenha havido corte/remoção
    if (txtChave.value !== valorChave) {
      txtChave.value = valorChave;
    }

    // --- Regras de prioridade baseadas na CHAVE ---

    // 3) Está vazio → "Digite uma chave"
    if (!valorChave) {
      btnDecifrar.disabled = true;
      setLabel(' Digite uma chave');
      return;
    }

    // 4) Tamanho diferente de 75 → inválida
    if (valorChave.length !== 75) {
      btnDecifrar.disabled = true;
      setLabel(' Chave inválida');
      return;
    }

    // 5) Verificar repetição de caracteres
    const conjunto = new Set(valorChave.split(''));
    const temRepetidos = (conjunto.size !== 75);

    if (temRepetidos) {
      btnDecifrar.disabled = true;
      setLabel(' Chave inválida');
      return;
    }

    // --- Se chegou aqui → chave perfeita ---

    // Se não existe campo de mensagem nessa página,
    // mantemos o comportamento antigo: chave ok → botão habilitado.
    if (!txtMsgEntrada) {
      btnDecifrar.disabled = false;
      setLabel(' Decifrar');
      return;
    }

    // 6) Agora avaliamos o texto da mensagem
    const msgValorBruto = txtMsgEntrada.value || '';
    const msgTemConteudo = msgValorBruto.trim().length > 0;

    if (!msgTemConteudo) {
      btnDecifrar.disabled = true;
      setLabel(' Digite um texto para decifragem');
      return;
    }

    // 7) Chave válida + texto com pelo menos um caractere → pode cifrar
    btnDecifrar.disabled = false;
    setLabel(' Decifrar');
  }

  // Dispara a validação sempre que a chave mudar
  txtChave.addEventListener('input', validarCamposEAtualizarBotao);

  // E sempre que a mensagem mudar (para ligar txtMsgEntrada ao estado do botão)
  if (txtMsgEntrada) {
    txtMsgEntrada.addEventListener('input', validarCamposEAtualizarBotao);
  }

  // E uma vez na carga da página
  validarCamposEAtualizarBotao();
}
