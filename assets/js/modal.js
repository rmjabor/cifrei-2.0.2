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

  function setAvaliacaoButtonsBusyState(submitButton, laterButton, isBusy, starsContainer) {
    const busyValue = isBusy ? '1' : '0';
    const notaAtual = getNotaAvalia(starsContainer);

    if (submitButton) {
      submitButton.dataset.isBusy = busyValue;
      submitButton.disabled = isBusy ? true : notaAtual < 1;
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

  function forceHideModalElement(modalElement) {
    if (!modalElement) return;

    modalElement.classList.remove('show');
    modalElement.setAttribute('aria-hidden', 'true');
    modalElement.style.display = 'none';
    modalElement.removeAttribute('aria-modal');
    modalElement.removeAttribute('role');

    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');

    document.querySelectorAll('.modal-backdrop').forEach(function (backdrop) {
      backdrop.remove();
    });
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
      let didHideByEvent = false;

      const handleHidden = function () {
        didHideByEvent = true;
        modalElement.removeEventListener('hidden.bs.modal', handleHidden);
        resetAvaliacaoModalState(modalElement, starsContainer, commentField, submitButton, laterButton);
      };

      modalElement.addEventListener('hidden.bs.modal', handleHidden);

      if (modalInstance) {
        modalInstance.hide();
      } else {
        forceHideModalElement(modalElement);
      }

      window.setTimeout(function () {
        if (didHideByEvent) return;

        modalElement.removeEventListener('hidden.bs.modal', handleHidden);
        forceHideModalElement(modalElement);
        resetAvaliacaoModalState(modalElement, starsContainer, commentField, submitButton, laterButton);
      }, 450);
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
        setAvaliacaoButtonsBusyState(submitButton, laterButton, true, starsContainer);
        await deferProfileAvaliacaoPrompt(MAIS_TARDE_DAYS);
        closeAndResetModal();
      } catch (err) {
        console.error('[Cifrei] Erro ao adiar solicitação de avaliação:', err);
        setAvaliacaoButtonsBusyState(submitButton, laterButton, false, starsContainer);
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
        setAvaliacaoButtonsBusyState(submitButton, laterButton, true, starsContainer);
        await submitUserEvaluation({
          nota,
          comentarios: commentField.value || ''
        });
        closeAndResetModal();
      } catch (err) {
        console.error('[Cifrei] Erro ao enviar avaliação:', err);
        setAvaliacaoButtonsBusyState(submitButton, laterButton, false, starsContainer);
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



  function ensureHelpModalExists() {
    if (document.getElementById('mdlHelp')) return document.getElementById('mdlHelp');
    if (!document.querySelector('.icnHelp[data-help-key]')) return null;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal fade" role="dialog" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false" id="mdlHelp" style="background: transparent;margin-top: 0px;" area-hiden="true">
        <div class="modal-dialog modal-confirma-excluir" role="document">
          <div class="modal-content">
            <div class="modal-header d-flex justify-content-center" style="background: #ffffff;border-radius: 0px 0px 0px 0px;border-style: none;border-top-left-radius: 10px;border-top-right-radius: 10px;"><img src="assets/img/Img_C_ifre_i.png" width="38" height="52"></div>
            <div class="modal-body" style="background: #ffffff;padding: 0px;padding-top: 0px;height: auto;padding-right: 15px;padding-left: 15px;">
              <div id="htmlHelpContent" style="max-height: 300px;min-height: 50px;"></div>
            </div>
            <div class="modal-footer d-flex justify-content-center" style="background: #ffffff;border-bottom-right-radius: 10px;border-bottom-left-radius: 10px;border-style: none;padding-top: 12px;padding-bottom: 25px;padding-right: 15px;padding-left: 15px;"><button class="btn btnPadrao" id="btnEntendiHelp" type="button" style="font-family: 'Open Sans', sans-serif;font-size: 16px;background: #fd641d;color: rgb(255,255,255);border-style: none;box-shadow: 1px 1px 3px #a7a7a7;width: 100%;">Entendi</button></div>
          </div>
        </div>
      </div>`;

    const modalElement = wrapper.firstElementChild;
    document.body.insertBefore(modalElement, document.body.firstChild);
    return modalElement;
  }

  function getHelpContentContainer() {
    return document.getElementById('htmlHelpContent');
  }

  function getHelpContentMap() {
    return window.HELP_CONTENT || (typeof HELP_CONTENT !== 'undefined' ? HELP_CONTENT : null);
  }

  function initHelpModal() {
    const triggerElements = document.querySelectorAll('.icnHelp[data-help-key]');
    if (!triggerElements.length) return;

    const modalElement = ensureHelpModalExists();
    const contentContainer = getHelpContentContainer();
    const closeButton = document.getElementById('btnEntendiHelp');

    if (!modalElement || !contentContainer || !closeButton) return;

    const modalInstance = window.bootstrap && window.bootstrap.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(modalElement, { backdrop: 'static', keyboard: false })
      : null;

    closeButton.addEventListener('click', function () {
      if (modalInstance) {
        modalInstance.hide();
      }
    });

    modalElement.addEventListener('hidden.bs.modal', function () {
      contentContainer.innerHTML = '';
    });

    triggerElements.forEach(function (trigger) {
      trigger.addEventListener('click', function (event) {
        event.preventDefault();

        const helpKey = trigger.dataset.helpKey || '';
        const helpContentMap = getHelpContentMap();
        const html = helpContentMap && helpContentMap[helpKey]
          ? helpContentMap[helpKey]
          : '<p>Ajuda indisponível para este tópico.</p>';

        contentContainer.innerHTML = html;

        if (modalInstance) {
          modalInstance.show();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPassphraseModalReset();
    initAvaliacaoModal();
    initHelpModal();
  });
})();
