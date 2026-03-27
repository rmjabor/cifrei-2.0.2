// Modal utilities e lógica de avaliação do usuário
(function () {
  'use strict';

  const DEFAULT_AVALIACAO_PLACEHOLDER = 'Deixe aqui o seu comentário (opcional)';
  const POSITIVE_AVALIACAO_PLACEHOLDER = 'Que ótimo! O que você mais gostou? (opcional)';
  const NEGATIVE_AVALIACAO_PLACEHOLDER = 'Poxa, gostaríamos de entender sua avaliação. Poderia nos contar sua experiência? (opcional)';
  const MIN_RELEVANT_USAGE_TO_PROMPT = 5;
  const MAIS_TARDE_DAYS = 30;

  function getBootstrapModalInstance(element) {
    if (!element || !window.bootstrap || !window.bootstrap.Modal) return null;
    return window.bootstrap.Modal.getOrCreateInstance(element);
  }

  function isVisibleHomePage() {
    return !!document.getElementById('mdlAvalia') && !!document.getElementById('divListaCifra');
  }

  function getNotaAvalia(starsContainer) {
    if (!starsContainer) return 0;

    const parsed = parseInt(starsContainer.dataset.notaAvalia || '0', 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function setNotaAvalia(starsContainer, value) {
    if (!starsContainer) return;
    starsContainer.dataset.notaAvalia = String(value);
  }

  function updateAvaliacaoPlaceholder(commentField, nota) {
    if (!commentField) return;

    if (nota === 4 || nota === 5) {
      commentField.placeholder = POSITIVE_AVALIACAO_PLACEHOLDER;
      return;
    }

    if (nota === 1 || nota === 2) {
      commentField.placeholder = NEGATIVE_AVALIACAO_PLACEHOLDER;
      return;
    }

    commentField.placeholder = DEFAULT_AVALIACAO_PLACEHOLDER;
  }

  function renderAvaliacaoStars(starsContainer, commentField, submitButton) {
    if (!starsContainer) return;

    const nota = getNotaAvalia(starsContainer);
    const stars = starsContainer.querySelectorAll('[data-star-value]');

    stars.forEach((star) => {
      const starValue = parseInt(star.dataset.starValue || '0', 10);

      if (starValue <= nota) {
        star.classList.remove('star-unselected');
        star.classList.add('star-selected');
      } else {
        star.classList.remove('star-selected');
        star.classList.add('star-unselected');
      }
    });

    updateAvaliacaoPlaceholder(commentField, nota);

    if (submitButton && submitButton.dataset.isBusy !== '1') {
      submitButton.disabled = nota < 1;
    }
  }

  function resetAvaliacaoModalState(modalElement, starsContainer, commentField, submitButton, laterButton) {
    if (!modalElement || !starsContainer) return;

    setNotaAvalia(starsContainer, 0);

    if (commentField) {
      commentField.value = '';
      commentField.placeholder = DEFAULT_AVALIACAO_PLACEHOLDER;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.isBusy = '0';
      submitButton.removeAttribute('aria-busy');
    }

    if (laterButton) {
      laterButton.disabled = false;
      laterButton.dataset.isBusy = '0';
      laterButton.removeAttribute('aria-busy');
    }

    renderAvaliacaoStars(starsContainer, commentField, submitButton);
  }

  function setAvaliacaoButtonsBusyState(submitButton, laterButton, isBusy) {
    const busyValue = isBusy ? '1' : '0';

    if (submitButton) {
      submitButton.dataset.isBusy = busyValue;
      submitButton.disabled = isBusy || submitButton.disabled;
      if (isBusy) {
        submitButton.setAttribute('aria-busy', 'true');
      } else {
        submitButton.removeAttribute('aria-busy');
      }
    }

    if (laterButton) {
      laterButton.dataset.isBusy = busyValue;
      laterButton.disabled = !!isBusy;
      if (isBusy) {
        laterButton.setAttribute('aria-busy', 'true');
      } else {
        laterButton.removeAttribute('aria-busy');
      }
    }
  }

  function initPassphraseModalReset() {
    const modalElement = document.getElementById('fraseSegredo');
    const campo = document.getElementById('inputFraseSegredo');

    if (!modalElement || !campo) return;

    modalElement.addEventListener('hidden.bs.modal', function () {
      campo.value = '';
    });
  }

  function initAvaliacaoModal() {
    const modalElement = document.getElementById('mdlAvalia');
    const starsContainer = document.getElementById('stars');
    const commentField = document.getElementById('commentAvalia');
    const submitButton = document.getElementById('btnEnviarAvalia') || document.getElementById('btnEviarAvalia');
    const laterButton = document.getElementById('btnMaisTardeAvalia');

    if (!modalElement || !starsContainer || !commentField || !submitButton || !laterButton) {
      return;
    }

    submitButton.removeAttribute('data-bs-dismiss');
    laterButton.removeAttribute('data-bs-dismiss');

    function closeAndResetModal() {
      const modalInstance = getBootstrapModalInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
      resetAvaliacaoModalState(modalElement, starsContainer, commentField, submitButton, laterButton);
    }

    starsContainer.addEventListener('click', function (event) {
      if (submitButton.dataset.isBusy === '1' || laterButton.dataset.isBusy === '1') {
        return;
      }

      const clickedStar = event.target.closest('[data-star-value]');
      if (!clickedStar || !starsContainer.contains(clickedStar)) return;

      const clickedValue = parseInt(clickedStar.dataset.starValue || '0', 10);
      const currentNota = getNotaAvalia(starsContainer);
      const newNota = currentNota === clickedValue ? 0 : clickedValue;

      setNotaAvalia(starsContainer, newNota);
      renderAvaliacaoStars(starsContainer, commentField, submitButton);
    });

    modalElement.addEventListener('hidden.bs.modal', function () {
      resetAvaliacaoModalState(modalElement, starsContainer, commentField, submitButton, laterButton);
    });

    laterButton.addEventListener('click', async function (event) {
      event.preventDefault();

      if (laterButton.dataset.isBusy === '1' || submitButton.dataset.isBusy === '1') {
        return;
      }

      if (typeof deferProfileAvaliacaoPrompt !== 'function') {
        console.error('[Cifrei] deferProfileAvaliacaoPrompt não está disponível.');
        return;
      }

      try {
        setAvaliacaoButtonsBusyState(submitButton, laterButton, true);
        await deferProfileAvaliacaoPrompt(MAIS_TARDE_DAYS);
        closeAndResetModal();
      } catch (err) {
        console.error('[Cifrei] Erro ao adiar solicitação de avaliação:', err);
        setAvaliacaoButtonsBusyState(submitButton, laterButton, false);
        renderAvaliacaoStars(starsContainer, commentField, submitButton);
      }
    });

    submitButton.addEventListener('click', async function (event) {
      event.preventDefault();

      if (submitButton.dataset.isBusy === '1' || laterButton.dataset.isBusy === '1') {
        return;
      }

      if (typeof submitUserEvaluation !== 'function') {
        console.error('[Cifrei] submitUserEvaluation não está disponível.');
        return;
      }

      const nota = getNotaAvalia(starsContainer);
      if (nota < 1) {
        renderAvaliacaoStars(starsContainer, commentField, submitButton);
        return;
      }

      try {
        setAvaliacaoButtonsBusyState(submitButton, laterButton, true);
        await submitUserEvaluation({
          nota,
          comentarios: commentField.value || ''
        });
        closeAndResetModal();
      } catch (err) {
        console.error('[Cifrei] Erro ao enviar avaliação:', err);
        setAvaliacaoButtonsBusyState(submitButton, laterButton, false);
        renderAvaliacaoStars(starsContainer, commentField, submitButton);
      }
    });

    resetAvaliacaoModalState(modalElement, starsContainer, commentField, submitButton, laterButton);
  }

  window.maybeOpenAvaliacaoModalOnHomeLoad = async function maybeOpenAvaliacaoModalOnHomeLoad() {
    if (!isVisibleHomePage()) return false;
    if (typeof getProfileAvaliacaoPromptState !== 'function') {
      console.error('[Cifrei] getProfileAvaliacaoPromptState não está disponível.');
      return false;
    }

    const modalElement = document.getElementById('mdlAvalia');
    if (!modalElement) return false;

    const profileState = await getProfileAvaliacaoPromptState();
    const now = new Date();
    const proxPedidoAvalia = profileState && profileState.proxPedidoAvalia
      ? new Date(profileState.proxPedidoAvalia)
      : null;
    const isTimeEligible = !proxPedidoAvalia || Number.isNaN(proxPedidoAvalia.getTime()) || now >= proxPedidoAvalia;
    const hasRelevantUsage = !!(profileState && Number(profileState.contadorUsoRelevante) >= MIN_RELEVANT_USAGE_TO_PROMPT);

    if (!isTimeEligible || !hasRelevantUsage) {
      return false;
    }

    const activeModal = document.querySelector('.modal.show');
    if (activeModal && activeModal.id !== 'mdlAvalia') {
      return false;
    }

    const modalInstance = getBootstrapModalInstance(modalElement);
    if (!modalInstance) return false;

    window.setTimeout(function () {
      const anotherActiveModal = document.querySelector('.modal.show');
      if (anotherActiveModal && anotherActiveModal.id !== 'mdlAvalia') {
        return;
      }
      modalInstance.show();
    }, 300);

    return true;
  };

  document.addEventListener('DOMContentLoaded', function () {
    initPassphraseModalReset();
    initAvaliacaoModal();
  });
})();
