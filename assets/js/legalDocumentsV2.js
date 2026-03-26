(function () {
  'use strict';

  const DOCUMENT_TYPE = 'terms_privacy';
  const PAGE_NAME = 'termos';

  function getSupabaseClient() {
    return window.cifreiSupabase || window.supabaseClient || null;
  }

  function getCurrentPageName() {
    const bodyPage = document.body?.getAttribute('page');
    if (bodyPage) return String(bodyPage).trim().toLowerCase();

    const fileName = String(window.location.pathname || '').split('/').pop() || '';
    return fileName.replace(/\.html?$/i, '').trim().toLowerCase();
  }

  function ensureElement(id) {
    return document.getElementById(id);
  }

  function setVisible(element, shouldShow, displayValue) {
    if (!element) return;
    element.classList.toggle('d-none', !shouldShow);
    if (shouldShow && displayValue) {
      element.style.display = displayValue;
    } else if (!shouldShow) {
      element.style.display = '';
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function buildFallbackMessage(message) {
    return [
      '<div class="note note-caution">',
      '  <h2>Não foi possível carregar os termos</h2>',
      `  <p>${escapeHtml(message || 'Tente atualizar a página em instantes.')}</p>`,
      '</div>'
    ].join('');
  }


  function getSessionStorageValue(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn('[Cifrei] Não foi possível ler dados temporários da sessão:', error);
      return null;
    }
  }

  function setSessionStorageValue(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn('[Cifrei] Não foi possível gravar dados temporários na sessão:', error);
    }
  }

  function removeSessionStorageValue(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('[Cifrei] Não foi possível limpar dados temporários da sessão:', error);
    }
  }

  function getLegalReturnContext() {
    const rawContext = getSessionStorageValue('cifrei_legal_return_context_v1');
    if (!rawContext) return null;

    try {
      return JSON.parse(rawContext);
    } catch (error) {
      console.warn('[Cifrei] Contexto de retorno dos termos inválido:', error);
      removeSessionStorageValue('cifrei_legal_return_context_v1');
      return null;
    }
  }

  function clearLegalReturnContext() {
    removeSessionStorageValue('cifrei_legal_return_context_v1');
    removeSessionStorageValue('cifrei_legal_return_bypass_clear_v1');
  }

  function shouldShowCadastroBackButton() {
    const context = getLegalReturnContext();
    if (!context || context.source !== 'cadastrar') return false;

    const referrer = String(document.referrer || '').toLowerCase();
    return referrer.includes('cadastrar.html');
  }

  function setupCadastroBackButton() {
    const wrapper = ensureElement('wrapBtnVoltarCadastroTermos');
    const button = ensureElement('btnVoltarCadastroTermos');
    if (!wrapper || !button) return;

    if (!shouldShowCadastroBackButton()) {
      setVisible(wrapper, false);
      return;
    }

    setVisible(wrapper, true, 'flex');

    button.addEventListener('click', (event) => {
      event.preventDefault();
      setSessionStorageValue('cifrei_legal_return_bypass_clear_v1', '1');

      if (window.history.length > 1) {
        window.history.back();
        return;
      }

      const context = getLegalReturnContext();
      window.location.href = context?.sourceUrl || 'cadastrar.html';
    });
  }

  function setupTermsContextAutoClearOnExit() {
    window.addEventListener('pagehide', () => {
      const bypassClear = getSessionStorageValue('cifrei_legal_return_bypass_clear_v1') === '1';
      if (bypassClear) {
        removeSessionStorageValue('cifrei_legal_return_bypass_clear_v1');
        return;
      }

      clearLegalReturnContext();
    });
  }

  async function fetchActiveLegalDocument() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Cliente do Supabase não disponível.');
    }

    const { data, error } = await supabase
      .from('legal_documents')
      .select('id, title, version, html_content, published_at')
      .eq('document_type', DOCUMENT_TYPE)
      .eq('is_active', true)
      .single();

    if (error) {
      throw error;
    }

    if (!data?.html_content) {
      throw new Error('Nenhum documento legal ativo foi encontrado.');
    }

    return data;
  }

  function renderDocumentMeta(documentData) {
    const titleTarget = ensureElement('lblLegalDocTitle');
    const versionTarget = ensureElement('lblLegalDocVersion');
    const metaTarget = ensureElement('legalDocMeta');

    if (titleTarget && documentData?.title) {
      titleTarget.textContent = documentData.title;
    }

    if (versionTarget) {
      versionTarget.textContent = documentData?.version || '';
      setVisible(versionTarget, Boolean(documentData?.version), 'inline-flex');
    }

    if (metaTarget) {
      setVisible(metaTarget, Boolean(documentData?.version), 'flex');
    }

    if (documentData?.title) {
      document.title = `${documentData.title} | Cifrei`;
    }
  }

function renderDocumentHtml(htmlContent) {
  const contentTarget = ensureElement('legalDocContent');
  if (!contentTarget) return;

  contentTarget.innerHTML = htmlContent;

  // 🔥 REMOVE TÍTULO DUPLICADO
  const internalTitle = contentTarget.querySelector('.doc-title');
  if (internalTitle) internalTitle.remove();

  setVisible(contentTarget, true);

  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }
}

  function renderError(message) {
    const errorTarget = ensureElement('legalDocError');
    const contentTarget = ensureElement('legalDocContent');

    if (contentTarget) {
      contentTarget.innerHTML = '';
      setVisible(contentTarget, false);
    }

    if (errorTarget) {
      errorTarget.innerHTML = buildFallbackMessage(message);
      setVisible(errorTarget, true);
    }
  }

  async function loadTermsPageDocument() {
    if (getCurrentPageName() !== PAGE_NAME) {
      return;
    }

    const loadingTarget = ensureElement('legalDocLoading');
    const errorTarget = ensureElement('legalDocError');
    const contentTarget = ensureElement('legalDocContent');

    setVisible(loadingTarget, true, 'block');
    setVisible(errorTarget, false);
    setVisible(contentTarget, false);

    try {
      const documentData = await fetchActiveLegalDocument();
      renderDocumentMeta(documentData);
      renderDocumentHtml(documentData.html_content);
    } catch (error) {
      console.error('[Cifrei] Falha ao carregar o documento legal ativo:', error);
      renderError('Os termos vigentes não puderam ser carregados no momento.');
    } finally {
      setVisible(loadingTarget, false);
    }
  }

  window.CifreiLegalDocuments = {
    fetchActiveLegalDocument,
    loadTermsPageDocument
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (getCurrentPageName() === PAGE_NAME) {
      setupCadastroBackButton();
      setupTermsContextAutoClearOnExit();
    }

    loadTermsPageDocument();
  });
})();
