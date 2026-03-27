
let cifraIdToDelete = null;
let cifraNameToDelete = '';

document.addEventListener('DOMContentLoaded', async function () {

  if (document.getElementById('divListaCifra')) {
    await setupHomeListaCifras();
    setupExcluirCifraModal();
    setupHomeNavigation();

    if (typeof window.maybeOpenAvaliacaoModalOnHomeLoad === 'function') {
      try {
        await window.maybeOpenAvaliacaoModalOnHomeLoad();
      } catch (err) {
        console.error('[Cifrei] Erro ao verificar exibição do modal de avaliação:', err);
      }
    }
  }

});



function setHomeSkeletonLoading(isLoading) {
  const ids = ['skeletonHome', 'divLogoCifreiHome', 'btnMaisDecifrar', 'btnMaisCifrar'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('is-loading', !!isLoading);
  });
}

function setupHomeNavigation() {
  const btnMaisCifrar   = document.getElementById('btnMaisCifrar');
  const btnMaisDecifrar = document.getElementById('btnMaisDecifrar');

  if (btnMaisCifrar) {
    btnMaisCifrar.addEventListener('click', handleBtnMaisCifrarClick);
  }

  if (btnMaisDecifrar) {
    btnMaisDecifrar.addEventListener('click', handleBtnMaisDecifrarClick);
  }
}

async function setupHomeListaCifras() {
  setHomeSkeletonLoading(true);

  const divMinhasCifras = document.getElementById('divMinhasCifras');
  const lblSemCifras    = document.getElementById('labelSemCifras');
  const lista           = document.getElementById('divListaCifra');
  const template        = document.getElementById('divTmpltCardCifra');

  if (!divMinhasCifras || !lblSemCifras || !lista || !template) {
    console.warn('[Cifrei] Elementos da home não encontrados.');
    return;
  }

  try {
    // Busca todas as cifras salvas, ordenadas por nome
    const records = await getAllCifragemRecordsSortedByName();

    // Nenhuma cifra salva
    if (!records || !records.length) {
      lblSemCifras.classList.remove('d-none');
      divMinhasCifras.classList.add('d-none');
      setHomeSkeletonLoading(false);
      return;
    }

    // Há cifras salvas
    lblSemCifras.classList.add('d-none');
    divMinhasCifras.classList.remove('d-none');

// Remove apenas os cards clonados, preservando o template
const cardsExistentes = lista.querySelectorAll('.card-cifra');
cardsExistentes.forEach(card => card.remove());


records.forEach(rec => {
  const card = template.cloneNode(true);
  card.id = '';
  card.classList.remove('d-none');
  card.classList.add('card-cifra');
  card.dataset.cifragemId = rec.id;

  const nomeInput  = card.querySelector('#txtCardNomeCifra');
  const chaveInput = card.querySelector('#txtCardChaveCifra');
  const textoInput = card.querySelector('#txtCardTextoCifra');

  if (nomeInput)  nomeInput.value  = rec.name || '';
  if (chaveInput) chaveInput.value = rec.key75 || '';
  if (textoInput) textoInput.value = rec.ciphertext || '';

  // Ícone de excluir
  const icnApagar = card.querySelector('#icnCardApagarCifra');
  if (icnApagar) {
    icnApagar.addEventListener('click', function (event) {
      event.stopPropagation();   // <-- impede que clique suba para o card

      cifraIdToDelete   = rec.id;
      cifraNameToDelete = rec.name || '';

      const lbl = document.getElementById('lblConfirmaExcluirCifra');
      if (lbl) {
        lbl.textContent =
          `Você tem certeza que deseja excluir permanentemente "${cifraNameToDelete}"?`;
      }

      const modalEl = document.getElementById('confirmaExcluirCifra');
      if (modalEl && window.bootstrap && bootstrap.Modal) {
        const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
        bsModal.show();
      }
    });
  }

    // Ícone de editar
  const icnEditar = card.querySelector('#icnCardEditarCifra');
  if (icnEditar) {
    icnEditar.addEventListener('click', function (event) {
      event.stopPropagation(); // não deixa o clique "vazar" pro card

      if (rec.id == null) {
        console.warn('[Cifrei] Registro sem id para edição.');
        return;
      }

      // guarda contexto de edição e vai para editarcifra.html
      const ctx = { id: rec.id };
      try {
        localStorage.setItem('cifreiEditarContext', JSON.stringify(ctx));
        console.log('[Cifrei] cifreiEditarContext salvo:', ctx);
      } catch (e) {
        console.error('[Cifrei] Erro ao salvar contexto de edição:', e);
      }

      window.location.href = 'editarcifra.html';
    });
  }

  // 🔥 NOVO — bloqueia toda a coluna direita:
  // Coluna da direita (lixeira etc.)
  const colDir = card.querySelector('#divColunaDirCardCifra');
  if (colDir) {
    colDir.addEventListener('click', function (event) {
      event.stopPropagation();
    });
  }

  // Efeito de "clique" visual no card,
  // mas só se o clique NÃO for na coluna direita
  card.addEventListener('mousedown', function (event) {
    if (colDir && colDir.contains(event.target)) {
      // clique veio da coluna direita → não aplica efeito de clique no card
      return;
    }
    card.classList.add('card-pressed');
  });

  card.addEventListener('mouseup', function () {
    card.classList.remove('card-pressed');
  });

  card.addEventListener('mouseleave', function () {
    card.classList.remove('card-pressed');
  });

  // Clique no card inteiro → abrir página de decifragem
  card.addEventListener('click', function () {
    handleAbrirCifraParaDecifrar(rec);
  });

  lista.appendChild(card);
});

    setHomeSkeletonLoading(false);

  } catch (err) {
    console.error('[Cifrei] Erro ao carregar cifras na home:', err);
    // Em caso de erro, mostra mensagem de "sem cifras" como fallback
    lblSemCifras.classList.remove('d-none');
    divMinhasCifras.classList.add('d-none');
  } finally {
    setHomeSkeletonLoading(false);
  }
}


function setupExcluirCifraModal() {
  const modalEl = document.getElementById('confirmaExcluirCifra');
  const btnOk   = document.getElementById('btnOkExcluirCifra');
  const btnSair = document.getElementById('btnSairExcluirCifra');

  if (!modalEl || !btnOk || !btnSair) {
    // Não estamos na página que tem esse modal
    return;
  }

  // Botão Sair: só limpa o estado em memória
  btnSair.addEventListener('click', function () {
    cifraIdToDelete   = null;
    cifraNameToDelete = '';
    // O fechamento visual pode ficar por conta do data-bs-dismiss="modal"
  });

  // Botão OK: excluir e fechar modal
  btnOk.addEventListener('click', async function () {
    if (cifraIdToDelete == null) {
      return;
    }

    try {
      await deleteCifragemRecord(cifraIdToDelete);
      cifraIdToDelete   = null;
      cifraNameToDelete = '';

      // Fecha o modal (além do data-bs-dismiss, se você quiser confiar só no JS)
      if (window.bootstrap && bootstrap.Modal) {
        const instance = bootstrap.Modal.getInstance(modalEl)
          || bootstrap.Modal.getOrCreateInstance(modalEl);
        instance.hide();
      }

      // Recarrega a lista de cifras (label vs divMinhasCifras etc.)
      await setupHomeListaCifras();

    } catch (err) {
      console.error('[Cifrei] Erro ao excluir cifragem:', err);
      // Se quiser, pode exibir uma mensagem visual de erro aqui
    }
  });
}

function handleBtnMaisCifrarClick(event) {
  event.preventDefault();        // se for <button> dentro de <form>, evita submit
  window.location.href = 'cifrar.html';
}
function handleBtnMaisDecifrarClick(event) {
  event.preventDefault();
  window.location.href = 'decifrar.html';
}

/* -----------------------------------
   handler: abrir cifra decifragem
-------------------------------------*/
function handleAbrirCifraParaDecifrar(rec) {
  if (!rec || rec.id == null) return;

  const hasCiphertext = !!(rec.ciphertext && rec.ciphertext.trim());

  if (hasCiphertext) {
    // 🔹 Cifra COMPLETA: chave + texto cifrado → decifra direto pela home

    // Contexto global para o modal de decifrar usar
    window.cifreiDecifragemContext = {
      type:       'saved-complete',
      id:         rec.id,
      name:       rec.name  || '',
      notes:      rec.notes || '',
      key75:      rec.key75 || '',
      ciphertext: rec.ciphertext || ''
    };

    const modalEl = document.getElementById('fraseSegredoDec');
    if (modalEl && window.bootstrap && bootstrap.Modal) {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.show();
    } else {
      console.warn('[Cifrei] Modal fraseSegredoDec não encontrado ou Bootstrap ausente.');
    }

  } else {
    // 🔹 Cifra INCOMPLETA: só chave → vai para decifrar.html

    const ctx = {
      type:  'saved-incomplete',
      id:    rec.id,
      name:  rec.name  || '',
      notes: rec.notes || '',
      key75: rec.key75 || ''
    };

    localStorage.setItem('cifreiDecifrarContext', JSON.stringify(ctx));
    window.location.href = 'decifrar.html';
  }
}