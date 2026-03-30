/// uiBehaviour.js - versão enxuta Cifrei 2.0

document.addEventListener('DOMContentLoaded', function () {
  function safeInit(nome, fn) {
    try {
      if (typeof fn === 'function') fn();
    } catch (err) {
      console.error('[Cifrei] Falha em ' + nome + ':', err);
    }
  }

  // Mantém cada setup isolado para um erro em uma página não derrubar as demais.
  safeInit('setupApagarMensagem', setupApagarMensagem);
  safeInit('setupApagarChave', setupApagarChave);
  safeInit('setupApagarMsgEditar', setupApagarMsgEditar);
  safeInit('setupOrigemChaveRadios', setupOrigemChaveRadios);
  safeInit('setupDropdownChave', setupDropdownChave);
  safeInit('setupGenerateKeyButton', setupGenerateKeyButton);
  safeInit('setupCifragemNavigation', setupCifragemNavigation);
  safeInit('setupIndexLogoNavigation', setupIndexLogoNavigation);
  safeInit('setupPassphraseStrength', setupPassphraseStrength);
  safeInit('setupFraseSegredoModal', setupFraseSegredoModal);
  safeInit('setupFraseSegredoDecModal', setupFraseSegredoDecModal);
  safeInit('setupDecryptErrorModal', setupDecryptErrorModal);
  safeInit('setupCopyActionIcons', setupCopyActionIcons);
  safeInit('setupCopiarMsgAberta', setupCopiarMsgAberta);
  safeInit('setupDecifrarPageForDecryption', setupDecifrarPageForDecryption);
  safeInit('setupEditarPageForDecryption', setupEditarPageForDecryption);
  safeInit('setupCifraAbertaPage', setupCifraAbertaPage);
  safeInit('setupEditarCifraPage', setupEditarCifraPage);
  safeInit('setupQrDownloadButton', setupQrDownloadButton);
  safeInit('setupClipboardModal', setupClipboardModal);
  safeInit('initClipboardWatcherForPage', initClipboardWatcherForPage);
  safeInit('setupPasswordGeneratorModal', setupPasswordGeneratorModal);
  safeInit('setupCifragemPageBottom', setupCifragemPageBottom);
  safeInit('setupMenuFlutuante', setupMenuFlutuante);
});

function flashContainer(elementOrContainer) {
  if (!elementOrContainer) return;

  const container = (elementOrContainer instanceof Element)
    ? (elementOrContainer.matches('input, textarea')
        ? (elementOrContainer.closest('#divChave, #divMsgEntrada, #divInputMdlObsSalvarCifragem, #divInputObsCifraAberta, #divChaveBottom, #divMsgBottom, #divMsgAberta') || elementOrContainer)
        : elementOrContainer)
    : null;

  if (!container) return;

  if (container.__cifreiFlashTimeout) {
    clearTimeout(container.__cifreiFlashTimeout);
  }

  if (!container.dataset.cifreiOrigTransition) {
    container.dataset.cifreiOrigTransition = container.style.transition || '';
  }
  if (!container.dataset.cifreiOrigBg) {
    container.dataset.cifreiOrigBg = container.style.backgroundColor || '';
  }
  if (!container.dataset.cifreiOrigBoxShadow) {
    container.dataset.cifreiOrigBoxShadow = container.style.boxShadow || '';
  }

  const originalBg = getComputedStyle(container).backgroundColor;
  container.style.transition = 'background-color 0.18s ease, box-shadow 0.18s ease';
  container.style.backgroundColor = '#eeeeee';
  container.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.05)';

  // força repaint para reiniciar animação em cliques repetidos
  void container.offsetWidth;

  container.__cifreiFlashTimeout = setTimeout(() => {
    container.style.backgroundColor = container.dataset.cifreiOrigBg || originalBg || '';
    container.style.boxShadow = container.dataset.cifreiOrigBoxShadow || '';
    container.style.transition = container.dataset.cifreiOrigTransition || '';
  }, 220);
}

function animarTextarea(element) {
  flashContainer(element);
}

function isAsciiPrintableChar(ch) {
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  return code >= 0x20 && code <= 0x7E;
}

function sanitizeAsciiPrintable(value) {
  return Array.from(String(value || ''))
    .filter(isAsciiPrintableChar)
    .join('');
}

function hasMultipleInternalSpaces(value) {
  return / {2,}/.test(String(value || '').trim());
}

function bindMultipleSpacesWarning(input, warningEl) {
  if (!input || !warningEl) return;

  function updateWarning() {
    warningEl.classList.toggle('d-none', !hasMultipleInternalSpaces(input.value));
  }

  if (input.dataset.cifreiBoundMultiSpaceWarning !== '1') {
    input.dataset.cifreiBoundMultiSpaceWarning = '1';
    input.addEventListener('input', updateWarning);
  }

  updateWarning();
}

//
// 1) Ícone de lixeira para txtMsgEntrada
//
function setupApagarMensagem() {
  const campo = document.getElementById('txtMsgEntrada');
  const icone = document.getElementById('icnApagarMsg');
  const container = document.getElementById('divMsgEntrada');

  if (!campo || !icone) return;

  function atualizarIcone() {
    icone.style.display = campo.value.trim() === '' ? 'none' : 'block';
  }

  atualizarIcone();
  campo.addEventListener('input', atualizarIcone);

  if (!icone.dataset.cifreiBoundDelete) {
    icone.dataset.cifreiBoundDelete = '1';
    icone.addEventListener('click', function () {
      campo.value = '';
      atualizarIcone();
      flashContainer(container || campo);
      campo.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
}

//
// 1c) Ícone de lixeira para txtMsgEditar (editarcifra.html)
//
function setupApagarMsgEditar() {
  const icone = document.getElementById('icnApagarMsgEditar');
  if (!icone) return;

  // Função desativada por decisão de UX.
  icone.style.display = 'none';
  icone.style.pointerEvents = 'none';
}

//
// 1b) Ícone de lixeira para txtChave
//
function setupApagarChave() {
  const campo    = document.getElementById('txtChave');
  const icone    = document.getElementById('icnApagarChave');
  const dropdown = document.getElementById('dpdownChave');
  const container = document.getElementById('divChave');

  if (!campo || !icone) return;

  function atualizarIcone() {
    const vazio = campo.value.trim() === '';
    icone.style.display = vazio ? 'none' : 'block';

    if (vazio && dropdown) {
      dropdown.selectedIndex = 0;
    }
  }

  atualizarIcone();
  campo.addEventListener('input', atualizarIcone);

  if (!icone.dataset.cifreiBoundDelete) {
    icone.dataset.cifreiBoundDelete = '1';
    icone.addEventListener('click', function () {
      campo.value = '';
      atualizarIcone();
      flashContainer(container || campo);
      campo.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
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
      opt.dataset.key75 = rec.key75 || rec.key || '';
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
  const recordId = String(id || '').trim();
  if (!recordId) return null;

  if (typeof getAllCifragemRecordsSortedByName !== 'function') {
    console.warn('[Cifrei] getAllCifragemRecordsSortedByName não disponível.');
    return null;
  }

  try {
    const list = await getAllCifragemRecordsSortedByName();
    return list.find(r => String(r.id) === recordId) || null;
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
        opt.dataset.key75 = rec.key75 || rec.key || '';
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

  // Só deve rodar na cifrar.html, não em cifraaberta/editarcifra.
  if (!pageTop || !pageBottom || !btnSalvar || !inputNome || !inputObs) {
    return;
  }

  // Começa sempre com a página de baixo oculta.
  pageBottom.classList.add('d-none');

  // 5.0 Comportamento específico da página de cifragem
  if (pageBottom && pageTop) {

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
  if (icnCopiarChave && txtChaveBottom && !icnCopiarChave.dataset.cifreiBoundCopyBottom) {
    icnCopiarChave.dataset.cifreiBoundCopyBottom = '1';
    icnCopiarChave.addEventListener('click', function (event) {
      event.preventDefault();
      copiarTextoDoTextarea(txtChaveBottom);
      flashContainer(document.getElementById('divChaveBottom') || txtChaveBottom);
    });
  }

  if (icnCopiarMsg && txtMsgBottom && !icnCopiarMsg.dataset.cifreiBoundCopyBottom) {
    icnCopiarMsg.dataset.cifreiBoundCopyBottom = '1';
    icnCopiarMsg.addEventListener('click', function (event) {
      event.preventDefault();
      copiarTextoDoTextarea(txtMsgBottom);
      flashContainer(document.getElementById('divMsgBottom') || txtMsgBottom);
    });
  }

  // 5.3 Label do botão Salvar
  if (btnSalvar) {
    // garante estrutura: mantém o SVG existente e recria o texto do botão
    let labelSpan = btnSalvar.querySelector('#lblBtnSalvarCifragem');
    if (!labelSpan) {
      labelSpan = document.createElement('span');
      labelSpan.id = 'lblBtnSalvarCifragem';
      const icon = btnSalvar.querySelector('svg');
      if (icon && icon.nextSibling) {
        btnSalvar.insertBefore(labelSpan, icon.nextSibling);
      } else {
        btnSalvar.appendChild(labelSpan);
      }
    }

    function setSalvarLabel(texto) {
      labelSpan.textContent = ' ' + texto;
    }

    setSalvarLabel('Salvar Cifra');

    if (chkSalvarChave) {
      chkSalvarChave.checked = false;
      chkSalvarChave.disabled = true;
      const chkWrap = chkSalvarChave.closest('.form-check, .form-switch, label, div');
      if (chkWrap) chkWrap.style.display = 'none';
    }

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
function setupCopyActionIcons() {
  const bindings = [
    { iconId: 'icnCopiarChave', fieldId: 'txtChaveBottom', containerId: 'divChaveBottom' },
    { iconId: 'icnCopiarMsg', fieldId: 'txtMsgBottom', containerId: 'divMsgBottom' },
    { iconId: 'icnCopiarMsgAberta', fieldId: 'txtMsgAberta', containerId: 'divMsgAberta' }
  ];

  bindings.forEach(({ iconId, fieldId, containerId }) => {
    const icon = document.getElementById(iconId);
    const field = document.getElementById(fieldId);
    const container = document.getElementById(containerId);

    if (!icon || !field) return;
    if (icon.dataset.cifreiBoundCopy === '1') return;

    icon.dataset.cifreiBoundCopy = '1';
    icon.addEventListener('click', function (event) {
      event.preventDefault();
      copiarTextoDoTextarea(field);
      flashContainer(container || field);
    });
  });
}

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

}

function setupCopiarMsgAberta() { // Copiar mensagem aberta
  const btn = document.getElementById('icnCopiarMsgAberta');
  const txt = document.getElementById('txtMsgAberta');
  const container = document.getElementById('divMsgAberta');

  if (!btn || !txt) return;
  if (btn.dataset.cifreiBoundCopyOpen === '1') return;

  btn.dataset.cifreiBoundCopyOpen = '1';
  btn.addEventListener('click', function (event) {
    event.preventDefault();
    copiarTextoDoTextarea(txt);
    flashContainer(container || txt);
  });
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
  const warningMultiSpaces = document.getElementById('lblAvisoMultEspacFsegredo');

  bindMultipleSpacesWarning(input, warningMultiSpaces);

  const strengthClasses = ['strength-0', 'strength-1', 'strength-2', 'strength-3', 'strength-4'];
  const strengthColors  = ['#e63946', '#f77f00', '#ffbf00', '#4ce15b', '#9bb9d6'];

  function updateStrength() {
    const normalized  = sanitizeAsciiPrintable(input.value || '');
    const length      = normalized.length;
    const charsetSize = 95;
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
  const avisoMultEspacos = document.getElementById('lblAvisoMultEspacFsegredo');

  const txtChave      = document.getElementById('txtChave');
  const txtMsgEntrada = document.getElementById('txtMsgEntrada');
  const txtChaveBottom = document.getElementById('txtChaveBottom');
  const txtMsgBottom   = document.getElementById('txtMsgBottom');
  const pageTop        = document.getElementById('cifragemPageTop');
  const pageBottom     = document.getElementById('cifragemPageBottom');
  const inputNome      = document.getElementById('inputMdlNomeSalvarCifragem');

  if (!modalEl || !btnOk || !btnSair || !campoPass) return;

  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

  bindMultipleSpacesWarning(campoPass, avisoMultEspacos);

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

    campoPass.value = sanitizeAsciiPrintable(campoPass.value || '').trim();
    campoPass.dispatchEvent(new Event('input', { bubbles: true }));

    const passphrase   = campoPass.value;
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


function showDecryptErrorModal() {
  const modalEl = document.getElementById('informaErroDec');
  if (modalEl && window.bootstrap && bootstrap.Modal) {
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.show();
    return;
  }

  alert('Não foi possível decifrar. Verifique a frase segredo, a chave e o código.');
}

function setupDecryptErrorModal() {
  const modalEl = document.getElementById('informaErroDec');
  if (!modalEl || !window.bootstrap || !bootstrap.Modal) return;

  const btnOk = document.getElementById('btnOK') || document.getElementById('btnOk');
  const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);

  if (btnOk && !btnOk.dataset.cifreiBound) {
    btnOk.dataset.cifreiBound = '1';
    btnOk.addEventListener('click', function (event) {
      event.preventDefault();
      modalInstance.hide();
    });
  }
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
  const avisoMultEspacos = document.getElementById('lblAvisoMultEspacFsegredoDec');

  // Se a página não tem esse modal, não faz nada
  if (!modalEl || !input || !btnOk || !btnSair) return;

  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

  bindMultipleSpacesWarning(input, avisoMultEspacos);

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

    input.value = sanitizeAsciiPrintable(input.value || '');
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const secret = input.value;
    if (!secret || secret.trim().length < MIN_DEC_SECRET_LENGTH) return;

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

      if (typeof incrementProfileRelevantUsage === 'function') {
        try {
          await incrementProfileRelevantUsage();
        } catch (usageErr) {
          console.error('[Cifrei] Erro ao incrementar uso relevante após decifragem:', usageErr);
        }
      }

      // limpa contexto e modal
      window.cifreiDecifragemContext = null;
      input.value = '';
      atualizarEstadoBotao();
      bsModal.hide();

      // navega para a página de exibição
      window.location.href = 'cifraaberta.html';
    } catch (err) {
      console.error('[Cifrei] Erro ao decifrar:', err);
      input.value = '';
      atualizarEstadoBotao();
      bsModal.hide();
      showDecryptErrorModal();
    }
  });
}

function getCamposDecifragem() {
  // Na decifrar.html:
  //   chave  -> #txtChave
  //   texto  -> #txtMsgEntrada
  //
  // Na editarcifra.html:
  //   chave  -> #txtChaveBottom
  //   texto  -> #txtMsgBottom

  const inputChave = document.querySelector('#txtChave, #txtChaveBottom');
  const inputMsg   = document.querySelector('#txtMsgEntrada, #txtMsgBottom');

  if (!inputChave || !inputMsg) {
    console.warn('[Cifrei] Campos de decifragem não encontrados na página atual.');
    return null;
  }

  return {
    chave: inputChave.value.trim(),
    msgCifrada: inputMsg.value.trim()
  };
}

//
// Página decifrar.html – preparar contexto ao clicar em "Decifrar"
//
//
// Página decifrar.html e editarcifra.html – preparar contexto ao clicar em "Decifrar"
//
function setupDecifrarPageForDecryption() {
  const btnDecifrar = document.getElementById('btnDecifrar');

  // Se não há botão, não é nenhuma das duas páginas
  if (!btnDecifrar) {
    return;
  }

  // ELEMENTOS ESPECÍFICOS DA decifrar.html
  const campoKeyDecifrar  = document.getElementById('txtChave');
  const campoMsgDecifrar  = document.getElementById('txtMsgEntrada');
  const dropdown          = document.getElementById('dpdownChave');

  // 🔹 Comportamento ESPECÍFICO da decifrar.html:
  // quando muda o dpdownChave, carregar key75 + ciphertext (se houver)
  if (dropdown && campoKeyDecifrar && campoMsgDecifrar && typeof getCifragemRecordById === 'function') {
    dropdown.addEventListener('change', async function () {
      const id = dropdown.value;

      // se nada selecionado, limpa só a mensagem
      if (!id) {
        campoMsgDecifrar.value = '';
        campoMsgDecifrar.dispatchEvent(new Event('input'));
        return;
      }

      const rec = await getCifragemRecordById(id);
      if (!rec) {
        console.warn('[Cifrei] Registro não encontrado para id', id, 'na decifrar.html');
        return;
      }

      // garante que a chave fique sincronizada com o registro
      if (rec.key75) {
        campoKeyDecifrar.value = rec.key75;
        campoKeyDecifrar.dispatchEvent(new Event('input'));
      }

      // preenche o ciphertext, quando existir
      if (rec.ciphertext) {
        campoMsgDecifrar.value = rec.ciphertext;
      } else {
        campoMsgDecifrar.value = '';
      }
      campoMsgDecifrar.dispatchEvent(new Event('input'));
    });
  }

  // 🔹 Clique em "Decifrar" – funciona nas DUAS páginas
  btnDecifrar.addEventListener('click', async function (event) {
    event.preventDefault();

    const campos = getCamposDecifragem();
    if (!campos) {
      alert('Não encontrei os campos de chave e texto cifrado.');
      return;
    }

    const key75      = campos.chave;
    const ciphertext = campos.msgCifrada;
    const radio4   = document.getElementById('formCheck-4');
    const editCtx  = window.cifreiEditarRecordForDecryption || null;

    let ctx = null;

    // 1) Caso: decifragem iniciada a partir da editarcifra.html
    if (editCtx && editCtx.id != null) {
      ctx = {
        type:       'saved-complete',
        id:         editCtx.id,
        name:       editCtx.name  || '',
        notes:      editCtx.notes || '',
        key75:      key75,
        ciphertext: ciphertext
      };

    // 2) Caso: cifra INCOMPLETA salva (radio4 + dropdown na decifrar.html)
    } else if (radio4 && radio4.checked && dropdown && dropdown.value) {
      const id = String(dropdown.value);
      let rec = null;

      if (typeof getAllCifragemRecordsSortedByName === 'function') {
        try {
          const list = await getAllCifragemRecordsSortedByName();
          rec = list.find(r => String(r.id) === id) || null;
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

    // 3) Caso geral: decifragem MANUAL (sem vínculo com banco)
    } else {
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
      console.warn('[Cifrei] Modal fraseSegredoDec não encontrado ou Bootstrap ausente.');
    }
  });

  // continua valendo para a página de decifrar
  initQrScanner('decifrar');
}


//
// Preparar decifragem na editarcifra.html
//
function setupEditarPageForDecryption() {

  const btnDecifrar = document.getElementById('btnDecifrarEditar'); 
  // 👉 Use o ID real do botão que você criou na editarcifra.html
  if (!btnDecifrar) return; // se não existe, não estamos na editarcifra.html

  btnDecifrar.addEventListener('click', function (event) {
    event.preventDefault();

    const campos = getCamposDecifragem();
    if (!campos) {
      alert('Não encontrei chave ou texto cifrado.');
      return;
    }

    const { chave, msgCifrada } = campos;

    // contexto para o modal
    window.cifreiDecifragemContext = {
      type: 'manual',   // ou 'saved-incomplete', se quiser buscar no DB
      id: null,
      name: '',
      notes: '',
      key75: chave,
      ciphertext: msgCifrada
    };

    // abre o modal de frase-segredo
    const modalEl = document.getElementById('fraseSegredoDec');
    if (modalEl && window.bootstrap && bootstrap.Modal) {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.show();
    } else {
      console.warn('[Cifrei] Modal fraseSegredoDec não encontrado na editarcifra.html.');
    }
  });
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

  const redirectToCifrar = () => {
    window.location.replace('cifrar.html');
  };

  const data = getDecifragemTempData();
  if (!data) {
    if (btnEditar) {
      btnEditar.classList.add('d-none');  // 🔹 some com o botão se não há dados
    }
    console.warn('[Cifrei] Nenhum dado de decifragem encontrado para cifraaberta.html.');
    redirectToCifrar();
    return;
  }


  // Preenche campos principais
  txtKey.value   = data.key75      || '';
  txtMsgC.value  = data.ciphertext || '';
  txtPlain.value = data.plaintext  || '';

// === Nome da cifra ===
if (inputNome && divNome) {
  if (data.name && data.name.trim() !== '') {
    inputNome.value = data.name.trim();
    divNome.classList.remove('d-none');
  } else {
    divNome.classList.add('d-none');
  }
}

// === Observações ===
if (inputObs && divObs) {
  if (data.notes && data.notes.trim() !== '') {
    inputObs.value = data.notes.trim();
    divObs.classList.remove('d-none');
  } else {
    divObs.classList.add('d-none');
  }
}

  // Botão Editar → vai para editarcifra.html com base no id salvo
  if (btnEditar) {
    const recId = (data.id != null) ? String(data.id) : null;

    if (recId) {
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
      // Se não há id (decifragem manual), esconde o botão
      btnEditar.classList.add('d-none');
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
  const pageRoot  = document.getElementById('cifraAberta');
  const inputNome = document.getElementById('inputlNomeCifraAberta');
  const txtChave  = document.getElementById('txtChaveBottom');
  const txtMsg    = document.getElementById('txtMsgBottom');
  const inputObs  = document.getElementById('inputObsCifraAberta');
  const pCriada   = document.getElementById('criadaEm');
  const pEditada  = document.getElementById('editadaEm');
  const btnEditar = document.getElementById('btnEditarCifra');

  // Só deve rodar na editarcifra.html. A cifraaberta.html reutiliza vários IDs,
  // mas não possui os parágrafos de metadados criada/editada.
  if (!pageRoot || !inputNome || !txtChave || !txtMsg || !inputObs || !btnEditar || !pCriada || !pEditada) return;

  function setEditarCifraLoadingState(isLoading) {
    pageRoot.classList.toggle('is-loading', !!isLoading);
  }

  let originalRecord = null;
  btnEditar.disabled = true;
  setEditarCifraLoadingState(true);

  async function carregarDadosEdicao() {
    let ctxId = null;

    try {
      const raw = localStorage.getItem('cifreiEditarContext');
      console.log('[Cifrei] cifreiEditarContext raw =', raw);
      if (raw) {
        const ctx = JSON.parse(raw);
        if (ctx && ctx.id != null) {
          ctxId = String(ctx.id).trim();
        }
      }
    } catch (e) {
      console.error('[Cifrei] Erro ao ler contexto de edição do localStorage:', e);
    }

    if (!ctxId) {
      console.warn('[Cifrei] Nenhum id válido encontrado para edição.');
      setEditarCifraLoadingState(false);
      return;
    }

    if (typeof getCifragemRecordById !== 'function') {
      console.error('[Cifrei] getCifragemRecordById não disponível.');
      setEditarCifraLoadingState(false);
      return;
    }

    try {
      const rec = await getCifragemRecordById(ctxId);
      if (!rec) {
        console.warn('[Cifrei] Registro não encontrado para edição (id=' + ctxId + ').');
        setEditarCifraLoadingState(false);
        return;
      }

      originalRecord = rec;

      window.cifreiEditarRecordForDecryption = {
        id: rec.id,
        name: rec.name || '',
        notes: rec.notes || ''
      };

      inputNome.value = rec.name || '';
      txtChave.value  = rec.key75 || '';
      txtMsg.value    = rec.ciphertext || '';
      inputObs.value  = rec.notes || '';

      if (pCriada && rec.createdAt) {
        try {
          pCriada.textContent = 'Criada em: ' + new Date(rec.createdAt).toLocaleString('pt-BR');
        } catch (e) {
          pCriada.textContent = 'Criada em: ' + rec.createdAt;
        }
      }

      if (pEditada) {
        if (rec.updatedAt) {
          try {
            pEditada.textContent = 'Editada em: ' + new Date(rec.updatedAt).toLocaleString('pt-BR');
          } catch (e) {
            pEditada.textContent = 'Editada em: ' + rec.updatedAt;
          }
          pEditada.classList.remove('d-none');
        } else {
          pEditada.classList.add('d-none');
        }
      }

      txtMsg.dispatchEvent(new Event('input'));
      inputNome.dispatchEvent(new Event('input'));
      inputObs.dispatchEvent(new Event('input'));

      atualizarEstadoBotao();
      setEditarCifraLoadingState(false);
    } catch (err) {
      console.error('[Cifrei] Erro ao carregar registro para edição:', err);
      setEditarCifraLoadingState(false);
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

    const ciphertextToSave = textoCifrado;

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

        if (typeof incrementProfileRelevantUsage === 'function') {
          try {
            await incrementProfileRelevantUsage();
          } catch (usageErr) {
            console.error('[Cifrei] Erro ao incrementar uso relevante após salvar cifra:', usageErr);
          }
        }

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

    const ciphertextToSave = texto;

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

      if (typeof incrementProfileRelevantUsage === 'function') {
        try {
          await incrementProfileRelevantUsage();
        } catch (usageErr) {
          console.error('[Cifrei] Erro ao incrementar uso relevante após atualizar cifra:', usageErr);
        }
      }

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

  const qrSize = 264;
  const outerMargin = 18;
  const logoWidth = 72;
  const logoHeight = 99;
  const logoGap = 16;
  const textHeight = 58;
  const displayWidth = qrSize + outerMargin * 2;
  const qrY = outerMargin + logoHeight + logoGap;
  const displayHeight = qrY + qrSize + textHeight + outerMargin;
  const renderScale = Math.max(3, Math.ceil(window.devicePixelRatio || 1));

  new QRCode(tempDiv, {
    text: payload,
    width: qrSize * renderScale,
    height: qrSize * renderScale,
    correctLevel: QRCode.CorrectLevel.M
  });

  setTimeout(() => {
    const qrImgEl = tempDiv.querySelector('img');
    const qrCanvasEl = tempDiv.querySelector('canvas');

    if (!qrImgEl && !qrCanvasEl) {
      console.error('[Cifrei] QR não gerado.');
      return;
    }

    function drawAll(qrImg, logoImg) {
      finalCanvas.width = displayWidth * renderScale;
      finalCanvas.height = displayHeight * renderScale;
      finalCanvas.style.width = displayWidth + 'px';
      finalCanvas.style.height = displayHeight + 'px';

      const ctx = finalCanvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(renderScale, renderScale);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fundo branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // Logo centralizada no topo
      const logoX = (displayWidth - logoWidth) / 2;
      const logoY = outerMargin;
      if (logoImg) {
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
      }

      // QR centralizado
      const qrX = outerMargin;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Linha separadora sutil acima do label
      const separatorY = qrY + qrSize + 10;
      ctx.strokeStyle = '#e4e4e4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(outerMargin + 8, separatorY);
      ctx.lineTo(displayWidth - outerMargin - 8, separatorY);
      ctx.stroke();

      // Borda externa
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, displayWidth - 2, displayHeight - 2);

      // Nome da cifra abaixo do QR
      drawQrLabelOnCanvas(ctx, label, displayWidth, qrY, qrSize, textHeight);

      showQrModal();
    }

    const qrImg = new Image();
    qrImg.onload = function () {
      const logoImg = new Image();
      logoImg.onload = function () {
        drawAll(qrImg, logoImg);
      };
      logoImg.onerror = function () {
        const fallbackLogo = new Image();
        fallbackLogo.onload = function () {
          drawAll(qrImg, fallbackLogo);
        };
        fallbackLogo.onerror = function () {
          drawAll(qrImg, null);
        };
        fallbackLogo.src = 'assets/img/Img_C_ifre_i.png';
      };
      logoImg.src = 'assets/img/C_ifre_i_Logo_512.png';
    };

    if (qrCanvasEl) {
      qrImg.src = qrCanvasEl.toDataURL('image/png');
    } else if (qrImgEl) {
      qrImg.src = qrImgEl.src;
    }
  }, 0);
}

function drawQrLabelOnCanvas(ctx, label, canvasWidth, qrY, qrSize, textHeight) {
  const centerX = canvasWidth / 2;
  const baseY = qrY + qrSize + 14;
  const maxTextWidth = canvasWidth - 32;

  let text = (label || 'Cifra sem nome').trim();
  if (!text) text = 'Cifra sem nome';

  text = text.normalize('NFC');

  const words = text.split(/\s+/);
  let lines = [];
  let currentLine = '';

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#091747';
  ctx.font = '600 16px "Open Sans", Arial, sans-serif';

  for (const word of words) {
    const candidate = currentLine ? currentLine + ' ' + word : word;
    if (ctx.measureText(candidate).width <= maxTextWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  if (lines.length === 0) lines = ['Cifra sem nome'];
  if (lines.length > 2) {
    lines = lines.slice(0, 2);
    let last = lines[1];
    while (ctx.measureText(last + '...').width > maxTextWidth && last.length > 1) {
      last = last.slice(0, -1);
    }
    lines[1] = last + '...';
  }

  const lineHeight = 18;
  const textBlockHeight = lineHeight * lines.length;
  let startY = baseY + (textHeight - textBlockHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, centerX, startY + index * lineHeight + lineHeight / 2);
  });
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
    const dataUrl = finalCanvas.toDataURL('image/png');

    // Pega o nome da cifra
    let name = getCifraNameForQr() || 'cifra-sem-nome';

    // Normaliza/remover acentos
    name = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Troca espaços por hífen e remove caracteres inválidos pra arquivo
    name = name
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9\-.]+/g, '');

    const filename = 'QR-Cifrei_' + name + '.png';

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
    // Esperado: ["CIFREI", "<chave>", "<código opcional>"]
    if (partes.length < 2) {
        console.warn('[Cifrei] Estrutura do QR inesperada:', partes);
        showQrInvalidMessage();
        return;
    }

    const chave = partes[1] || '';
    const ciphertext = partes[2] || '';

    if (typeof isValidKey === 'function' && !isValidKey(chave)) {
        console.warn('[Cifrei] Chave com formato inesperado:', chave);
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
    txtChave.dispatchEvent(new Event('input', { bubbles: true }));

    // Na página de decifrar, também preenche o texto cifrado, se houver
    if (qrScannerPageType === 'decifrar' && txtMsgEntrada) {
        if (ciphertext && ciphertext.length > 0) {
            txtMsgEntrada.value = ciphertext;
            txtMsgEntrada.dispatchEvent(new Event('input', { bubbles: true }));
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

// ====== CLIPBOARD / CIFREI: detecção de chave/cifra ======

function isCifreiKey(str) {
  const candidate = String(str || '').trim();

  if (typeof isValidKey === 'function') return isValidKey(candidate);

  return (
    candidate.length >= 8 &&
    candidate.length <= 25 &&
    /^[A-Za-z0-9_-]+$/.test(candidate)
  );
}

function isPlausibleCifreiCiphertext(str) {
  const candidate = String(str || '').trim();
  if (!candidate) return false;

  // Formato legado: CIFREI3.<payloadBase64Url>
  if (candidate.startsWith('CIFREI3.')) {
    const encodedPayload = candidate.slice('CIFREI3.'.length);

    if (!/^[A-Za-z0-9_-]+$/.test(encodedPayload)) return false;

    try {
      const payloadBytes = base64UrlToBytes(encodedPayload);
      const payload = JSON.parse(new TextDecoder().decode(payloadBytes));

      return !!(
        payload &&
        typeof payload === 'object' &&
        typeof payload.salt === 'string' && payload.salt &&
        typeof payload.iv === 'string' && payload.iv &&
        typeof payload.ct === 'string' && payload.ct
      );
    } catch (e) {
      return false;
    }
  }

  // Formato compacto atual: payload Base64URL com versão + salt + iv + ciphertext
  if (!/^[A-Za-z0-9_-]+$/.test(candidate)) return false;

  try {
    if (typeof tryParseCompactCode === 'function') {
      tryParseCompactCode(candidate);
      return true;
    }

    const payload = base64UrlToBytes(candidate);
    const minimumLength = 1 + 16 + 12 + 16;
    return payload && payload.length >= minimumLength && payload[0] === 1;
  } catch (e) {
    return false;
  }
}

/**
 * Detecta se o texto do clipboard contém:
 * - uma chave Cifrei pura (8 a 25 chars Base64URL)
 * - ou um payload CIFREI|<key> ou CIFREI|<key>|<ciphertext>
 *
 * Retorna:
 *   null se não for nada Cifrei
 *   { type: 'chave' | 'cifra-completa', key, ciphertext }
 */
function detectCifreiFromClipboard(rawText) {
  if (!rawText) return null;

  const text = rawText.trim();
  if (!text) return null;

  // 1) Formato CIFREI|key|ciphertext (ou só CIFREI|key)
  if (text.startsWith('CIFREI|')) {
    const parts = text.split('|');

    if (parts.length >= 2) {
      const key = parts[1];

      if (isCifreiKey(key)) {
        let ciphertext = '';

        if (parts.length >= 3) {
          // Junta o resto, caso o ciphertext contenha '|'
          ciphertext = parts.slice(2).join('|');
        }

        if (ciphertext && ciphertext.trim() !== '') {
          if (!isPlausibleCifreiCiphertext(ciphertext)) {
            return null;
          }

          return { type: 'cifra-completa', key, ciphertext };
        } else {
          return { type: 'chave', key, ciphertext: '' };
        }
      }
    }
  }

  // 2) Chave pura (8 a 25 chars Base64URL)
  if (isCifreiKey(text)) {
    return { type: 'chave', key: text, ciphertext: '' };
  }

  return null;
}

// ====== CLIPBOARD: lembrar apenas o último texto perguntado ======

function getLastClipboardAsked() {
  try {
    return localStorage.getItem('cifreiLastClipboardAsked') || '';
  } catch (e) {
    console.error('[Cifrei] Erro ao ler último clipboard perguntado:', e);
    return '';
  }
}

function setLastClipboardAsked(text) {
  if (!text) {
    try {
      localStorage.removeItem('cifreiLastClipboardAsked');
    } catch (e) {
      console.error('[Cifrei] Erro ao limpar último clipboard perguntado:', e);
    }
    return;
  }

  try {
    localStorage.setItem('cifreiLastClipboardAsked', text);
  } catch (e) {
    console.error('[Cifrei] Erro ao salvar último clipboard perguntado:', e);
  }
}

// Contexto atual do modal de clipboard
// Contexto atual do modal de clipboard
let cifreiClipboardPendingAction = null;

function setupClipboardModal() {
  const modalEl = document.getElementById('confirmaUsarCifra');
  const btnOk =
    document.getElementById('btnOkUsarCifra') ||
    document.getElementById('btnOkUsarCifra-1');
  const btnSair =
    document.getElementById('btnSairUsarCifra') ||
    document.getElementById('btnSairUsarCifra-1');

  if (!modalEl || !btnOk || !btnSair) {
    return;
  }

  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  let shouldApplyOnHide = false;

  btnOk.addEventListener('click', function (event) {
    event.preventDefault();

    if (cifreiClipboardPendingAction) {
      setLastClipboardAsked(cifreiClipboardPendingAction.rawText);
      shouldApplyOnHide = true;
    }

    bsModal.hide();
  });

  btnSair.addEventListener('click', function (event) {
    event.preventDefault();

    if (cifreiClipboardPendingAction) {
      setLastClipboardAsked(cifreiClipboardPendingAction.rawText);
    }

    shouldApplyOnHide = false;
    cifreiClipboardPendingAction = null;
    bsModal.hide();
  });

  modalEl.addEventListener('hidden.bs.modal', function () {
    if (!shouldApplyOnHide || !cifreiClipboardPendingAction) return;

    shouldApplyOnHide = false;

    // pequeno atraso para deixar o DOM estabilizar
    setTimeout(() => {
      applyClipboardCifreiAction(cifreiClipboardPendingAction);
      cifreiClipboardPendingAction = null;
    }, 30);
  });
}

/**
 * Aplica a chave/cifra nos campos da página, conforme o contexto.
 */
function applyClipboardCifreiAction(action) {
  if (!action || !action.info || !action.info.key) return;

  const info = action.info;
  const rawText = action.rawText || '';

  const campoChave = document.getElementById('txtChave');
  const campoMsg = document.getElementById('txtMsgEntrada');

  if (!campoChave) return;

  // Detecta a página real pelo DOM, sem depender só do pageType salvo
  let resolvedPageType = action.pageType;

  if (document.getElementById('btnDecifrar')) {
    resolvedPageType = 'decifrar';
  } else if (document.getElementById('btnCifrar')) {
    resolvedPageType = 'cifrar';
  }

  // Extrai a cifra de forma robusta
  let ciphertext = '';

  if (typeof info.ciphertext === 'string' && info.ciphertext.trim()) {
    ciphertext = info.ciphertext.trim();
  } else if (typeof rawText === 'string') {
    const text = rawText.trim();
    if (text.startsWith('CIFREI|')) {
      const parts = text.split('|');
      if (parts.length >= 3) {
        ciphertext = parts.slice(2).join('|').trim();
      }
    }
  }

  if (resolvedPageType === 'cifrar') {
    campoChave.value = info.key || '';
    campoChave.dispatchEvent(new Event('input', { bubbles: true }));
    campoChave.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  if (resolvedPageType === 'decifrar') {
    campoChave.value = info.key || '';
    campoChave.dispatchEvent(new Event('input', { bubbles: true }));
    campoChave.dispatchEvent(new Event('change', { bubbles: true }));

    if (campoMsg) {
      campoMsg.value = ciphertext || '';
      campoMsg.dispatchEvent(new Event('input', { bubbles: true }));
      campoMsg.dispatchEvent(new Event('change', { bubbles: true }));
    }

    return;
  }

  // fallback
  campoChave.value = info.key || '';
  campoChave.dispatchEvent(new Event('input', { bubbles: true }));
  campoChave.dispatchEvent(new Event('change', { bubbles: true }));
}

// ====== CLIPBOARD: integração com cifrar.html e decifrar.html ======

function initClipboardWatcherForPage() {
  if (!navigator.clipboard || !navigator.clipboard.readText) {
    console.warn('[Cifrei] navigator.clipboard.readText não disponível.');
    return;
  }

  const path = (window.location && window.location.pathname) ? window.location.pathname : '';

  let pageType = null;

  if (path.endsWith('cifrar.html')) {
    pageType = 'cifrar';
  } else if (path.endsWith('decifrar.html')) {
    pageType = 'decifrar';
  } else if (document.getElementById('btnCifrar')) {
    pageType = 'cifrar';
  } else if (document.getElementById('btnDecifrar')) {
    pageType = 'decifrar';
  }

  if (!pageType) {
    return;
  }

  let alreadyTriggered = false;

  async function handleUserGesture() {
    if (alreadyTriggered) return;
    alreadyTriggered = true;

    // Remove os listeners assim que disparar uma vez
    document.removeEventListener('pointerdown', handleUserGesture);
    document.removeEventListener('keydown', handleUserGesture);

    try {
      console.log('[Cifrei] Vou tentar ler o clipboard...');
      const text = await navigator.clipboard.readText();
      console.log('[Cifrei] Texto lido do clipboard:', text);

      if (!text || !text.trim()) return;

      const lastAsked = getLastClipboardAsked();
      if (lastAsked && lastAsked === text) {
        // Já perguntamos sobre esse texto enquanto ele estava no clipboard
        return;
      }

      const info = detectCifreiFromClipboard(text);
      if (!info) {
        // Se o clipboard atual não é Cifrei, "zera" o último perguntado
        setLastClipboardAsked('');
        return;
      }

      // Regras para não encher o saco se já tem dados preenchidos
      if (pageType === 'cifrar') {
        const campoChave = document.getElementById('txtChave');
        if (!campoChave) return;

        if (campoChave.value && campoChave.value.trim() !== '') {
          // Usuário já tem uma chave, não vamos atrapalhar
          setLastClipboardAsked(text);
          return;
        }
      } else if (pageType === 'decifrar') {
        const campoChave = document.getElementById('txtChave');
        const campoMsg   = document.getElementById('txtMsgEntrada');
        if (!campoChave || !campoMsg) return;

        if (campoChave.value.trim() && campoMsg.value.trim()) {
          setLastClipboardAsked(text);
          return;
        }
      }

      // Guarda contexto e abre o modal bonitinho
      const modalEl = document.getElementById('confirmaUsarCifra');
      if (!modalEl) return;

      cifreiClipboardPendingAction = {
        pageType,
        info,
        rawText: text
      };

      const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
      bsModal.show();

    } catch (err) {
      console.warn('[Cifrei] Não foi possível ler a área de transferência:', err);
    }
  }

  // Aguarda o primeiro gesto do usuário na página
  document.addEventListener('pointerdown', handleUserGesture);
  document.addEventListener('keydown', handleUserGesture);
}

function setupPasswordGeneratorModal() {
  const trigger = document.getElementById("icnSenhaAleat");
  const modalEl = document.getElementById("gerarSenhaAleat");

  if (!trigger || !modalEl || !window.bootstrap || !bootstrap.Modal) return;

  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  const setModalLoading = (isLoading) => {
    modalEl.classList.toggle("is-loading", !!isLoading);
  };

  trigger.addEventListener("click", function () {
    setModalLoading(true);
    bsModal.show();
  });

  modalEl.addEventListener("show.bs.modal", function () {
    setModalLoading(true);
  });

  modalEl.addEventListener("hidden.bs.modal", function () {
    setModalLoading(false);
  });

  modalEl.addEventListener("shown.bs.modal", async function () {
    setModalLoading(true);

    if (typeof initPasswordGenerator === "function") {
      initPasswordGenerator();
    }

    if (typeof loadPasswordGeneratorParams === "function") {
      try {
        await loadPasswordGeneratorParams();
      } catch (err) {
        console.warn('[Cifrei] Não foi possível carregar as preferências do gerador de senha:', err);
        if (typeof resetPasswordPopup === "function") {
          resetPasswordPopup();
        }
      } finally {
        setModalLoading(false);
      }
    } else {
      if (typeof resetPasswordPopup === "function") {
        resetPasswordPopup();
      }
      setModalLoading(false);
    }
  });
}


function setupMenuFlutuante() {
  const btnMenu = document.getElementById('btnMenuFlutuante');
  const menu = document.getElementById('menuFlutuante');
  const overlay = document.getElementById('overlayMenuFlutuante');

  if (!btnMenu || !menu || !overlay) return;

  const body = document.body;
  const currentPage = (body?.getAttribute('page') || '').trim().toLowerCase();
  const transitionMs = 180;
  const menuLineIds = [
    'menuLineHome',
    'menuLineCifrar',
    'menuLineDecifrar',
    'menuLineMeuperfil',
    'menuLineTermos',
    'menuLineTermosLegais',
    'menuLineSuporte',
    'menuLineLogout'
  ];

  const menuLines = menuLineIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (!menu.dataset.cifreiMenuReady) {
    menu.dataset.cifreiMenuReady = '1';
    menu.style.opacity = '0';
    menu.style.transform = 'translateY(12px)';
    menu.style.transition = `opacity ${transitionMs}ms ease, transform ${transitionMs}ms ease`;
    menu.style.pointerEvents = 'none';
  }

  if (!overlay.dataset.cifreiMenuReady) {
    overlay.dataset.cifreiMenuReady = '1';
    overlay.style.opacity = '0';
    overlay.style.transition = `opacity ${transitionMs}ms ease`;
    overlay.style.pointerEvents = 'none';
  }

  function setMenuLineInteractive(line) {
    line.style.cursor = 'pointer';
    line.setAttribute('role', 'button');
    line.setAttribute('tabindex', '0');
  }

  function getTargetPage(line) {
    return (line.getAttribute('to-page') || '').trim().toLowerCase();
  }

  function hideLine(line) {
    line.classList.add('d-none');
  }

  function showLine(line) {
    line.classList.remove('d-none');
  }

  function syncMenuVisibilityByPage() {
    menuLines.forEach(line => {
      showLine(line);
      const target = getTargetPage(line);
      const lineId = (line.id || '').toLowerCase();

      if (target && currentPage && target === currentPage) {
        hideLine(line);
        return;
      }

      if (currentPage === 'home' && (lineId === 'menulinehome' || lineId === 'menulinecifrar' || lineId === 'menulinedecifrar')) {
        hideLine(line);
      }
    });
  }

  function isMenuOpen() {
    return !menu.classList.contains('d-none');
  }

  function openMenu() {
    syncMenuVisibilityByPage();
    overlay.classList.remove('d-none');
    menu.classList.remove('d-none');

    requestAnimationFrame(() => {
      overlay.style.pointerEvents = 'auto';
      menu.style.pointerEvents = 'auto';
      overlay.style.opacity = '1';
      menu.style.opacity = '1';
      menu.style.transform = 'translateY(0)';
    });
  }

  function closeMenu() {
    overlay.style.pointerEvents = 'none';
    menu.style.pointerEvents = 'none';
    overlay.style.opacity = '0';
    menu.style.opacity = '0';
    menu.style.transform = 'translateY(12px)';

    window.setTimeout(() => {
      overlay.classList.add('d-none');
      menu.classList.add('d-none');
    }, transitionMs);
  }

  function toggleMenu() {
    if (isMenuOpen()) closeMenu();
    else openMenu();
  }

  async function performLogout() {
    try {
      const supabase = window.cifreiSupabase || window.supabaseClient || null;
      if (supabase?.auth?.signOut) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
    } catch (error) {
      console.error('[Cifrei] Erro ao fazer logout pelo menu flutuante:', error);
      window.alert('Não foi possível encerrar a sessão no momento.');
      return;
    }

    window.location.href = 'entrar.html';
  }

  async function handleMenuLineClick(line) {
    if (!line || line.classList.contains('d-none')) return;

    const lineId = line.id || '';
    const targetPage = getTargetPage(line);

    line.classList.add('mLineOpacity');

    if (lineId === 'menuLineLogout') {
      await performLogout();
      return;
    }

    if (!targetPage) {
      window.setTimeout(() => {
        line.classList.remove('mLineOpacity');
      }, 180);
      return;
    }

    window.setTimeout(() => {
      window.location.href = `${targetPage}.html`;
    }, 120);
  }

  btnMenu.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    toggleMenu();
  });

  overlay.addEventListener('click', function () {
    if (isMenuOpen()) closeMenu();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isMenuOpen()) {
      closeMenu();
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && document.activeElement && menuLines.includes(document.activeElement)) {
      event.preventDefault();
      handleMenuLineClick(document.activeElement);
    }
  });

  document.addEventListener('click', function (event) {
    if (!isMenuOpen()) return;

    const clickedInsideMenu = menu.contains(event.target);
    const clickedButton = btnMenu.contains(event.target);

    if (!clickedInsideMenu && !clickedButton) {
      closeMenu();
    }
  });

  menuLines.forEach(line => {
    setMenuLineInteractive(line);

    line.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      handleMenuLineClick(line);
    });
  });

  syncMenuVisibilityByPage();
}

(function () {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    let lastTouchEnd = 0;

    document.addEventListener('touchend', function (event) {
      const now = Date.now();

      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }

      lastTouchEnd = now;
    }, { passive: false });
  }

  if (window.location.pathname.includes('cifraaberta.html')) {
    const TIMEOUT_MS = 60 * 1000;
    let inactivityTimer;

    function redirectToHome() {
      window.location.href = 'home.html';
    }

    function resetTimer() {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(redirectToHome, TIMEOUT_MS);
    }

    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart', 'touchmove'];

    window.addEventListener('load', resetTimer, { once: true });

    events.forEach(function (eventName) {
      window.addEventListener(eventName, resetTimer, { passive: true });
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(redirectToHome, TIMEOUT_MS);
      } else {
        resetTimer();
      }
    });
  }
})();