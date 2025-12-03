/// uiBehaviour.js - versão enxuta Cifrei 2.0

document.addEventListener('DOMContentLoaded', function () {
  setupApagarMensagem();
  setupApagarChave();
  setupApagarMsgEditar();
  setupOrigemChaveRadios();
  setupDropdownChave();
  setupGenerateKeyButton();
  setupCifragemNavigation();
  setupIndexLogoNavigation()
  setupPassphraseStrength();
  setupFraseSegredoModal();
  setupFraseSegredoDecModal();
  setupCopiarMsgAberta();
  setupDecifrarPageForDecryption();
  setupCifraAbertaPage();
  setupEditarCifraPage();
  setupQrDownloadButton();
  
  // se você já tiver setupCifragemPageBottom em outro trecho, mantém a chamada:
  if (typeof setupCifragemPageBottom === 'function') {
    setupCifragemPageBottom();
  }
});

function animarTextarea(element) {
  if (!element) return;

  element.classList.remove('textarea-highlight'); // reinicia animação se clicado várias vezes

  // força relayout para permitir re-disparo da animação
  void element.offsetWidth;

  element.classList.add('textarea-highlight');

  // remove após a animação terminar
  setTimeout(() => {
    element.classList.remove('textarea-highlight');
  }, 450);
}

//
// 1) Ícone de lixeira para txtMsgEntrada
//
function setupApagarMensagem() {
  const campo = document.getElementById('txtMsgEntrada');
  const icone = document.getElementById('icnApagarMsg');

  if (!campo || !icone) return;

  function atualizarIcone() {
    icone.style.display = campo.value.trim() === "" ? "none" : "block";
  }

  atualizarIcone();

  campo.addEventListener('input', atualizarIcone);

  icone.addEventListener('click', function () {
    campo.value = "";
    atualizarIcone();
    campo.classList.add('apagando');
    setTimeout(() => campo.classList.remove('apagando'), 200);
    campo.dispatchEvent(new Event('input'));
  });
}

//
// 1c) Ícone de lixeira para txtMsgEditar (editarcifra.html)
//
function setupApagarMsgEditar() {
  const campo = document.getElementById('txtMsgBottom');
  const icone = document.getElementById('icnApagarMsgEditar');

  // Se não estamos na editarcifra.html, simplesmente sai
  if (!campo || !icone) return;

  function atualizarIcone() {
    icone.style.display = campo.value.trim() === "" ? "none" : "block";
  }

  // Estado inicial
  atualizarIcone();

  // Mostra/esconde o ícone conforme o usuário digita
  campo.addEventListener('input', atualizarIcone);

  // Clique no ícone: apagar + efeito visual
  icone.addEventListener('click', function () {
    campo.value = "";
    atualizarIcone();

    // mesmo efeito das outras lixeiras (.apagando já existe no CSS)
    campo.classList.add('apagando');
    setTimeout(() => campo.classList.remove('apagando'), 200);

    // dispara input pra qualquer lógica que dependa do conteúdo
    campo.dispatchEvent(new Event('input'));
  });
}

//
// 1b) Ícone de lixeira para txtChave
//
function setupApagarChave() {
  const campo    = document.getElementById('txtChave');
  const icone    = document.getElementById('icnApagarChave');
  const dropdown = document.getElementById('dpdownChave');

  if (!campo || !icone) return;

  function atualizarIcone() {
    const vazio = campo.value.trim() === "";
    icone.style.display = vazio ? "none" : "block";

    // Se a chave ficou vazia, apenas VOLTA o dropdown pro placeholder,
    // mas NÃO dispara 'change' de novo pra evitar loop infinito.
    if (vazio && dropdown) {
      dropdown.selectedIndex = 0;
      // !!! NÃO FAZ MAIS:
      // dropdown.dispatchEvent(new Event('change'));
    }
  }

  atualizarIcone();

  campo.addEventListener('input', atualizarIcone);

  icone.addEventListener('click', function () {
    campo.value = "";
    atualizarIcone();
    campo.classList.add('apagando');
    setTimeout(() => campo.classList.remove('apagando'), 200);
    campo.dispatchEvent(new Event('input'));
  });
}

//
// 2) Origem da chave (radios)
//
function setupOrigemChaveRadios() {
  const radios = document.querySelectorAll('input[name="origem-chave"]');
  const campoChave = document.getElementById('txtChave');
  const dropdown   = document.getElementById('dpdownChave');

  if (!radios.length || !campoChave) return;

  radios.forEach(radio => {
    radio.addEventListener('change', function () {
      // Sempre que trocar de origem, limpamos a chave
      campoChave.value = "";
      campoChave.dispatchEvent(new Event('input'));

      // E voltamos o dropdown para o placeholder
      if (dropdown) {
        dropdown.selectedIndex = 0;
        // aqui também NÃO dispara 'change',
        // porque você já está limpando txtChave manualmente.
      }

    });
  });

  // Seleciona automaticamente o primeiro radio (#formCheck-1)
  const radioInicial = document.getElementById('formCheck-1');
  if (radioInicial) {
    radioInicial.checked = true;
    radioInicial.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

//
// 3) Dropdown de chaves salvas (#dpdownChave)
//    - carrega do IndexedDB
//    - escolhe chave -> preenche txtChave
//    - se não houver registros, desabilita radio4
//
async function refreshChaveDropdownFromDB(dropdown, radio4) {
  if (typeof getAllCifragemRecordsSortedByName !== 'function') return;

  dropdown.innerHTML = "";

  const placeholder = document.createElement('option');
  placeholder.value = "";
  placeholder.textContent = "Selecione uma cifra...";
  dropdown.appendChild(placeholder);

  try {
    const records = await getAllCifragemRecordsSortedByName();
    if (!records || records.length === 0) {
      dropdown.disabled = true;
      if (radio4) radio4.disabled = true;
      placeholder.textContent = "Nenhuma cifra salva";
      return;
    }

    if (radio4) radio4.disabled = false;
    dropdown.disabled = false;

    records.forEach(rec => {
      const opt = document.createElement('option');
      opt.value = String(rec.id);
      opt.textContent = rec.name || '(sem nome)';
      opt.dataset.key75 = rec.key75 || '';
      dropdown.appendChild(opt);
    });

    dropdown.selectedIndex = 0;
  } catch (err) {
    console.error('[Cifrei] Erro ao carregar chaves salvas:', err);
    dropdown.disabled = true;
    if (radio4) radio4.disabled = true;
    placeholder.textContent = "Erro ao carregar cifras";
  }
}

async function getCifragemRecordById(id) {
  const numericId = Number(id);
  if (!numericId) return null;

  if (typeof getAllCifragemRecordsSortedByName !== 'function') {
    console.warn('[Cifrei] getAllCifragemRecordsSortedByName não disponível.');
    return null;
  }

  try {
    const list = await getAllCifragemRecordsSortedByName();
    return list.find(r => r.id === numericId) || null;
  } catch (e) {
    console.error('[Cifrei] Erro ao buscar registro por id:', e);
    return null;
  }
}

function setupDropdownChave() {
  const dropdown   = document.getElementById('dpdownChave');
  const campoChave = document.getElementById('txtChave');
  const radio4     = document.getElementById('formCheck-4');

  if (!dropdown || !campoChave) return;

  async function carregarOpcoes() {
    if (typeof getAllCifragemRecordsSortedByName !== 'function') {
      console.warn('[Cifrei] getAllCifragemRecordsSortedByName não disponível.');
      return;
    }

    dropdown.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecione uma cifra...';
    dropdown.appendChild(placeholder);

    try {
      const records = await getAllCifragemRecordsSortedByName();

      if (!records || records.length === 0) {
        dropdown.disabled = true;
        if (radio4) radio4.disabled = true;
        placeholder.textContent = 'Nenhuma cifra salva';
        return;
      }

      dropdown.disabled = false;
      if (radio4) radio4.disabled = false;

      records.forEach(rec => {
        const opt = document.createElement('option');
        opt.value = String(rec.id);
        opt.textContent = rec.name || '(sem nome)';
        opt.dataset.key75 = rec.key75 || '';
        dropdown.appendChild(opt);
      });

      dropdown.selectedIndex = 0;

      // Se viermos da home clicando em uma cifra incompleta,
      // há um contexto salvo em localStorage que deve pré-selecionar a opção
      try {
        const ctxRaw = localStorage.getItem('cifreiDecifrarContext');
        if (ctxRaw) {
          const ctx = JSON.parse(ctxRaw);
          if (ctx && ctx.type === 'saved-incomplete' && ctx.id != null) {
            const desiredId = String(ctx.id);

            // seleciona o option correspondente
            dropdown.value = desiredId;

            const option = dropdown.options[dropdown.selectedIndex];
            if (option && option.dataset.key75) {
              campoChave.value = option.dataset.key75;
              campoChave.dispatchEvent(new Event('input'));
            }

            const radio4 = document.getElementById('formCheck-4');
            if (radio4) {
              radio4.checked = true;
              // sem disparar 'change' pra não limpar a chave
            }

            // limpa o contexto para não reaproveitar depois
            localStorage.removeItem('cifreiDecifrarContext');
          }
        }
      } catch (e) {
        console.error('[Cifrei] Erro ao aplicar contexto de decifragem incompleta:', e);
      }

    } catch (err) {
      console.error('[Cifrei] Erro ao carregar chaves salvas:', err);
      dropdown.disabled = true;
      if (radio4) radio4.disabled = true;
      placeholder.textContent = 'Erro ao carregar cifras';
    }
  }

  // carrega na abertura
  carregarOpcoes();

  // quando o usuário escolhe uma cifra
  dropdown.addEventListener('change', function () {
    const option = dropdown.options[dropdown.selectedIndex];
    if (!option || !option.dataset.key75) {
      campoChave.value = '';
      campoChave.dispatchEvent(new Event('input'));
      return;
    }

    const key75 = option.dataset.key75;
    campoChave.value = key75;
    campoChave.dispatchEvent(new Event('input'));

    // só marca o radio4, SEM disparar change (para não limpar a chave de novo)
    if (radio4) {
      radio4.checked = true;
      // NÃO: radio4.dispatchEvent(new Event('change'))
    }
  });
}

//
// 4) Botão Gerar Chave + animação
//
function setupGenerateKeyButton() {
  const radio1        = document.getElementById('formCheck-1');
  const txtChave      = document.getElementById('txtChave');
  const btnGenerateKey = document.getElementById('btnGenerateKey');

  if (!radio1 || !txtChave || !btnGenerateKey) return;

  let typingTimer = null;

  function animarDigitacao(chave) {
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = null;
    }

    txtChave.value = "";
    txtChave.classList.add('digitando');

    let i = 0;
    const total = chave.length;

    typingTimer = setInterval(() => {
      txtChave.value += chave[i];
      i++;

      if (i >= total) {
        clearInterval(typingTimer);
        typingTimer = null;
        txtChave.classList.remove('digitando');
        txtChave.dispatchEvent(new Event('input'));
      }
    }, 15);
  }

  btnGenerateKey.addEventListener('click', function (event) {
    event.preventDefault();

    if (!radio1.checked) {
      radio1.checked = true;
      radio1.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (typeof generateKey !== 'function') {
      console.error('[Cifrei] generateKey() não está disponível.');
      return;
    }

    const chave = generateKey();
    animarDigitacao(chave);
  });
}

//
// 5) Página de baixo da cifragem (#cifragemPageBottom)
//
function setupCifragemPageBottom() {
  const pageTop        = document.getElementById('cifragemPageTop');
  const pageBottom     = document.getElementById('cifragemPageBottom');
  const icnVoltar      = document.getElementById('icnVoltarCifragemBottom');
  const icnCopiarChave = document.getElementById('icnCopiarChave');
  const icnCopiarMsg   = document.getElementById('icnCopiarMsg');
  const txtChaveBottom = document.getElementById('txtChaveBottom');
  const txtMsgBottom   = document.getElementById('txtMsgBottom');
  const chkSalvarChave = document.getElementById('formCheckSalvarChave');
  const btnSalvar      = document.getElementById('btnSalvarChaveCifragem');
  const inputNome      = document.getElementById('inputMdlNomeSalvarCifragem');
  const inputObs       = document.getElementById('inputMdlObsSalvarCifragem');

  
  // Começa sempre com a página de baixo oculta
    // 5.0 Comportamento específico da página de cifragem (tem pageBottom)
  if (pageBottom && pageTop) {
    // Começa sempre com a página de baixo oculta
    pageBottom.classList.add('d-none');

    // 5.1 Voltar para a página de cima (sem resetar a pageTop)
    if (icnVoltar) {
      icnVoltar.addEventListener('click', function (event) {
        event.preventDefault();

        if (txtChaveBottom) txtChaveBottom.value = '';
        if (txtMsgBottom)   txtMsgBottom.value   = '';
        if (inputNome)      inputNome.value      = '';
        if (inputObs)       inputObs.value       = '';
        if (chkSalvarChave) chkSalvarChave.checked = false;

        pageBottom.classList.add('d-none');
        pageTop.classList.remove('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }


  // 5.2 Copiar chave e mensagem
  if (icnCopiarChave && txtChaveBottom) {
    icnCopiarChave.addEventListener('click', function () {
      copiarTextoDoTextarea(txtChaveBottom);
      animarTextarea(txtChaveBottom);
    });
  }

  if (icnCopiarMsg && txtMsgBottom) {
    icnCopiarMsg.addEventListener('click', function () {
      copiarTextoDoTextarea(txtMsgBottom);
      animarTextarea(txtMsgBottom);
    });
  }

  // 5.3 Label do botão Salvar / Salvar somente a chave
  if (btnSalvar && chkSalvarChave) {
    // garante estrutura: ícone + span de texto
    let labelSpan = btnSalvar.querySelector('#lblBtnSalvarCifragem');
    if (!labelSpan) {
      labelSpan = document.createElement('span');
      labelSpan.id = 'lblBtnSalvarCifragem';
      btnSalvar.appendChild(labelSpan);
    }

    function setSalvarLabel(texto) {
      labelSpan.textContent = ' ' + texto;
    }

    setSalvarLabel('Salvar Cifra');

    chkSalvarChave.addEventListener('change', function () {
      if (chkSalvarChave.checked) {
        setSalvarLabel('Salvar somente a chave');
      } else {
        setSalvarLabel('Salvar Cifra');
      }
    });

    // 5.4 Clique em Salvar -> lógica de banco de dados + modal de substituição
    const modalSubst   = document.getElementById('mdlSubstCifra');
    const btnOkSubst   = document.getElementById('btnOkMdlSubstCifra');
    const btnVoltarSubst = document.getElementById('btnVoltarMdlSubstCifra');

    let registroParaSubstituirId = null;

    if (btnSalvar) {
      btnSalvar.addEventListener('click', async function (event) {
        event.preventDefault();
        await handleSalvarCifragemClick({
          inputNome,
          inputObs,
          txtChaveBottom,
          txtMsgBottom,
          chkSalvarChave,
          modalSubst,
          setRegistroId: (id) => { registroParaSubstituirId = id; }
        });
      });
    }

    if (modalSubst && btnOkSubst) {
      btnOkSubst.addEventListener('click', async function (event) {
        event.preventDefault();
        await handleConfirmarSubstituicaoCifraClick({
          registroId: registroParaSubstituirId,
          inputNome,
          inputObs,
          txtChaveBottom,
          txtMsgBottom,
          chkSalvarChave,
          modalSubst
        });
      });
    }

    if (modalSubst && btnVoltarSubst) {
      btnVoltarSubst.addEventListener('click', function (event) {
        event.preventDefault();
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalSubst);
        modalInstance.hide();

        // Foca e seleciona o nome repetido
        if (inputNome) {
          setTimeout(() => {
            inputNome.focus();
            inputNome.select();
          }, 200);
        }
      });
    }
  }
  const btnShowQr = document.getElementById('btnShowQrFromCifrar');
  if (btnShowQr) {
    btnShowQr.addEventListener('click', openQrCodeModal);
  }
}

//
// Funções auxiliares para copiar texto de textarea com animação simples
//
function copiarTextoDoTextarea(textarea) {  // Copiar chave e mensagem na página Cifragem
  if (!textarea) return;

  const valor = textarea.value || '';

  if (!navigator.clipboard) {
    textarea.select();
    document.execCommand('copy');
  } else {
    navigator.clipboard.writeText(valor).catch(err => {
      console.error('[Cifrei] Erro ao copiar para clipboard:', err);
    });
  }

  textarea.classList.add('copiado');
  setTimeout(() => textarea.classList.remove('copiado'), 200);
}

function setupCopiarMsgAberta() { // Copiar chave e mensagem da página Cifra aberta

  const btn = document.getElementById('icnCopiarMsgAberta');
  const txt = document.getElementById('txtMsgAberta');

  if (!btn || !txt) {
    console.warn('[Cifrei] Erro ao copiar para clipboard');
    return;
  }

  btn.addEventListener('click', () => copiarTextoDoTextarea(txt));
}


//
// 6) Barra de força da frase-segredo (passphrase)
//
function setupPassphraseStrength() {
  const input = document.getElementById('inputFraseSegredo');
  const btnOk = document.getElementById('btnOkModalFraseSegredo');

  if (!input || !btnOk) {
    console.warn('[Cifrei] Passphrase strength: input ou botão OK não encontrados.');
    return;
  }

  const wrapper = document.getElementById('passphraseStrengthWrapper'); // <-- NOVO
  const fill    = document.getElementById('passphraseStrengthFill');
  const label   = document.getElementById('passphraseStrengthLabel');

  const strengthClasses = ['strength-0', 'strength-1', 'strength-2', 'strength-3', 'strength-4'];
  const strengthColors  = ['#e63946', '#f77f00', '#ffbf00', '#4ce15b', '#9bb9d6'];

  function updateStrength() {
    const normalized  = (input.value || '').replace(/ /g, '_');
    const length      = normalized.length;
    const charsetSize = 27;
    const bits        = length > 0 ? Math.round(length * Math.log2(charsetSize)) : 0;

    let categoria = 'Muito fraca';
    let percent   = 0;
    let level     = 0;

    if (bits >= 80) {
      categoria = 'Muito forte';
      percent   = 100;
      level     = 4;
    } else if (bits >= 64) {
      categoria = 'Forte';
      percent   = 80;
      level     = 3;
    } else if (bits >= 48) {
      categoria = 'Razoável';
      percent   = 60;
      level     = 2;
    } else if (bits >= 32) {
      categoria = 'Fraca';
      percent   = 40;
      level     = 1;
    } else if (bits > 0) {
      categoria = 'Muito fraca';
      percent   = 20;
      level     = 0;
    } else {
      categoria = 'Muito fraca';
      percent   = 0;
      level     = 0;
    }

    // 🔹 controla o fade-in do wrapper
    if (wrapper) {
      if (bits === 0) {
        wrapper.classList.remove('is-active'); // some de novo se apagar tudo
      } else {
        wrapper.classList.add('is-active');    // aparece com fade na primeira digitação
      }
    }

    if (fill) {
      fill.style.width = percent + '%';

      if (Array.isArray(strengthColors) && strengthColors[level]) {
        fill.style.backgroundColor = strengthColors[level];
      }

      strengthClasses.forEach(cls => fill.classList.remove(cls));
      fill.classList.add(strengthClasses[level]);
    }

    if (label) {
  if (bits === 0) {
    label.textContent = ''; // começa em branco quando não há frase
  } else {
    label.textContent = `${categoria}: ${bits} bits entropia estimada com caracteres aleatórios`;
  }
}


    // habilita OK só a partir de "Razoável"
    btnOk.disabled = bits < 48;
  }

  btnOk.disabled = true;
  updateStrength();

  input.addEventListener('input', updateStrength);
}

// Utilitário: guarda dados da decifragem para a página cifraaberta.html
function setDecifragemTempData(data) {
  try {
    localStorage.setItem('cifrei_decifragem', JSON.stringify(data));
  } catch (e) {
    console.error('[Cifrei] Erro ao salvar dados de decifragem:', e);
  }
}

function getDecifragemTempData() {
  try {
    const raw = localStorage.getItem('cifrei_decifragem');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('[Cifrei] Erro ao ler dados de decifragem:', e);
    return null;
  }
}

function clearDecifragemTempData() {
  localStorage.removeItem('cifrei_decifragem');
}
//
// 7) Modal da frase-segredo (cifrar)
//
function setupFraseSegredoModal() {
  const modalEl    = document.getElementById('fraseSegredo');
  const btnOk      = document.getElementById('btnOkModalFraseSegredo');
  const btnSair    = document.getElementById('btnSairModalFraseSegredo');
  const campoPass  = document.getElementById('inputFraseSegredo');

  const txtChave      = document.getElementById('txtChave');
  const txtMsgEntrada = document.getElementById('txtMsgEntrada');
  const txtChaveBottom = document.getElementById('txtChaveBottom');
  const txtMsgBottom   = document.getElementById('txtMsgBottom');
  const pageTop        = document.getElementById('cifragemPageTop');
  const pageBottom     = document.getElementById('cifragemPageBottom');
  const inputNome      = document.getElementById('inputMdlNomeSalvarCifragem');

  if (!modalEl || !btnOk || !btnSair || !campoPass) return;

  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

  // Botão Sair: resetar estado do modal
  btnSair.addEventListener('click', function (event) {
    event.preventDefault();
    campoPass.value = '';
    campoPass.dispatchEvent(new Event('input'));
    bsModal.hide();
  });

  // Habilitar/desabilitar OK conforme força da passphrase (usando a label)
  const strengthLabel = document.getElementById('passphraseStrengthLabel');

  function atualizarEstadoOk() {
    const txt = strengthLabel ? strengthLabel.textContent || '' : '';
    // se contém 'Razoável' ou 'Forte/Muito forte', habilita
    const habilita =
      txt.includes('Razoável') ||
      txt.includes('Forte')    ||
      txt.includes('Muito forte')
    btnOk.disabled = !habilita;
  }

  campoPass.addEventListener('input', atualizarEstadoOk);
  atualizarEstadoOk();

  // Botão OK: rodar encrypt() e preencher pageBottom
  btnOk.addEventListener('click', async function (event) {
    event.preventDefault();

    const passphrase   = (campoPass.value || '').trim();
    const chave        = (txtChave.value || '').trim();
    const textoAberto  = (txtMsgEntrada.value || '').trim();

    if (!chave || !textoAberto || !passphrase) {
      console.warn('[Cifrei] Dados insuficientes para cifrar.');
      return;
    }

    try {
      console.log('[Cifrei] Chamando encrypt()...');
      const textoCifrado = await encrypt(textoAberto, chave, passphrase);

      txtChaveBottom.value = chave;
      txtMsgBottom.value   = textoCifrado;

      // Sugere nome da cifra se possível
      if (inputNome && typeof getNextCifragemDefaultName === 'function') {
        try {
          const sugestao = await getNextCifragemDefaultName();
          inputNome.value = sugestao;
        } catch (e) {
          console.error('[Cifrei] Erro ao obter nome padrão da cifra:', e);
        }
      }

      if (pageTop && pageBottom) {
        pageTop.classList.add('d-none');
        pageBottom.classList.remove('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      campoPass.value = '';
      campoPass.dispatchEvent(new Event('input'));
      bsModal.hide();

      console.log('[Cifrei] Fluxo de cifragem concluído com sucesso.');
    } catch (err) {
      console.error('[Cifrei] Erro ao cifrar:', err);
    }
  });

  initQrScanner('cifrar');
}

//
// Modal da frase-segredo para DECIFRAR
//
function setupFraseSegredoDecModal() {

  const MIN_DEC_SECRET_LENGTH = 4;

  const modalEl = document.getElementById('fraseSegredoDec');
  const input   = document.getElementById('inputFraseSegredoDec');
  const btnOk   = document.getElementById('btnOkModalFraseSegredoDec');
  const btnSair = document.getElementById('btnSairModalFraseSegredoDec');

  // Se a página não tem esse modal, não faz nada
  if (!modalEl || !input || !btnOk || !btnSair) return;

  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

  function atualizarEstadoBotao() {
    const len = (input.value || '').trim().length;
    btnOk.disabled = (len < MIN_DEC_SECRET_LENGTH);
  }

  input.addEventListener('input', atualizarEstadoBotao);
  atualizarEstadoBotao();

  btnSair.addEventListener('click', function (event) {
    event.preventDefault();
    input.value = '';
    atualizarEstadoBotao();
    bsModal.hide();
  });

  btnOk.addEventListener('click', async function (event) {
    event.preventDefault();

    const secret = (input.value || '').trim();
    if (!secret) return;

    const ctx = window.cifreiDecifragemContext;
    if (!ctx || !ctx.key75 || !ctx.ciphertext) {
      console.warn('[Cifrei] Contexto de decifragem ausente ou incompleto.');
      return;
    }

    try {
      const plaintext = await decrypt(ctx.ciphertext, ctx.key75, secret);

      // monta o pacote para a página cifraaberta.html
      setDecifragemTempData({
        type:      ctx.type || 'manual',
        id:        ctx.id || null,
        name:      ctx.name || '',
        notes:     ctx.notes || '',
        key75:     ctx.key75,
        ciphertext: ctx.ciphertext,
        plaintext: plaintext
      });

      // limpa contexto e modal
      window.cifreiDecifragemContext = null;
      input.value = '';
      atualizarEstadoBotao();
      bsModal.hide();

      // navega para a página de exibição
      window.location.href = 'cifraaberta.html';
    } catch (err) {
      console.error('[Cifrei] Erro ao decifrar:', err);
    }
  });
}

//
// Página decifrar.html – preparar contexto ao clicar em "Decifrar"
//
function setupDecifrarPageForDecryption() {
  const btnDecifrar = document.getElementById('btnDecifrar');
  const campoKey    = document.getElementById('txtChave');
  const campoMsg    = document.getElementById('txtMsgEntrada');
  const dropdown    = document.getElementById('dpdownChave');

  if (!btnDecifrar || !campoKey || !campoMsg) {
    // Não estamos na decifrar.html
    return;
  }

  // 🔹 Comportamento ESPECÍFICO da decifrar.html:
  // quando muda o dpdownChave, carregar key75 + ciphertext (se houver)
  if (dropdown && typeof getCifragemRecordById === 'function') {
    dropdown.addEventListener('change', async function () {
      const id = dropdown.value;

      // se nada selecionado, limpa só a mensagem
      if (!id) {
        campoMsg.value = '';
        campoMsg.dispatchEvent(new Event('input'));
        return;
      }

      const rec = await getCifragemRecordById(id);
      if (!rec) {
        console.warn('[Cifrei] Registro não encontrado para id', id, 'na decifrar.html');
        return;
      }

      // garante que a chave fique sincronizada com o registro (mesmo que
      // o setupDropdownChave já preencha via dataset.key75)
      if (rec.key75) {
        campoKey.value = rec.key75;
        campoKey.dispatchEvent(new Event('input'));
      }

      // aqui entra o que você queria: preencher o ciphertext, quando existir
      if (rec.ciphertext) {
        campoMsg.value = rec.ciphertext;
      } else {
        campoMsg.value = '';
      }
      campoMsg.dispatchEvent(new Event('input'));
    });
  }


  btnDecifrar.addEventListener('click', async function (event) {
    event.preventDefault();

    const key75      = (campoKey.value || '').trim();
    const ciphertext = (campoMsg.value || '').trim();

    const radio4   = document.getElementById('formCheck-4');


    let ctx = null;

    // Caso: cifra INCOMPLETA salva (radio4 marcado e select com um id)
    if (radio4 && radio4.checked && dropdown && dropdown.value) {
      const id = Number(dropdown.value);
      let rec = null;

      if (typeof getAllCifragemRecordsSortedByName === 'function') {
        try {
          const list = await getAllCifragemRecordsSortedByName();
          rec = list.find(r => r.id === id) || null;
        } catch (e) {
          console.error('[Cifrei] Erro ao buscar registro para decifragem incompleta:', e);
        }
      }

      ctx = {
        type:       'saved-incomplete',
        id:         rec ? rec.id : id,
        name:       rec && rec.name  ? rec.name  : '',
        notes:      rec && rec.notes ? rec.notes : '',
        key75:      key75,
        ciphertext: ciphertext
      };
    } else {
      // Caso: decifragem MANUAL (não associada a cifra salva)
      ctx = {
        type:       'manual',
        id:         null,
        name:       '',
        notes:      '',
        key75:      key75,
        ciphertext: ciphertext
      };
    }

    // guarda contexto global para o modal usar
    window.cifreiDecifragemContext = ctx;

    // abre o modal de frase-segredo dec
    const modalEl = document.getElementById('fraseSegredoDec');
    if (modalEl && window.bootstrap && bootstrap.Modal) {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.show();
    } else {
      console.warn('[Cifrei] Modal fraseSegredoDec não encontrado ou Bootstrap ausente na decifrar.html.');
    }
  });

  initQrScanner('decifrar');
}

//
// Página cifraaberta.html – exibir resultado da decifragem
//
function setupCifraAbertaPage() {
  const txtPlain   = document.getElementById('txtMsgAberta');
  const txtKey     = document.getElementById('txtChaveBottom');
  const txtMsgC    = document.getElementById('txtMsgBottom');
  const inputNome  = document.getElementById('inputlNomeCifraAberta');
  const divNome    = document.getElementById('divInputNomeCifraAberta');
  const inputObs   = document.getElementById('inputObsCifraAberta');
  const divObs     = document.getElementById('divInputObsCifraAberta');
  const btnEditar  = document.getElementById('btnEditarCifra');

  // Se não achou esses elementos, não estamos na cifraaberta.html
  if (!txtPlain || !txtKey || !txtMsgC) {
    return;
  }

  const data = getDecifragemTempData();
  if (!data) {
    console.warn('[Cifrei] Nenhum dado de decifragem encontrado para cifraaberta.html.');
    return;
  }

  // Preenche campos principais
  txtKey.value   = data.key75      || '';
  txtMsgC.value  = data.ciphertext || '';
  txtPlain.value = data.plaintext  || '';

  // Nome da cifra (quando existir)
  if (inputNome) {
    inputNome.value = data.name || '';
    if (divNome && !data.name) {
      divNome.classList.add('d-none');
    }
  }

  // Observações (quando existirem)
  if (inputObs) {
    inputObs.value = data.notes || '';
    if (divObs && !data.notes) {
      divObs.classList.add('d-none');
    }
  }

  // Botão Editar → vai para editarcifra.html com base no id salvo
  if (btnEditar) {
    const recId = (data.id != null) ? Number(data.id) : null;

    if (recId != null && !Number.isNaN(recId)) {
      btnEditar.addEventListener('click', function (event) {
        event.preventDefault();

        const ctx = { id: recId };
        try {
          localStorage.setItem('cifreiEditarContext', JSON.stringify(ctx));
        } catch (e) {
          console.error('[Cifrei] Erro ao salvar contexto de edição:', e);
        }

        window.location.href = 'editarcifra.html';
      });
    } else {
      // Se não há id (decifragem manual), opcionalmente esconde o botão
      // btnEditar.classList.add('d-none');
      console.warn('[Cifrei] Cifra aberta sem id associado; edição via banco não disponível.');
    }
  }

  // Limpa os dados temporários depois de usar
  clearDecifragemTempData();
}

//
// PÁGINA editarcifra.html
//
function setupEditarCifraPage() {
  // Campos da página de edição
  const inputNome = document.getElementById('inputlNomeCifraAberta');
  const txtChave  = document.getElementById('txtChaveBottom');      // só exibe
  const txtMsg    = document.getElementById('txtMsgBottom');        // pode ser apagada
  const inputObs  = document.getElementById('inputObsCifraAberta');
  const pCriada   = document.getElementById('criadaEm');
  const pEditada  = document.getElementById('editadaEm');
  const btnEditar = document.getElementById('btnEditarCifra');

  // Marcador exclusivo da editarcifra.html
  const marcadorEditar = document.getElementById('icnApagarMsgEditar');

  // Se não estamos na editarcifra.html, sai
  if (!btnEditar || !marcadorEditar) return;

  let originalRecord = null;
  btnEditar.disabled = true;

  // --- Carregar registro para edição ---
  async function carregarDadosEdicao() {
    let ctxId = null;

    try {
      const raw = localStorage.getItem('cifreiEditarContext');
      if (raw) {
        const ctx = JSON.parse(raw);
        if (ctx && ctx.id != null) {
          ctxId = Number(ctx.id);
        }
      }
    } catch (e) {
      console.error('[Cifrei] Erro ao ler contexto de edição do localStorage:', e);
    }

    if (ctxId == null || Number.isNaN(ctxId)) {
      console.warn('[Cifrei] Nenhum id válido encontrado para edição.');
      return;
    }

    if (typeof getCifragemRecordById !== 'function') {
      console.error('[Cifrei] getCifragemRecordById não disponível.');
      return;
    }

    try {
      const rec = await getCifragemRecordById(ctxId);
      if (!rec) {
        console.warn('[Cifrei] Registro não encontrado para edição (id=' + ctxId + ').');
        return;
      }

      originalRecord = rec;

      // Preenche campos
      if (inputNome) inputNome.value = rec.name || '';
      if (txtChave)  txtChave.value  = rec.key75 || '';
      if (txtMsg)    txtMsg.value    = rec.ciphertext || '';
      if (inputObs)  inputObs.value  = rec.notes || '';

      // Datas
      if (pCriada && rec.createdAt) {
        try {
          const dtC = new Date(rec.createdAt);
          pCriada.textContent = 'Criada em: ' + dtC.toLocaleString('pt-BR');
        } catch (e) {
          pCriada.textContent = 'Criada em: ' + rec.createdAt;
        }
      }

      if (pEditada) {
        if (rec.updatedAt) {
          try {
            const dtU = new Date(rec.updatedAt);
            pEditada.textContent = 'Editada em: ' + dtU.toLocaleString('pt-BR');
          } catch (e) {
            pEditada.textContent = 'Editada em: ' + rec.updatedAt;
          }
          pEditada.classList.remove('d-none');
        } else {
          pEditada.classList.add('d-none');
        }
      }

      // dispara input pra atualizar ícones / estado
      if (txtMsg)    txtMsg.dispatchEvent(new Event('input'));
      if (inputNome) inputNome.dispatchEvent(new Event('input'));
      if (inputObs)  inputObs.dispatchEvent(new Event('input'));

      atualizarEstadoBotao();
    } catch (err) {
      console.error('[Cifrei] Erro ao carregar registro para edição:', err);
    }
  }



  // --- Lógica de habilitação do botão ---
  function atualizarEstadoBotao() {
    if (!btnEditar || !originalRecord) {
      if (btnEditar) btnEditar.disabled = true;
      return;
    }

    const nomeAtual = (inputNome?.value || '').trim();
    const msgAtual  = (txtMsg?.value || '');
    const obsAtual  = (inputObs?.value || '').trim();

    const nomeOriginal = (originalRecord.name || '').trim();
    const msgOriginal  = originalRecord.ciphertext || '';
    const obsOriginal  = (originalRecord.notes || '').trim();

    // regra: nome não pode ser vazio
    if (!nomeAtual) {
      btnEditar.disabled = true;
      return;
    }

    const mudouNome = nomeAtual !== nomeOriginal;
    const mudouObs  = obsAtual !== obsOriginal;

    // ciphertext: só pode apagar
    const apagouMsg  = msgAtual.trim() === '' && msgOriginal.trim() !== '';
    const mudouMsg   = msgAtual !== msgOriginal;
    const msgAlteradaSemPermissao = mudouMsg && !apagouMsg;

    if (msgAlteradaSemPermissao) {
      // usuário alterou o texto cifrado de forma diferente de "apagar tudo"
      btnEditar.disabled = true;
      return;
    }

    const houveMudanca = mudouNome || mudouObs || apagouMsg;

    btnEditar.disabled = !houveMudanca;
  }

  if (inputNome) inputNome.addEventListener('input', atualizarEstadoBotao);
  if (txtMsg)    txtMsg.addEventListener('input', atualizarEstadoBotao);
  if (inputObs)  inputObs.addEventListener('input', atualizarEstadoBotao);

  // --- Clique em Editar: salvar alterações ---
  if (btnEditar) {
    btnEditar.addEventListener('click', async function (event) {
      event.preventDefault();

      if (!originalRecord) return;

      atualizarEstadoBotao();
      if (btnEditar.disabled) return;

      const nomeAtual = (inputNome?.value || '').trim();
      const msgAtual  = (txtMsg?.value || '');
      const obsAtual  = (inputObs?.value || '').trim();

      const msgOriginal = originalRecord.ciphertext || '';
      const apagouMsg   = msgAtual.trim() === '' && msgOriginal.trim() !== '';
      const mudouMsg    = msgAtual !== msgOriginal;

      if (mudouMsg && !apagouMsg) {
        console.warn('[Cifrei] Alteração de ciphertext não permitida (apenas apagar).');
        btnEditar.disabled = true;
        return;
      }

      const novoCiphertext = apagouMsg ? '' : msgOriginal;

      if (typeof updateCifragemRecord !== 'function') {
        console.error('[Cifrei] updateCifragemRecord não disponível.');
        return;
      }

      try {
        await updateCifragemRecord(originalRecord.id, {
          name:       nomeAtual,
          key75:      originalRecord.key75,
          ciphertext: novoCiphertext,
          notes:      obsAtual
        });

        // updateCifragemRecord já atualiza updatedAt no banco.
        const agora = new Date();

        // Atualiza o objeto em memória
        originalRecord.name       = nomeAtual;
        originalRecord.ciphertext = novoCiphertext;
        originalRecord.notes      = obsAtual;
        originalRecord.updatedAt  = agora.toISOString();

        // Atualiza o <p> "Editada em:"
        if (pEditada) {
          pEditada.textContent = 'Editada em: ' + agora.toLocaleString('pt-BR');
          pEditada.classList.remove('d-none');
        }

        // feedback visual: desabilita botão
        btnEditar.disabled = true;
      } catch (err) {
        console.error('[Cifrei] Erro ao atualizar cifra:', err);
      }
    });
  }

  function atualizarVisibilidadeIconeCopiar() {
    const txt = document.getElementById("txtMsgBottom");
    const icone = document.getElementById("icnCopiarMsg");

    if (!txt || !icone) return;

    if (txt.value.trim() === "") {
        icone.style.display = "none";
    } else {
        icone.style.display = "inline-block";
    }
}
  // === Ícone copiar deve aparecer sumir conforme texto ===
  const txtMsgBottom = document.getElementById("txtMsgBottom");
  if (txtMsgBottom) {
      txtMsgBottom.addEventListener("input", atualizarVisibilidadeIconeCopiar);
  }

  atualizarVisibilidadeIconeCopiar();

  // dispara carregamento inicial
  carregarDadosEdicao();

  const btnShowQr = document.getElementById('btnShowQrFromCifrar');
  if (btnShowQr) {
    btnShowQr.addEventListener('click', openQrCodeModal);
  }
}


function setupCifragemNavigation() {
  const voltarTop = document.getElementById('voltarCifragemTop');
  if (!voltarTop) return;

  voltarTop.addEventListener('click', function (event) {
    event.preventDefault();
    window.location.href = 'home.html';
  });
}

function setupIndexLogoNavigation() {
  const logo = document.getElementById('imgLogoCifrei');
  if (!logo) return; // não está na index.html

  logo.style.cursor = "pointer";

  logo.addEventListener('click', function () {
    window.location.href = "home.html";
  });
}


// 8) Fluxo de salvar cifragem (novo, sem mdlSalvarCifragem antigo)

async function handleSalvarCifragemClick(opts) {
  const { inputNome, inputObs, txtChaveBottom, txtMsgBottom, chkSalvarChave, modalSubst, setRegistroId } = opts;

  try {
    if (!txtChaveBottom) {
      console.warn('[Cifrei] handleSalvarCifragemClick: txtChaveBottom ausente.');
      return;
    }

    const chave = (txtChaveBottom.value || '').trim();
    const textoCifrado = txtMsgBottom ? (txtMsgBottom.value || '').trim() : '';
    const observacoes  = inputObs ? (inputObs.value || '').trim() : '';

    if (!chave) {
      console.warn('[Cifrei] handleSalvarCifragemClick: chave vazia, não vou salvar.');
      return;
    }

    const apenasChave = chkSalvarChave && chkSalvarChave.checked;
    const ciphertextToSave = apenasChave ? '' : textoCifrado;

    // Nome: usa o que está no input ou gera padrão
    let nomeBruto = inputNome ? (inputNome.value || '') : '';
    nomeBruto = nomeBruto.trim();

    if (!nomeBruto) {
      if (typeof getNextCifragemDefaultName === 'function') {
        nomeBruto = await getNextCifragemDefaultName();
        if (inputNome) inputNome.value = nomeBruto;
      } else {
        console.warn('[Cifrei] getNextCifragemDefaultName não disponível.');
        return;
      }
    }

    const nomeFinal = nomeBruto;

    // Verifica se já existe cifra com esse nome
    let existente = null;
    if (typeof findCifragemByName === 'function') {
      existente = await findCifragemByName(nomeFinal);
    }

    if (!existente) {
      // Salva novo registro
      if (typeof saveCifragemRecord === 'function') {
        await saveCifragemRecord({
          name:       nomeFinal,
          key75:      chave,
          ciphertext: ciphertextToSave,
          notes:      observacoes
        });
        console.log('[Cifrei] Nova cifra salva com sucesso.');
        resetCifrarPageAfterSave();
      } else {
        console.error('[Cifrei] saveCifragemRecord não disponível.');
      }
      return;
    }

    // Já existe → abre modal de substituição
    if (setRegistroId) {
      setRegistroId(existente.id);
    }

    if (modalSubst && window.bootstrap && bootstrap.Modal) {
      const lbl = document.getElementById('lblSubstCifra');
      if (lbl) {
        lbl.textContent =
          `Já existe uma cifra com o nome "${nomeFinal}". ` +
          `Deseja substituir a existente por esta nova ou voltar para alterar o nome?`;
      }

      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalSubst);
      modalInstance.show();
    } else {
      console.warn('[Cifrei] Modal de substituição não encontrado; substituindo diretamente.');
      if (typeof updateCifragemRecord === 'function') {
        await updateCifragemRecord(existente.id, {
          name:       nomeFinal,
          key75:      chave,
          ciphertext: ciphertextToSave,
          notes:      observacoes
        });
        resetCifrarPageAfterSave();
      }
    }
  } catch (err) {
    console.error('[Cifrei] Erro no handleSalvarCifragemClick:', err);
  }
}

async function handleConfirmarSubstituicaoCifraClick(opts) {
  const { registroId, inputNome, inputObs, txtChaveBottom, txtMsgBottom, chkSalvarChave, modalSubst } = opts;

  try {
    if (!registroId) {
      console.warn('[Cifrei] Nenhum id de registro para substituir.');
      if (modalSubst) {
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalSubst);
        modalInstance.hide();
      }
      return;
    }

    if (!txtChaveBottom) {
      console.warn('[Cifrei] handleConfirmarSubstituicaoCifraClick: txtChaveBottom ausente.');
      return;
    }

    const chave = (txtChaveBottom.value || '').trim();
    const texto = txtMsgBottom ? (txtMsgBottom.value || '').trim() : '';
    const observacoes  = inputObs ? (inputObs.value || '').trim() : '';

    if (!chave) {
      console.warn('[Cifrei] handleConfirmarSubstituicaoCifraClick: chave vazia, não vou atualizar.');
      return;
    }

    const apenasChave = chkSalvarChave && chkSalvarChave.checked;
    const ciphertextToSave = apenasChave ? '' : texto;

    let nomeFinal = inputNome ? (inputNome.value || '').trim() : '';

    if (!nomeFinal) {
      if (typeof getNextCifragemDefaultName === 'function') {
        nomeFinal = await getNextCifragemDefaultName();
        if (inputNome) inputNome.value = nomeFinal;
      } else {
        console.warn('[Cifrei] getNextCifragemDefaultName não disponível ao confirmar substituição.');
        return;
      }
    }

    if (typeof updateCifragemRecord === 'function') {
      await updateCifragemRecord(registroId, {
        name:       nomeFinal,
        key75:      chave,
        ciphertext: ciphertextToSave,
        notes:      observacoes
      });
      console.log('[Cifrei] Cifra existente atualizada com sucesso.');
    } else {
      console.error('[Cifrei] updateCifragemRecord não disponível.');
    }

    if (modalSubst) {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalSubst);
      modalInstance.hide();
    }

    resetCifrarPageAfterSave();
  } catch (err) {
    console.error('[Cifrei] Erro no handleConfirmarSubstituicaoCifraClick:', err);
  }
}
//
function getCifraNameForQr() {
  // 1) Nome usado na cifrar.html (pageBottom)
  const nomeCifragem = document.getElementById('inputMdlNomeSalvarCifragem');
  if (nomeCifragem && nomeCifragem.value.trim() !== '') {
    return nomeCifragem.value.trim();
  }

  // 2) Nome usado na editarcifra.html
  const nomeEditar = document.getElementById('inputlNomeCifraAberta');
  if (nomeEditar && nomeEditar.value.trim() !== '') {
    return nomeEditar.value.trim();
  }

  return 'Cifra sem nome';
}
function openQrCodeModal() {
  const payload = buildCifreiQrPayload();
  if (!payload) return;

  const label = getCifraNameForQr();

  const finalCanvas = document.getElementById('qrCanvasFinal');
  if (!finalCanvas) {
    console.error('[Cifrei] qrCanvasFinal não encontrado.');
    return;
  }

  // Gerar QR numa div temporária
  const tempDiv = document.createElement('div');

  const qrSize     = 256; // tamanho do QR em si
  const outerMargin = 20; // margem externa
  const logoWidth  = 38;
  const logoHeight = 52;
  const logoGap    = 20;  // distância entre logo e QR
  const textHeight = 40;  // espaço para o nome da cifra

  new QRCode(tempDiv, {
    text: payload,
    width: qrSize,
    height: qrSize,
    correctLevel: QRCode.CorrectLevel.M
  });

  setTimeout(() => {
    const qrImgEl    = tempDiv.querySelector('img');
    const qrCanvasEl = tempDiv.querySelector('canvas');

    if (!qrImgEl && !qrCanvasEl) {
      console.error('[Cifrei] QR não gerado.');
      return;
    }

    // Função que efetivamente desenha tudo no canvas final
    function drawAll(qrImg, logoImg) {
      const canvasWidth  = qrSize + outerMargin * 2;
      const qrY          = outerMargin + logoHeight + logoGap;
      const canvasHeight = qrY + qrSize + textHeight + outerMargin;

      finalCanvas.width  = canvasWidth;
      finalCanvas.height = canvasHeight;

      const ctx = finalCanvas.getContext('2d');

      // Fundo branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Desenhar logo centralizada no topo
      const logoX = (canvasWidth - logoWidth) / 2;
      const logoY = outerMargin;

      if (logoImg) {
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
      }

      // Desenhar QR
      const qrX = outerMargin;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Borda em volta de tudo
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        1,
        1,
        canvasWidth - 2,
        canvasHeight - 2
      );

      // Texto (nome da cifra) abaixo do QR
      drawQrLabelOnCanvas(ctx, label, canvasWidth, qrY, qrSize, textHeight);

      // Abre o modal no fim
      showQrModal();
    }

    // Cria uma imagem do QR gerado pela lib
    const qrImg = new Image();
    qrImg.onload = function () {
      // Agora carrega a logo
      const logoImg = new Image();
      logoImg.onload = function () {
        drawAll(qrImg, logoImg);
      };
      // AJUSTE AQUI se o caminho da imagem for outro
      logoImg.src = 'assets/img/Img_C_ifre_i.png';
    };

    if (qrCanvasEl) {
      qrImg.src = qrCanvasEl.toDataURL('image/png');
    } else if (qrImgEl) {
      qrImg.src = qrImgEl.src;
    }

  }, 0);
}

function drawQrLabelOnCanvas(ctx, label, canvasWidth, qrY, qrSize, textHeight) {
  ctx.fillStyle = '#000000';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const centerX = canvasWidth / 2;
  const y = qrY + qrSize + textHeight / 2;

  let text = label || 'Cifra sem nome';

  // Normaliza/remover acentos se quiser evitar coisas estranhas
  text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const maxChars = 40;
  if (text.length > maxChars) {
    text = text.slice(0, maxChars - 3) + '...';
  }

  ctx.fillText(text, centerX, y);
}


function showQrModal() {
  const modalEl = document.getElementById('qrCodeModal');
  if (modalEl && window.bootstrap && bootstrap.Modal) {
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.show();
  } else {
    console.warn('[Cifrei] qrCodeModal não encontrado ou Bootstrap ausente.');
  }
}

function setupQrDownloadButton() {
  const btnDownload = document.getElementById('btnDownloadQR');
  const finalCanvas = document.getElementById('qrCanvasFinal');

  if (!btnDownload || !finalCanvas) return;

  btnDownload.addEventListener('click', function () {
    const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.9);

    // Pega o nome da cifra
    let name = getCifraNameForQr() || 'cifra-sem-nome';

    // Normaliza/remover acentos
    name = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Troca espaços por hífen e remove caracteres inválidos pra arquivo
    name = name
      .trim()
      .replace(/\s+/g, '_')               // espaços -> underline
      .replace(/[^a-zA-Z0-9\-.]+/g, ''); // tira caracteres estranhos

    const filename = 'QR-Cifrei_' + name + '.jpg';

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
}



// 9) Reset geral da página cifrar após salvar/atualizar
//
function resetCifrarPageAfterSave() {
  const pageTop        = document.getElementById('cifragemPageTop');
  const pageBottom     = document.getElementById('cifragemPageBottom');

  const txtChave       = document.getElementById('txtChave');
  const txtMsgEntrada  = document.getElementById('txtMsgEntrada');
  const txtChaveBottom = document.getElementById('txtChaveBottom');
  const txtMsgBottom   = document.getElementById('txtMsgBottom');
  const inputNome      = document.getElementById('inputMdlNomeSalvarCifragem');
  const inputObs       = document.getElementById('inputMdlObsSalvarCifragem');
  const dropdown       = document.getElementById('dpdownChave');
  const radio1         = document.getElementById('formCheck-1');
  const radio4         = document.getElementById('formCheck-4');   // 🔹 novo
  const chkSalvarChave = document.getElementById('formCheckSalvarChave');

  if (txtChave) {
    txtChave.value = '';
    txtChave.dispatchEvent(new Event('input'));
  }

  if (txtMsgEntrada) {
    txtMsgEntrada.value = '';
    txtMsgEntrada.dispatchEvent(new Event('input'));
  }

  if (txtChaveBottom) txtChaveBottom.value = '';
  if (txtMsgBottom)   txtMsgBottom.value   = '';

  if (inputNome) inputNome.value = '';
  if (inputObs)  inputObs.value  = '';

  if (chkSalvarChave) {
    chkSalvarChave.checked = false;
  }

  // 🔹 Em vez de só mexer no selectedIndex, recarrega do IndexedDB
  if (dropdown) {
    if (typeof refreshChaveDropdownFromDB === 'function') {
      // repopula o select com todas as cifras, incluindo a última salva
      refreshChaveDropdownFromDB(dropdown, radio4);
    } else {
      // fallback, caso a função não exista por algum motivo
      dropdown.selectedIndex = 0;
      dropdown.dispatchEvent(new Event('change'));
    }
  }

  if (radio1) {
    radio1.checked = true;
    radio1.dispatchEvent(new Event('change', { bubbles: true }));
  }

  if (pageBottom) pageBottom.classList.add('d-none');
  if (pageTop)    pageTop.classList.remove('d-none');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildCifreiQrPayload() {
  const campoKey = document.getElementById('txtChaveBottom');
  const campoMsg = document.getElementById('txtMsgBottom');

  const key75 = campoKey ? campoKey.value.trim() : '';
  const ciphertext = campoMsg ? campoMsg.value.trim() : '';

  if (!key75) {
    alert('Não há chave para gerar o QR (campo txtChave está vazio).');
    return null;
  }

  const parts = ['CIFREI', key75];
  if (ciphertext) {
    parts.push(ciphertext);
  }

  return parts.join('|');
}

// =================== QR SCANNER (CÂMERA) ===================

// Estado global do scanner
let qrScannerStream = null;
let qrScannerActive = false;
let qrScannerDetector = null;
let qrScannerPageType = null; // "cifrar" ou "decifrar"

// Inicializa o scanner em uma página específica
// Chame: initQrScanner("cifrar") ou initQrScanner("decifrar")
function initQrScanner(pageType) {
    const qrRadio = document.querySelector('#formCheck-2'); // ID que você mencionou

    if (!qrRadio) {
        console.warn('[Cifrei] Radio #formCheck-2 não encontrado nesta página.');
        return;
    }

    qrScannerPageType = pageType;

    qrRadio.addEventListener('change', function () {
        // Só dispara quando o radio ficar selecionado
        if (qrRadio.checked) {
            startQrScanner();
        }
    });

    // Também podemos garantir que, ao fechar o modal manualmente, o scanner pare
    const qrModalEl = document.getElementById('mdlQrScanner');
    if (qrModalEl) {
        // Quando o modal fechar (X, Cancelar, erro, etc.)
      qrModalEl.addEventListener('hide.bs.modal', function () {
          stopQrScanner(false); // interrompe câmera sem aplicar alterações
          
          // 🔹 Sempre voltar o radio para #formCheck-1
          const fallbackRadio = document.getElementById('formCheck-1');
          if (fallbackRadio) {
              fallbackRadio.checked = true;
              fallbackRadio.dispatchEvent(new Event('change'));
    }
});

    }
}

// Inicia o scanner de QR code
function startQrScanner() {
    const qrModalEl = document.getElementById('mdlQrScanner');
    const video = document.getElementById('qrVideo');

    if (!qrModalEl || !video) {
        console.error('[Cifrei] Elementos do modal de QR não encontrados.');
        alert('Não foi possível iniciar a câmera para leitura do QR code.');
        return;
    }

    // Evita iniciar de novo se já estiver ativo
    if (qrScannerActive) {
        return;
    }

    // Abre o modal
    const qrModal = bootstrap.Modal.getOrCreateInstance(qrModalEl);
    qrModal.show();

    // Checa suporte ao BarcodeDetector (API nativa do navegador)
    qrScannerActive = true;

    // Se houver BarcodeDetector, usamos; senão, vamos cair no fallback com jsQR
    if ('BarcodeDetector' in window) {
        qrScannerDetector = new BarcodeDetector({ formats: ['qr_code'] });
    } else {
        qrScannerDetector = null;
        console.warn('[Cifrei] BarcodeDetector indisponível, usando fallback com jsQR (canvas).');
    }


// Primeiro tentamos com "environment" como IDEAL (funciona bem em celular)
// e costuma cair na câmera única no notebook
const constraintsPreferEnv = {
    video: {
        facingMode: { ideal: 'environment' }  // traseira no celular, qualquer no notebook
    },
    audio: false
};

  navigator.mediaDevices.getUserMedia(constraintsPreferEnv)
      .catch(function (err) {
          console.warn('[Cifrei] Erro com facingMode=environment, tentando genérico:', err);

          // Fallback: qualquer câmera disponível (útil para notebook)
          return navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
          });
      })
      .then(function (stream) {
          const video = document.getElementById('qrVideo');

          qrScannerStream = stream;
          video.srcObject = stream;
          video.play().catch(function (err) {
              console.error('[Cifrei] Erro ao dar play no vídeo:', err);
          });

          video.addEventListener('loadedmetadata', function onLoaded() {
              video.removeEventListener('loadedmetadata', onLoaded);
              scanQrLoop();
          });


      })
      .catch(function (err) {
          console.error('[Cifrei] Erro ao acessar câmera (fallback também falhou):', err);
          alert('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
          stopQrScanner(false);
      });

}

// Loop de leitura do QR code
function scanQrLoop() {
    if (!qrScannerActive) return;

    const video  = document.getElementById('qrVideo');
    const canvas = document.getElementById('qrCanvas');

    if (!video || !canvas) {
        console.error('[Cifrei] Vídeo ou canvas do scanner não encontrados.');
        stopQrScanner(false);
        return;
    }

    // Garante que o vídeo já tem dados suficientes
    if (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(scanQrLoop);
        return;
    }

    // --- MODO 1: BarcodeDetector nativo, se disponível ---
    if (qrScannerDetector) {
        qrScannerDetector.detect(video)
            .then(function (barcodes) {
                if (!qrScannerActive) return;

                if (barcodes && barcodes.length > 0) {
                    const rawValue = barcodes[0].rawValue || '';
                    console.log('[Cifrei] QR lido (BarcodeDetector):', rawValue);
                    handleQrDecoded(rawValue);
                } else {
                    requestAnimationFrame(scanQrLoop);
                }
            })
            .catch(function (err) {
                console.error('[Cifrei] Erro ao detectar QR (BarcodeDetector):', err);
                requestAnimationFrame(scanQrLoop);
            });

        return; // importante sair aqui
    }

    // --- MODO 2: Fallback com canvas + jsQR ---
    if (window.jsQR) {
        const ctx = canvas.getContext('2d');

        // Ajusta o canvas ao tamanho do vídeo
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;

        // Desenha o frame atual do vídeo no canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Pega os pixels e passa pro jsQR
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);

        if (code && code.data) {
            console.log('[Cifrei] QR lido (jsQR):', code.data);
            handleQrDecoded(code.data);
        } else {
            // Nada encontrado, tenta de novo
            requestAnimationFrame(scanQrLoop);
        }
    } else {
        console.error('[Cifrei] Nenhum método de leitura de QR disponível (nem BarcodeDetector, nem jsQR).');
        alert('Não foi possível ativar a leitura de QR code neste navegador.');
        stopQrScanner(false);
    }
}

// Trata o texto lido do QR
function handleQrDecoded(qrText) {
    // Paramos o scanner antes de mexer na página
    stopQrScanner(true); // true = vai aplicar alterações se o QR for válido

    if (!qrText || typeof qrText !== 'string') {
        console.warn('[Cifrei] QR vazio ou inválido.');
        showQrInvalidMessage();
        return;
    }

    // Valida prefixo CIFREI
    if (!qrText.startsWith('CIFREI|')) {
        console.warn('[Cifrei] QR não começa com CIFREI.');
        showQrInvalidMessage();
        return;
    }

    const partes = qrText.split('|');
    // Esperado: ["CIFREI", "<chave 75 chars>", "<ciphertext opcional>"]
    if (partes.length < 2) {
        console.warn('[Cifrei] Estrutura do QR inesperada:', partes);
        showQrInvalidMessage();
        return;
    }

    const chave = partes[1] || '';
    const ciphertext = partes[2] || '';

    // Opcional: validar tamanho da chave (75 chars)
    if (chave.length !== 75) {
        console.warn('[Cifrei] Chave com tamanho inesperado:', chave.length);
        // Ainda assim, podemos tratar como inválido (mais seguro)
        showQrInvalidMessage();
        return;
    }

    // Agora preenche os campos de acordo com a página
    const txtChave = document.getElementById('txtChave');
    const txtMsgEntrada = document.getElementById('txtMsgEntrada');

    if (!txtChave) {
        console.error('[Cifrei] Campo #txtChave não encontrado.');
        showQrInvalidMessage();
        return;
    }

    // Em ambas as páginas, sempre preenche a chave
    txtChave.value = chave;

    // Na página de decifrar, também preenche o texto cifrado, se houver
    if (qrScannerPageType === 'decifrar' && txtMsgEntrada) {
        if (ciphertext && ciphertext.length > 0) {
            txtMsgEntrada.value = ciphertext;
        } else {
            // Se quiser, você pode decidir se isso é erro ou não.
            // Por enquanto, só deixamos vazio.
            console.log('[Cifrei] QR válido, mas sem ciphertext.');
        }
    }

    // Aqui você pode disparar qualquer lógica extra, se precisar (ex: revalidar botões)
    console.log('[Cifrei] Campos preenchidos a partir do QR com sucesso.');
}

// Para o scanner e libera recursos
// applyChanges: se true, significa que paramos porque lemos um QR; se false, foi cancelamento/timeout.
function stopQrScanner(applyChanges) {
    if (!qrScannerActive) return;

    qrScannerActive = false;

    // Para a câmera
    if (qrScannerStream) {
        qrScannerStream.getTracks().forEach(function (track) {
            track.stop();
        });
        qrScannerStream = null;
    }

    // Fecha o modal (se ainda estiver aberto)
    const qrModalEl = document.getElementById('mdlQrScanner');
    if (qrModalEl) {
        const qrModal = bootstrap.Modal.getInstance(qrModalEl) || bootstrap.Modal.getOrCreateInstance(qrModalEl);
        qrModal.hide();
    }

    // Se foi cancelamento/timeout (applyChanges === false), não mexemos nos campos.
    if (!applyChanges) {
        console.log('[Cifrei] Scanner encerrado sem alterações na página.');
    }
}

// Mensagem de QR inválido
function showQrInvalidMessage() {
    alert('QR code inválido!');

    // Fecha modal + volta radio para formCheck-1
    const qrModalEl = document.getElementById('mdlQrScanner');
    if (qrModalEl) {
        const modal = bootstrap.Modal.getInstance(qrModalEl);
        if (modal) modal.hide();
    }

    const fallbackRadio = document.getElementById('formCheck-1');
    if (fallbackRadio) {
        fallbackRadio.checked = true;
        fallbackRadio.dispatchEvent(new Event('change'));
    }
}
