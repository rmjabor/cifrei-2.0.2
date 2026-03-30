(function () {
  'use strict';

  const DOCUMENT_TYPE = 'terms_privacy';
  const TERMS_PAGE_NAME = 'termos';
  const ENFORCED_PAGE_NAMES = new Set(['home', 'cifrar']);
  const LEGAL_RETURN_CONTEXT_KEY = 'cifrei_legal_return_context_v1';
  const LEGAL_RETURN_BYPASS_CLEAR_KEY = 'cifrei_legal_return_bypass_clear_v1';
  const READ_TERMS_LABEL = '<strong><span style="text-decoration: underline; color: rgb(0, 41, 255);">Clique aqui</span></strong> <span style="color: rgb(66, 66, 66);">para ler os novos Termos.</span>';
  const HIDE_TERMS_LABEL = '<strong><span style="text-decoration: underline; color: rgb(0, 41, 255);">Clique aqui</span></strong> <span style="color: rgb(66, 66, 66);">para esconder os novos Termos.</span>';

  let activeLegalDocumentCache = null;
  let hasCheckedLegalAcceptance = false;
  let pendingModalToggleHandler = null;
  let pendingAgreeHandler = null;
  let pendingLogoutHandler = null;

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
    const rawContext = getSessionStorageValue(LEGAL_RETURN_CONTEXT_KEY);
    if (!rawContext) return null;

    try {
      return JSON.parse(rawContext);
    } catch (error) {
      console.warn('[Cifrei] Contexto de retorno dos termos inválido:', error);
      removeSessionStorageValue(LEGAL_RETURN_CONTEXT_KEY);
      return null;
    }
  }

  function clearLegalReturnContext() {
    removeSessionStorageValue(LEGAL_RETURN_CONTEXT_KEY);
    removeSessionStorageValue(LEGAL_RETURN_BYPASS_CLEAR_KEY);
  }

  function getTermsPageOriginHint() {
    try {
      const url = new URL(window.location.href);
      return String(url.searchParams.get('from') || '').trim().toLowerCase();
    } catch (error) {
      return '';
    }
  }

  function cameFromCadastroReferrer() {
    try {
      if (!document.referrer) return false;
      const referrerUrl = new URL(document.referrer);
      const currentUrl = new URL(window.location.href);
      if (referrerUrl.origin !== currentUrl.origin) return false;
      return /\/cadastrar\.html?$/i.test(referrerUrl.pathname);
    } catch (error) {
      return false;
    }
  }

  function shouldShowCadastroBackButton() {
    const context = getLegalReturnContext();
    return Boolean(
      (context && context.source === 'cadastrar')
      || getTermsPageOriginHint() === 'cadastrar'
      || cameFromCadastroReferrer()
    );
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
      setSessionStorageValue(LEGAL_RETURN_BYPASS_CLEAR_KEY, '1');

      if (window.history.length > 1) {
        window.history.back();
        return;
      }

      const context = getLegalReturnContext();

      try {
        if (document.referrer) {
          const referrerUrl = new URL(document.referrer);
          const currentUrl = new URL(window.location.href);
          if (referrerUrl.origin === currentUrl.origin && /\/cadastrar\.html?$/i.test(referrerUrl.pathname)) {
            window.location.href = referrerUrl.href;
            return;
          }
        }
      } catch (error) {
        console.warn('[Cifrei] Não foi possível resolver o retorno para o cadastro:', error);
      }

      window.location.href = context?.sourceUrl || 'cadastrar.html';
    });
  }

  function setupTermsContextAutoClearOnExit() {
    window.addEventListener('pagehide', () => {
      const bypassClear = getSessionStorageValue(LEGAL_RETURN_BYPASS_CLEAR_KEY) === '1';
      if (bypassClear) {
        removeSessionStorageValue(LEGAL_RETURN_BYPASS_CLEAR_KEY);
        return;
      }

      clearLegalReturnContext();
    });
  }

  async function fetchActiveLegalDocument() {
    if (activeLegalDocumentCache) return activeLegalDocumentCache;

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Cliente do Supabase não disponível.');
    }

    const { data, error } = await supabase
      .from('legal_documents')
      .select('id, document_type, title, version, html_content, published_at')
      .eq('document_type', DOCUMENT_TYPE)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    if (!data?.html_content) {
      throw new Error('Nenhum documento legal ativo foi encontrado.');
    }

    activeLegalDocumentCache = data;
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
    if (getCurrentPageName() !== TERMS_PAGE_NAME) {
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

  function getBlockingTermsModal() {
    const modalElement = ensureElement('mdlNovosTermos');
    if (!modalElement || !window.bootstrap?.Modal) return null;
    return window.bootstrap.Modal.getOrCreateInstance(modalElement, {
      backdrop: 'static',
      keyboard: false,
      focus: true
    });
  }

  async function getAuthenticatedUser() {
    const supabase = getSupabaseClient();
    if (!supabase?.auth) return null;

    const [{ data: userData, error: userError }, { data: sessionData, error: sessionError }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession()
    ]);

    if (userError) throw userError;
    if (sessionError) throw sessionError;

    return userData?.user || sessionData?.session?.user || null;
  }

  async function fetchCurrentProfileAcceptance(userId) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Cliente do Supabase não disponível.');

    const { data, error } = await supabase
      .from('profiles')
      .select('accepted_legal_document_id, accepted_legal_at')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data || null;
  }

  function setInlineTermsVisible(shouldShow) {
    const legalDocument = ensureElement('legalDocument');
    const toggleTrigger = ensureElement('txtLerTermos');
    if (!legalDocument || !toggleTrigger) return;

    setVisible(legalDocument, shouldShow);
    toggleTrigger.innerHTML = shouldShow ? HIDE_TERMS_LABEL : READ_TERMS_LABEL;
  }

  function renderEnforcementModalDocument(documentData) {
    const titleTarget = ensureElement('legalTitle');
    const versionTarget = ensureElement('legalVersion');
    const htmlTarget = ensureElement('htmlLegalContent');

    if (titleTarget) {
      titleTarget.textContent = documentData?.title || '';
    }

    if (versionTarget) {
      versionTarget.textContent = documentData?.version || '';
    }

    if (htmlTarget) {
      htmlTarget.innerHTML = documentData?.html_content || '';
    }

    setInlineTermsVisible(false);
  }


  function extractPendingAcceptanceFromUser(user) {
    const metadata = user?.user_metadata || user?.raw_user_meta_data || {};
    if (!metadata || typeof metadata !== 'object') return null;

    const documentId = metadata.accepted_legal_document_id;
    const acceptedAt = metadata.accepted_legal_at;

    if (documentId === null || documentId === undefined || !acceptedAt) {
      return null;
    }

    return {
      documentId,
      acceptedAt: String(acceptedAt)
    };
  }

  function doesAcceptanceMatchActiveDocument(pendingAcceptance, activeDocument) {
    if (!pendingAcceptance || !activeDocument?.id) return false;
    return String(pendingAcceptance.documentId) === String(activeDocument.id);
  }

  function detachPreviousListener(element, handler) {
    if (!element || !handler) return;
    element.removeEventListener('click', handler);
  }

  async function recordLegalAcceptance(userId, activeDocument, acceptedAtOverride) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Cliente do Supabase não disponível.');

    const acceptedAt = acceptedAtOverride || new Date().toISOString();

    const { error: insertError } = await supabase
      .from('legal_acceptances')
      .insert({
        user_id: userId,
        document_type: activeDocument.document_type || DOCUMENT_TYPE,
        legal_document_id: activeDocument.id,
        accepted_at: acceptedAt,
        created_at: acceptedAt
      });

    if (insertError) {
      const normalizedInsertError = String(insertError?.message || '').toLowerCase();
      const isDuplicateAcceptance = normalizedInsertError.includes('duplicate') || normalizedInsertError.includes('unique');
      if (!isDuplicateAcceptance) {
        throw insertError;
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        accepted_legal_document_id: activeDocument.id,
        accepted_legal_at: acceptedAt
      })
      .eq('id', userId);

    if (updateError) throw updateError;
  }

  async function logoutCurrentUser() {
    const supabase = getSupabaseClient();
    if (supabase?.auth?.signOut) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    window.location.href = 'entrar.html';
  }

  function setActionButtonBusy(button, isBusy, busyText, idleText) {
    if (!button) return;
    if (!button.dataset.originalLabel) {
      button.dataset.originalLabel = idleText || button.textContent || '';
    }
    button.disabled = Boolean(isBusy);
    button.textContent = isBusy ? (busyText || 'Processando...') : (idleText || button.dataset.originalLabel || button.textContent || '');
  }

  function bindEnforcementModalEvents(activeDocument, userId, modalInstance) {
    const toggleTrigger = ensureElement('txtLerTermos');
    const agreeButton = ensureElement('btnLiEConcordo');
    const logoutButton = ensureElement('btnSairNovosTermos');

    if (agreeButton?.hasAttribute('data-bs-dismiss')) {
      agreeButton.removeAttribute('data-bs-dismiss');
    }

    if (toggleTrigger) {
      detachPreviousListener(toggleTrigger, pendingModalToggleHandler);
      pendingModalToggleHandler = function (event) {
        event.preventDefault();
        const legalDocument = ensureElement('legalDocument');
        const isHidden = legalDocument?.classList.contains('d-none');
        setInlineTermsVisible(Boolean(isHidden));
      };
      toggleTrigger.addEventListener('click', pendingModalToggleHandler);
    }

    if (agreeButton) {
      detachPreviousListener(agreeButton, pendingAgreeHandler);
      pendingAgreeHandler = async function (event) {
        event.preventDefault();
        event.stopPropagation();

        setActionButtonBusy(agreeButton, true, 'Salvando aceite...');
        setActionButtonBusy(logoutButton, true, logoutButton.textContent, logoutButton.textContent);

        try {
          await recordLegalAcceptance(userId, activeDocument);
          modalInstance.hide();
        } catch (error) {
          console.error('[Cifrei] Falha ao registrar aceite dos novos termos:', error);
          window.alert('Não foi possível registrar o seu aceite dos novos Termos no momento. Tente novamente.');
        } finally {
          setActionButtonBusy(agreeButton, false);
          setActionButtonBusy(logoutButton, false, null, logoutButton?.dataset.originalLabel || logoutButton?.textContent || 'Sair');
        }
      };
      agreeButton.addEventListener('click', pendingAgreeHandler);
    }

    if (logoutButton) {
      detachPreviousListener(logoutButton, pendingLogoutHandler);
      pendingLogoutHandler = async function (event) {
        event.preventDefault();
        event.stopPropagation();

        setActionButtonBusy(agreeButton, true, agreeButton?.dataset.originalLabel || 'Li e concordo com os novos Termos de Uso e Política de Privacidade', agreeButton?.dataset.originalLabel || 'Li e concordo com os novos Termos de Uso e Política de Privacidade');
        setActionButtonBusy(logoutButton, true, 'Saindo...');

        try {
          modalInstance.hide();
          await logoutCurrentUser();
        } catch (error) {
          console.error('[Cifrei] Falha ao encerrar a sessão após recusa dos novos termos:', error);
          window.alert('Não foi possível encerrar a sessão no momento. Tente novamente.');
          modalInstance.show();
          setActionButtonBusy(agreeButton, false);
          setActionButtonBusy(logoutButton, false);
        }
      };
      logoutButton.addEventListener('click', pendingLogoutHandler);
    }
  }

  async function enforceUpdatedTermsIfNeeded() {
    const currentPage = getCurrentPageName();
    if (!ENFORCED_PAGE_NAMES.has(currentPage) || hasCheckedLegalAcceptance) {
      return;
    }

    hasCheckedLegalAcceptance = true;

    const modalElement = ensureElement('mdlNovosTermos');
    if (!modalElement) return;

    try {
      const user = await getAuthenticatedUser();
      if (!user?.id) return;

      const [activeDocument, profileAcceptance] = await Promise.all([
        fetchActiveLegalDocument(),
        fetchCurrentProfileAcceptance(user.id)
      ]);

      if (String(profileAcceptance?.accepted_legal_document_id || '') === String(activeDocument.id)) {
        return;
      }

      const pendingAcceptance = extractPendingAcceptanceFromUser(user);
      if (doesAcceptanceMatchActiveDocument(pendingAcceptance, activeDocument)) {
        try {
          await recordLegalAcceptance(user.id, activeDocument, pendingAcceptance.acceptedAt);
          return;
        } catch (error) {
          console.error('[Cifrei] Falha ao consolidar o aceite registrado no cadastro:', error);
        }
      }

      renderEnforcementModalDocument(activeDocument);
      const modalInstance = getBlockingTermsModal();
      if (!modalInstance) return;
      bindEnforcementModalEvents(activeDocument, user.id, modalInstance);
      modalInstance.show();
    } catch (error) {
      console.error('[Cifrei] Falha ao verificar atualização dos Termos:', error);
    }
  }

  window.CifreiLegalDocuments = {
    fetchActiveLegalDocument,
    loadTermsPageDocument,
    enforceUpdatedTermsIfNeeded
  };

  document.addEventListener('DOMContentLoaded', () => {
    const currentPage = getCurrentPageName();

    if (currentPage === TERMS_PAGE_NAME) {
      setupCadastroBackButton();
      setupTermsContextAutoClearOnExit();
    }

    loadTermsPageDocument();
    enforceUpdatedTermsIfNeeded();
  });
})();
