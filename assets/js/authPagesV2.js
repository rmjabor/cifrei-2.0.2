(function () {
  'use strict';

  const STORAGE_KEYS = {
    RESET_EMAIL: 'cifrei_mock_reset_email_v1',
    LOGIN_GUARD: 'cifrei_login_guard_v1',
    PENDING_LOGIN_EMAIL: 'cifrei_pending_login_email_v1',
    LEGAL_RETURN_CONTEXT: 'cifrei_legal_return_context_v1',
    LEGAL_RETURN_BYPASS_CLEAR: 'cifrei_legal_return_bypass_clear_v1',
    CADASTRO_DRAFT_EMAIL: 'cifrei_cadastro_draft_email_v1',
    CADASTRO_DRAFT_FIRST_NAME: 'cifrei_cadastro_draft_first_name_v1',
    CADASTRO_DRAFT_LAST_NAME: 'cifrei_cadastro_draft_last_name_v1'
  };

  const LOGIN_MAX_ATTEMPTS = 5;
  const LOGIN_LOCK_MINUTES = 15;
  const ASCII_PRINTABLE_NO_CONTROL_REGEX = /^[\x20-\x7E]*$/;
  const MULTIPLE_MIDDLE_SPACES_REGEX = /\S\s{2,}\S/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const COMMON_BREACHED_PASSWORDS = new Set([
    '123456789012',
    '1234567890123',
    '12345678901234',
    '123456789012345',
    '1234567890123456',
    '1234567890ab',
    'aaaaaaaaaaaa',
    'abababababab',
    'adminadminadmin',
    'letmeinletmein',
    'password1234',
    'password12345',
    'password123456',
    'qwerty123456',
    'qwertyuiop123',
    'welcome123456'
  ]);

  function qs(id) {
    return document.getElementById(id);
  }

  function getSupabaseClient() {
    return window.cifreiSupabase || window.supabaseClient || null;
  }
  

  function getBootstrapModal(element) {
    if (!element || !window.bootstrap || !window.bootstrap.Modal) return null;
    return window.bootstrap.Modal.getOrCreateInstance(element);
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function setSessionStorageValue(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn('[Cifrei] Não foi possível gravar dados temporários na sessão:', error);
    }
  }

  function getSessionStorageValue(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn('[Cifrei] Não foi possível ler dados temporários da sessão:', error);
      return null;
    }
  }

  function removeSessionStorageValue(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('[Cifrei] Não foi possível limpar dados temporários da sessão:', error);
    }
  }

  function persistCadastroDraftField(key, value) {
    setSessionStorageValue(key, String(value || ''));
  }

  function restoreCadastroDraftField(key, input) {
    if (!input || String(input.value || '') !== '') return;
    const savedValue = getSessionStorageValue(key);
    if (savedValue !== null) {
      input.value = savedValue;
    }
  }

  function clearCadastroDraft() {
    removeSessionStorageValue(STORAGE_KEYS.CADASTRO_DRAFT_EMAIL);
    removeSessionStorageValue(STORAGE_KEYS.CADASTRO_DRAFT_FIRST_NAME);
    removeSessionStorageValue(STORAGE_KEYS.CADASTRO_DRAFT_LAST_NAME);
  }

  function saveCadastroLegalReturnContext() {
    setSessionStorageValue(STORAGE_KEYS.LEGAL_RETURN_CONTEXT, JSON.stringify({
      source: 'cadastrar',
      sourceUrl: window.location.href,
      createdAt: Date.now()
    }));
    removeSessionStorageValue(STORAGE_KEYS.LEGAL_RETURN_BYPASS_CLEAR);
  }


  function buildTermsPageHrefForCadastro() {
    try {
      const url = new URL(buildPageUrl('termos.html'));
      url.searchParams.set('from', 'cadastrar');
      return url.toString();
    } catch (error) {
      return 'termos.html?from=cadastrar';
    }
  }

  async function getSignupLegalAcceptanceMetadata() {
    const legalApi = window.CifreiLegalDocuments;
    if (!legalApi?.fetchActiveLegalDocument) {
      throw new Error('Os Termos de Uso não puderam ser carregados no momento.');
    }

    const activeDocument = await legalApi.fetchActiveLegalDocument();
    const acceptedAt = new Date().toISOString();

    return {
      accepted_legal_document_id: activeDocument?.id || null,
      accepted_legal_at: acceptedAt,
      accepted_legal_document_type: activeDocument?.document_type || null,
      accepted_legal_document_version: activeDocument?.version || null,
      accepted_terms_on_signup: true
    };
  }

  function looksLikeEmail(email) {
    return EMAIL_REGEX.test(String(email || '').trim());
  }

  function stripNonPrintableAscii(value) {
    return Array.from(String(value || '')).filter(char => {
      const code = char.charCodeAt(0);
      return code >= 32 && code <= 126;
    }).join('');
  }

  function getTrimmedPassword(password) {
    return String(password || '').replace(/^\s+|\s+$/g, '');
  }

  function getPasswordLengthForPolicy(password) {
    return getTrimmedPassword(password).length;
  }

  function isAsciiPrintablePassword(password) {
    return ASCII_PRINTABLE_NO_CONTROL_REGEX.test(String(password || ''));
  }

  function hasMultipleMiddleSpaces(password) {
    return MULTIPLE_MIDDLE_SPACES_REGEX.test(String(password || ''));
  }

  function hasRepeatedSequence(text) {
    return /(.)\1{3,}/.test(text) || /(..+)\1{2,}/.test(text);
  }

  function hasKeyboardSequence(text) {
    const lower = text.toLowerCase();
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      'zyxwvutsrqponmlkjihgfedcba',
      '0123456789',
      '9876543210',
      'qwertyuiop',
      'poiuytrewq',
      'asdfghjkl',
      'lkjhgfdsa',
      'zxcvbnm',
      'mnbvcxz'
    ];

    return sequences.some(sequence => {
      for (let i = 0; i <= sequence.length - 4; i += 1) {
        if (lower.includes(sequence.slice(i, i + 4))) return true;
      }
      return false;
    });
  }

  function countCharacterClasses(text) {
    let count = 0;
    if (/[a-z]/.test(text)) count += 1;
    if (/[A-Z]/.test(text)) count += 1;
    if (/\d/.test(text)) count += 1;
    if (/[^A-Za-z0-9\s]/.test(text)) count += 1;
    if (/\s/.test(text)) count += 1;
    return count;
  }

  function isWeakPassword(password, context = {}) {
    const trimmed = getTrimmedPassword(password);
    const lower = trimmed.toLowerCase();
    const compact = lower.replace(/\s+/g, '');
    const uniqueChars = new Set(trimmed).size;
    const emailLocal = normalizeEmail(context.email || '').split('@')[0] || '';
    const firstName = String(context.firstName || '').trim().toLowerCase();
    const lastName = String(context.lastName || '').trim().toLowerCase();

    if (!trimmed || trimmed.length < 12) return false;
    if (COMMON_BREACHED_PASSWORDS.has(compact)) return true;
    if (emailLocal && compact.includes(emailLocal.replace(/[^a-z0-9]/g, ''))) return true;
    if (firstName && compact.includes(firstName.replace(/[^a-z0-9]/g, ''))) return true;
    if (lastName && compact.includes(lastName.replace(/[^a-z0-9]/g, ''))) return true;
    if (hasRepeatedSequence(compact)) return true;
    if (hasKeyboardSequence(compact)) return true;
    if (uniqueChars <= 5) return true;
    if (countCharacterClasses(trimmed) <= 1) return true;
    if (trimmed.length < 14 && countCharacterClasses(trimmed) <= 2) return true;

    return false;
  }

  async function digestHex(algorithm, message, { uppercase = false } = {}) {
    const data = new TextEncoder().encode(String(message || ''));
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hex = Array.from(new Uint8Array(hashBuffer))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

    return uppercase ? hex.toUpperCase() : hex;
  }

  async function sha1Hex(message) {
    return digestHex('SHA-1', message, { uppercase: true });
  }

  async function sha256Hex(message) {
    return digestHex('SHA-256', message);
  }

  async function hashNormalizedEmail(email) {
    return sha256Hex(normalizeEmail(email));
  }

  async function isPwnedPassword(password) {
    const trimmed = getTrimmedPassword(password);
    if (!trimmed || trimmed.length < 12 || !window.crypto?.subtle || !window.fetch) return false;

    try {
      const hash = await sha1Hex(trimmed);
      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        method: 'GET',
        headers: {
          'Add-Padding': 'true'
        }
      });

      if (!response.ok) return false;
      const body = await response.text();
      return body.split('\n').some(line => line.split(':')[0]?.trim() === suffix);
    } catch (error) {
      console.warn('[Cifrei] Não foi possível consultar senhas vazadas no momento.', error);
      return false;
    }
  }

  function generatePrintableAsciiPassword(length = 20) {
    const chars = [];
    for (let code = 33; code <= 126; code += 1) {
      chars.push(String.fromCharCode(code));
    }

    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    return Array.from(array, number => chars[number % chars.length]).join('');
  }

  function loadLoginGuard() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGIN_GUARD);
      const parsed = raw ? JSON.parse(raw) : null;
      return {
        count: parsed?.count || 0,
        lockUntil: parsed?.lockUntil || 0
      };
    } catch (error) {
      return { count: 0, lockUntil: 0 };
    }
  }

  function saveLoginGuard(data) {
    localStorage.setItem(STORAGE_KEYS.LOGIN_GUARD, JSON.stringify(data));
  }

  function clearLoginGuard() {
    localStorage.removeItem(STORAGE_KEYS.LOGIN_GUARD);
  }

  function getRemainingLockMinutes(lockUntil) {
    return Math.max(1, Math.ceil((lockUntil - Date.now()) / 60000));
  }

  function setButtonEnabledState(button, enabled) {
    if (!button) return;
    button.disabled = !enabled;
    button.style.opacity = enabled ? '1' : '0.55';
    button.style.cursor = enabled ? 'pointer' : 'not-allowed';
  }

  function setButtonText(button, text) {
    if (button) button.textContent = text;
  }

  function setHtmlVisibility(element, visible) {
    if (!element) return;
    element.classList.toggle('d-none', !visible);
    element.style.display = visible ? '' : 'none';
  }

  function togglePasswordVisibility(input, icon) {
    if (!input || !icon) return;
    const reveal = input.type === 'password';
    input.type = reveal ? 'text' : 'password';
    icon.classList.toggle('ion-eye', !reveal);
    icon.classList.toggle('ion-eye-disabled', reveal);
  }

  function sanitizePasswordInput(input) {
    if (!input) return;
    const sanitized = stripNonPrintableAscii(input.value);
    if (input.value !== sanitized) {
      const cursor = input.selectionStart;
      input.value = sanitized;
      if (typeof cursor === 'number') {
        const newPos = Math.min(cursor - 1, sanitized.length);
        input.setSelectionRange(Math.max(0, newPos), Math.max(0, newPos));
      }
    }
  }

  function buildPasswordWarningHtml(type) {
    if (type === 'weak') {
      return '<strong><span style="color: rgb(235, 68, 68);">Fraca:</span></strong>&nbsp;A senha que você escolheu é fraca e pode ser facilmente identificada. Considere usar uma senha mais forte.';
    }
    if (type === 'pwned') {
      return '<strong><span style="color: rgb(235, 68, 68);">Vazada:</span></strong>&nbsp;Identificamos que a senha escolhida já apareceu em vazamentos conhecidos. Considere usar uma senha diferente e exclusiva.';
    }
    return '';
  }

  function showInfo(message) {
    window.alert(message);
  }

  function createModalNoticeController(modalId, textId) {
    const element = qs(modalId);
    const textElement = qs(textId);
    const modal = getBootstrapModal(element);
    let onHidden = null;

    element?.addEventListener('hidden.bs.modal', () => {
      const callback = onHidden;
      onHidden = null;
      if (typeof callback === 'function') callback();
    });

    return {
      show(message, options = {}) {
        const { onClose = null } = options;
        if (!modal || !textElement) {
          showInfo(message);
          if (typeof onClose === 'function') onClose();
          return;
        }
        textElement.textContent = message;
        onHidden = typeof onClose === 'function' ? onClose : null;
        modal.show();
      },
      hide() {
        modal?.hide();
      },
      element,
      modal,
      textElement
    };
  }

  function getBaseRedirectUrl() {
    const path = window.location.pathname;
    const lastSlash = path.lastIndexOf('/');
    const directory = lastSlash >= 0 ? path.slice(0, lastSlash + 1) : '/';
    return `${window.location.origin}${directory}`;
  }

  function buildPageUrl(page) {
    return `${getBaseRedirectUrl()}${page}`;
  }

  function getCurrentPageName() {
    const bodyPage = String(document.body?.getAttribute('page') || '').trim().toLowerCase();
    if (bodyPage) return bodyPage;

    const fileName = String(window.location.pathname || '').split('/').pop() || '';
    return fileName.replace(/\.html?$/i, '').trim().toLowerCase();
  }

  async function enforcePageAccess() {
    const supabase = getSupabaseClient();
    const currentPage = getCurrentPageName();
    const protectedPages = new Set(['home', 'cifrar', 'decifrar', 'editarcifra', 'cifraaberta', 'resetpw', 'meuperfil']);
    const guestOnlyPages = new Set(['entrar', 'cadastrar']);

    if (!currentPage || !supabase) {
      return { redirected: false, hasSession: false, currentPage };
    }

    let hasSession = false;

    try {
      const { data } = await supabase.auth.getSession();
      hasSession = Boolean(data?.session);
    } catch (error) {
      console.error('[Cifrei] Não foi possível verificar a sessão atual:', error);
    }

    if (!hasSession && protectedPages.has(currentPage)) {
      window.location.replace('entrar.html');
      return { redirected: true, hasSession, currentPage };
    }

    if (hasSession && guestOnlyPages.has(currentPage)) {
      window.location.replace('home.html');
      return { redirected: true, hasSession, currentPage };
    }

    if (currentPage === 'suporte' || currentPage === 'termos') {
      const floatingMenuButton = document.getElementById('btnMenuFlutuante');
      if (floatingMenuButton) {
        floatingMenuButton.classList.toggle('d-none', !hasSession);
      }
    }

    return { redirected: false, hasSession, currentPage };
  }

  function getFriendlyAuthErrorMessage(error, fallback) {
    const message = String(error?.message || '').toLowerCase();

    if (message.includes('invalid login credentials')) {
      return 'Não foi possível realizar o login. Verifique o e-mail e a senha.';
    }
    if (message.includes('email not confirmed')) {
      return 'Seu e-mail ainda não foi confirmado. Abra a mensagem enviada pelo Cifrei e clique no link de confirmação.';
    }
    if (message.includes('user already registered')) {
      return 'Já existe um usuário cadastrado com este e-mail. Digite outro e-mail, por favor.';
    }
    if (message.includes('signup is disabled')) {
      return 'O cadastro de novos usuários está indisponível no momento.';
    }
    if (message.includes('password should be at least')) {
      return 'A senha precisa ter pelo menos 12 caracteres.';
    }
    if (message.includes('same password')) {
      return 'Escolha uma senha diferente da atual.';
    }
    if (message.includes('expired')) {
      return 'O link expirou. Solicite um novo link de redefinição de senha.';
    }
    if (message.includes('invalid') && message.includes('token')) {
      return 'O link informado é inválido. Solicite um novo link de redefinição de senha.';
    }

    return fallback || 'Não foi possível concluir a operação no momento.';
  }

  function getInvokeErrorDetails(error) {
    const pieces = [
      error?.message,
      error?.name,
      error?.details,
      error?.hint,
      error?.context ? JSON.stringify(error.context) : '',
      error?.originalError ? JSON.stringify(error.originalError) : ''
    ].filter(Boolean);

    const normalized = String(pieces.join(' | ') || '').toLowerCase();

    return {
      raw: normalized,
      isInvalidPassword: normalized.includes('invalid_password')
        || normalized.includes('invalid login credentials')
        || normalized.includes('senha incorreta')
        || normalized.includes('wrong password'),
      isFunctionMissing: normalized.includes('functionsfetcherror')
        || normalized.includes('failed to send a request to the edge function')
        || normalized.includes('edge function returned a non-2xx status code')
        || normalized.includes('404')
        || normalized.includes('not found'),
      isAuthIssue: normalized.includes('401')
        || normalized.includes('403')
        || normalized.includes('jwt')
        || normalized.includes('authorization')
    };
  }


  function createPasswordWatcher(config) {
    const input = qs(config.inputId);
    const warningLabel = qs(config.warningLabelId);
    const spacesLabel = config.spacesLabelId ? qs(config.spacesLabelId) : null;
    const emailInput = config.emailInputId ? qs(config.emailInputId) : null;
    const firstNameInput = config.firstNameInputId ? qs(config.firstNameInputId) : null;
    const lastNameInput = config.lastNameInputId ? qs(config.lastNameInputId) : null;
    let requestCounter = 0;
    let lastState = { weak: false, pwned: false };

    async function refresh() {
      if (!input) return lastState;

      sanitizePasswordInput(input);
      const password = input.value;
      const trimmedLength = getPasswordLengthForPolicy(password);
      const weak = trimmedLength >= 12 && isWeakPassword(password, {
        email: emailInput?.value,
        firstName: firstNameInput?.value,
        lastName: lastNameInput?.value
      });

      let pwned = false;
      const currentRequest = ++requestCounter;
      if (trimmedLength >= 12 && !weak) {
        pwned = await isPwnedPassword(password);
      }

      if (currentRequest !== requestCounter) return lastState;

      lastState = { weak, pwned };

      if (warningLabel) {
        const type = weak ? 'weak' : (pwned ? 'pwned' : '');
        warningLabel.innerHTML = buildPasswordWarningHtml(type);
        setHtmlVisibility(warningLabel, Boolean(type));
      }

      if (spacesLabel) {
        setHtmlVisibility(spacesLabel, hasMultipleMiddleSpaces(password));
      }

      if (typeof config.onStateChange === 'function') {
        config.onStateChange({
          weak,
          pwned,
          trimmedLength,
          hasMultipleMiddleSpaces: hasMultipleMiddleSpaces(password),
          password
        });
      }

      return lastState;
    }

    function queueRefresh() {
      window.clearTimeout(queueRefresh._timer);
      queueRefresh._timer = window.setTimeout(() => {
        refresh();
      }, 350);
    }

    if (input) {
      input.addEventListener('input', queueRefresh);
      input.addEventListener('blur', () => refresh());
    }

    [emailInput, firstNameInput, lastNameInput].forEach(element => {
      if (element) element.addEventListener('input', queueRefresh);
    });

    setHtmlVisibility(warningLabel, false);
    setHtmlVisibility(spacesLabel, false);

    return {
      refresh,
      getState: () => lastState
    };
  }

  function resolveProfileSurnameInput() {
    return qs('inputSobrenomeMeuPerfil') || qs('inputSobrenomeCadastro');
  }

  function setLoadingState(elements, isLoading) {
    elements.filter(Boolean).forEach(element => {
      element.classList.toggle('is-loading', Boolean(isLoading));
    });
  }


  function initMeuPerfilLogout() {
    const supabase = getSupabaseClient();
    const logoutContainer = qs('divLogoutPerfil');
    if (!logoutContainer || !supabase) return;

    logoutContainer.style.cursor = 'pointer';

    logoutContainer.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = 'entrar.html';
      } catch (error) {
        console.error('[Cifrei] Erro ao fazer logout:', error);
        window.alert('Não foi possível encerrar a sessão no momento.');
      }
    });
  }

  async function initMeuPerfilPage() {
    const supabase = getSupabaseClient();
    const titleWrapper = qs('divMeuPerfil');
    const firstNameWrapper = qs('divNomeMeuPerfil');
    const lastNameWrapper = qs('divSobrenomeMeuPerfil');
    const firstNameInput = qs('inputNomeMeuPerfil');
    const lastNameInput = resolveProfileSurnameInput();
    const saveButton = qs('btnSalvarMeuPerfil');
    const resetPasswordButton = qs('btnRedefSenhaPerfil');
    const deleteAccountButton = qs('btnExcluirContaPerfil');
    const profileNotice = createModalNoticeController('mdlAvisosMeuPerfil', 'txtAvisosMeuPerfil');
    const deleteModalElement = qs('mdlConfirmExclConta');
    const deleteModal = window.bootstrap.Modal.getOrCreateInstance(deleteModalElement, {focus: false});
    const deletePasswordInput = qs('inputSenhaExclConta');
    const deletePasswordToggle = qs('icnMostrarExclConta');
    const deleteConfirmButton = qs('btnExclConta');
    const deleteCancelButton = qs('btnDesistirExclConta');
    const wrongPasswordLabel = qs('txtAvisoPwErradaExclConta');

    deleteModalElement?.addEventListener('shown.bs.modal', () => {
      deletePasswordInput?.focus();
    });

    if (!firstNameInput || !lastNameInput || !saveButton || !resetPasswordButton) return;

    const loadingTargets = [
      titleWrapper,
      firstNameWrapper,
      lastNameWrapper,
      saveButton,
      resetPasswordButton,
      deleteAccountButton
    ];

    setLoadingState(loadingTargets, true);
    setButtonEnabledState(saveButton, false);

    if (!supabase) {
      setLoadingState(loadingTargets, false);
      profileNotice.show('Não foi possível inicializar a conexão com o Supabase.');
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session || null;

    if (sessionError || !session?.user) {
      setLoadingState(loadingTargets, false);
      profileNotice.show('Faça login para acessar seu perfil.', {
        onClose: () => {
          window.location.href = 'entrar.html';
        }
      });
      return;
    }

    const user = session.user;
    const userId = user.id;
    const userEmail = String(user.email || '').trim();

    let firstNameOriginal = '';
    let lastNameOriginal = '';

    function getCurrentNames() {
      return {
        firstName: String(firstNameInput.value || '').trim(),
        lastName: String(lastNameInput.value || '').trim()
      };
    }

    function updateSaveButtonState() {
      const { firstName, lastName } = getCurrentNames();
      const hasDifference = firstName !== firstNameOriginal || lastName !== lastNameOriginal;
      const hasValues = firstName !== '' && lastName !== '';
      setButtonEnabledState(saveButton, hasDifference && hasValues);
      setButtonText(saveButton, 'Salvar');
    }

    function resetDeleteAccountModalState() {
      if (deletePasswordInput) {
        deletePasswordInput.value = '';
        deletePasswordInput.type = 'password';
      }
      if (deletePasswordToggle) {
        deletePasswordToggle.classList.add('ion-eye');
        deletePasswordToggle.classList.remove('ion-eye-disabled');
      }
      setHtmlVisibility(wrongPasswordLabel, false);
      if (deleteConfirmButton) {
        setButtonEnabledState(deleteConfirmButton, false);
        setButtonText(deleteConfirmButton, 'Excluir');
      }
    }

    function updateDeleteButtonState() {
      if (!deleteConfirmButton || !deletePasswordInput) return;
      sanitizePasswordInput(deletePasswordInput);
      const length = getPasswordLengthForPolicy(deletePasswordInput.value);
      setButtonEnabledState(deleteConfirmButton, length >= 12 && length <= 64);
      if (!deleteConfirmButton.disabled) {
        setButtonText(deleteConfirmButton, 'Excluir');
      }
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      firstNameOriginal = String(profile?.first_name || user.user_metadata?.first_name || '').trim();
      lastNameOriginal = String(profile?.last_name || user.user_metadata?.last_name || '').trim();

      firstNameInput.value = firstNameOriginal;
      lastNameInput.value = lastNameOriginal;
    } catch (error) {
      console.error('[Cifrei] Erro ao carregar perfil:', error);
      profileNotice.show('Não foi possível carregar os dados do seu perfil.');
    } finally {
      setLoadingState(loadingTargets, false);
      updateSaveButtonState();
      updateDeleteButtonState();
    }

    firstNameInput.addEventListener('input', updateSaveButtonState);
    lastNameInput.addEventListener('input', updateSaveButtonState);

    saveButton.addEventListener('click', async () => {
      updateSaveButtonState();
      if (saveButton.disabled) return;

      const { firstName, lastName } = getCurrentNames();
      setButtonEnabledState(saveButton, false);
      setButtonText(saveButton, 'Salvando...');

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName
        })
        .eq('id', userId);

      if (error) {
        console.error('[Cifrei] Erro ao salvar perfil:', error);
        profileNotice.show('Não foi possível salvar as alterações do seu perfil.');
        updateSaveButtonState();
        return;
      }

      firstNameOriginal = firstName;
      lastNameOriginal = lastName;
      profileNotice.show('Dados do perfil atualizados com sucesso.');
      updateSaveButtonState();
    });

    resetPasswordButton.addEventListener('click', async () => {
      if (!looksLikeEmail(userEmail)) {
        profileNotice.show('Não foi possível identificar o e-mail de cadastro deste usuário.');
        return;
      }

      setButtonEnabledState(resetPasswordButton, false);
      setButtonText(resetPasswordButton, 'Enviando...');

      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: buildPageUrl('resetpw.html')
      });

      setButtonEnabledState(resetPasswordButton, true);
      setButtonText(resetPasswordButton, 'Redefinir senha');

      if (error) {
        console.error('[Cifrei] Erro ao enviar e-mail de redefinição:', error);
        profileNotice.show(getFriendlyAuthErrorMessage(error, 'Não foi possível enviar o e-mail de redefinição de senha.'));
        return;
      }

      sessionStorage.setItem(STORAGE_KEYS.RESET_EMAIL, userEmail);
      profileNotice.show('Enviamos o link de redefinição de senha para o seu e-mail de cadastro.');
    });

    deleteAccountButton?.addEventListener('click', () => {
      resetDeleteAccountModalState();
      deleteModal?.show();
    });

    deletePasswordToggle?.addEventListener('click', () => {
      togglePasswordVisibility(deletePasswordInput, deletePasswordToggle);
      deletePasswordInput?.focus();
    });

    deletePasswordInput?.addEventListener('input', () => {
      setHtmlVisibility(wrongPasswordLabel, false);
      updateDeleteButtonState();
    });

    deleteCancelButton?.addEventListener('click', () => {
      resetDeleteAccountModalState();
      deleteModal?.hide();
    });

    deleteModalElement?.addEventListener('hidden.bs.modal', resetDeleteAccountModalState);

    deleteConfirmButton?.addEventListener('click', async () => {
      updateDeleteButtonState();
      if (deleteConfirmButton.disabled || !deletePasswordInput) return;

      const password = getTrimmedPassword(deletePasswordInput.value);
      setButtonEnabledState(deleteConfirmButton, false);
      setButtonText(deleteConfirmButton, 'Excluindo...');
      setHtmlVisibility(wrongPasswordLabel, false);

      const { data, error } = await supabase.functions.invoke('anonymize-account', {
        body: { password }
      });

      if (error) {
        console.error('[Cifrei] Erro ao invocar anonymize-account:', error);
        const invokeError = getInvokeErrorDetails(error);

        if (invokeError.isInvalidPassword) {
          setHtmlVisibility(wrongPasswordLabel, true);
          deletePasswordInput.focus();
          deletePasswordInput.select();
          updateDeleteButtonState();
          return;
        }

        if (invokeError.isFunctionMissing) {
          profileNotice.show('A Edge Function anonymize-account não respondeu. Verifique se ela foi criada, implantada e publicada com esse nome no Supabase.');
          updateDeleteButtonState();
          return;
        }

        if (invokeError.isAuthIssue) {
          profileNotice.show('Não foi possível autenticar a solicitação de exclusão de conta. Entre novamente e tente de novo.');
          updateDeleteButtonState();
          return;
        }

        profileNotice.show('Não foi possível excluir a conta no momento. Tente novamente.');
        updateDeleteButtonState();
        return;
      }

      if (!data?.success) {
        if (data?.code === 'invalid_password') {
          setHtmlVisibility(wrongPasswordLabel, true);
          deletePasswordInput.focus();
          deletePasswordInput.select();
          updateDeleteButtonState();
          return;
        }

        profileNotice.show(data?.message || 'Não foi possível excluir a conta no momento. Tente novamente.');
        updateDeleteButtonState();
        return;
      }

      deleteModal?.hide();
      resetDeleteAccountModalState();
      await supabase.auth.signOut();
      window.location.href = 'index.html';
    });
  }

  async function initCadastroPage() {
    const supabase = getSupabaseClient();
    const emailInput = qs('inputEmailCadastro');
    const firstNameInput = qs('inputNomeCadastro');
    const lastNameInput = qs('inputSobrenomeCadastro');
    const passwordInput = qs('inputSenhaCadastro');
    const showPasswordIcon = qs('icnMostrarSenhaCadastro');
    const generatePasswordButton = qs('btnGeneratePw');
    const termsLink = qs('linkLeiaTermos');
    const termsCheck = qs('checkLiEconcordo');
    const submitButton = qs('btnCadastrar');
    const signupNotice = createModalNoticeController('mdlAvisosCadastro', 'txtAvisosCadastro');

    if (!emailInput || !firstNameInput || !lastNameInput || !passwordInput || !submitButton) return;
    if (!supabase) {
      setButtonEnabledState(submitButton, false);
      signupNotice.show('Não foi possível inicializar a conexão com o Supabase.');
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      window.location.href = 'home.html';
      return;
    }

    restoreCadastroDraftField(STORAGE_KEYS.CADASTRO_DRAFT_EMAIL, emailInput);
    restoreCadastroDraftField(STORAGE_KEYS.CADASTRO_DRAFT_FIRST_NAME, firstNameInput);
    restoreCadastroDraftField(STORAGE_KEYS.CADASTRO_DRAFT_LAST_NAME, lastNameInput);

    const passwordWatcher = createPasswordWatcher({
      inputId: 'inputSenhaCadastro',
      warningLabelId: 'lblAvisoProbPw',
      spacesLabelId: 'lblAvisoMultiplosEspacos',
      emailInputId: 'inputEmailCadastro',
      firstNameInputId: 'inputNomeCadastro',
      lastNameInputId: 'inputSobrenomeCadastro',
      onStateChange: updateButtonState
    });

    function showSignupNotice(message, { redirectToLogin = false } = {}) {
      signupNotice.show(message, {
        onClose: redirectToLogin ? () => {
          window.location.href = 'entrar.html';
        } : null
      });
    }

    function isPasswordValid() {
      return isAsciiPrintablePassword(passwordInput.value)
        && getPasswordLengthForPolicy(passwordInput.value) >= 12
        && getPasswordLengthForPolicy(passwordInput.value) <= 64;
    }

    function isFormFilled() {
      return [emailInput, firstNameInput, lastNameInput, passwordInput].every(input => String(input.value || '').trim() !== '') && termsCheck.checked;
    }

    function updateButtonState() {
      const allFilled = isFormFilled();
      const emailValid = looksLikeEmail(emailInput.value);
      const passwordValid = isPasswordValid();
      const enabled = allFilled && emailValid && passwordValid;

      setButtonEnabledState(submitButton, enabled);
      if (enabled) {
        setButtonText(submitButton, 'Cadastrar usuário');
      } else if (!allFilled) {
        setButtonText(submitButton, 'Preencha todos os campos e concorde com os termos');
      } else {
        setButtonText(submitButton, 'E-mail ou senha inválidos');
      }
    }

    emailInput.addEventListener('input', () => {
      persistCadastroDraftField(STORAGE_KEYS.CADASTRO_DRAFT_EMAIL, emailInput.value);
      updateButtonState();
    });
    firstNameInput.addEventListener('input', () => {
      persistCadastroDraftField(STORAGE_KEYS.CADASTRO_DRAFT_FIRST_NAME, firstNameInput.value);
      updateButtonState();
    });
    lastNameInput.addEventListener('input', () => {
      persistCadastroDraftField(STORAGE_KEYS.CADASTRO_DRAFT_LAST_NAME, lastNameInput.value);
      updateButtonState();
    });
    termsCheck.addEventListener('change', updateButtonState);
    passwordInput.addEventListener('input', updateButtonState);

    if (showPasswordIcon) {
      showPasswordIcon.addEventListener('click', () => togglePasswordVisibility(passwordInput, showPasswordIcon));
    }

    if (generatePasswordButton) {
      generatePasswordButton.addEventListener('click', () => {
        passwordInput.value = generatePrintableAsciiPassword(20);
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }

    submitButton.addEventListener('click', async () => {
      await passwordWatcher.refresh();
      updateButtonState();
      if (submitButton.disabled) return;

      setButtonEnabledState(submitButton, false);
      setButtonText(submitButton, 'Cadastrando...');

      const normalizedSignupEmail = normalizeEmail(emailInput.value);
      let legalAcceptanceMetadata;

      try {
        legalAcceptanceMetadata = await getSignupLegalAcceptanceMetadata();
      } catch (error) {
        console.error('[Cifrei] Falha ao carregar metadados de aceite no cadastro:', error);
        showSignupNotice('Não foi possível carregar os Termos de Uso vigentes no momento. Atualize a página e tente novamente.');
        updateButtonState();
        return;
      }

      const payload = {
        email: String(emailInput.value || '').trim(),
        password: getTrimmedPassword(passwordInput.value),
        options: {
          emailRedirectTo: buildPageUrl('entrar.html'),
          data: {
            first_name: String(firstNameInput.value || '').trim(),
            last_name: String(lastNameInput.value || '').trim(),
            email_hash: await hashNormalizedEmail(normalizedSignupEmail),
            ...legalAcceptanceMetadata
          }
        }
      };

      const { data, error } = await supabase.auth.signUp(payload);

      if (error) {
        const message = getFriendlyAuthErrorMessage(error, 'Não foi possível concluir o cadastro.');
        if (message.includes('Já existe um usuário')) {
          showSignupNotice('Já existe um usuário cadastrado com este e-mail. Digite outro e-mail, por favor.');
        } else {
          showSignupNotice(message);
        }
        updateButtonState();
        return;
      }

      const identities = data?.user?.identities;
      if (Array.isArray(identities) && identities.length === 0) {
        showSignupNotice('Já existe um usuário cadastrado com este e-mail. Digite outro e-mail, por favor.');
        updateButtonState();
        return;
      }

      setSessionStorageValue(STORAGE_KEYS.PENDING_LOGIN_EMAIL, payload.email);
      clearCadastroDraft();
      removeSessionStorageValue(STORAGE_KEYS.LEGAL_RETURN_CONTEXT);
      removeSessionStorageValue(STORAGE_KEYS.LEGAL_RETURN_BYPASS_CLEAR);
      showSignupNotice('Cadastro realizado. Verifique seu e-mail para confirmar a conta antes de entrar.', {
        redirectToLogin: true
      });
    });

    restoreSubmitButtonState();
    passwordWatcher.refresh();

    if (termsLink) {
      termsLink.href = buildTermsPageHrefForCadastro();
      termsLink.addEventListener('click', () => {
        persistCadastroDraftField(STORAGE_KEYS.CADASTRO_DRAFT_EMAIL, emailInput.value);
        persistCadastroDraftField(STORAGE_KEYS.CADASTRO_DRAFT_FIRST_NAME, firstNameInput.value);
        persistCadastroDraftField(STORAGE_KEYS.CADASTRO_DRAFT_LAST_NAME, lastNameInput.value);
        saveCadastroLegalReturnContext();
      });
    }

  }



  async function initEntrarPage() {
    const supabase = getSupabaseClient();
    const forgotPasswordText = qs('txtEsqueciSenha');
    const emailInput = qs('inputEmailEntrar');
    const passwordInput = qs('inputSenhaEntrar');
    const showPasswordIcon = qs('icnMostrarSenhaEntrar');
    const keepConnectedCheck = qs('checkManterConect');
    const submitButton = qs('btnEntrar');
    const signupButton = qs('btnCadastre');
    const enterNotice = createModalNoticeController('mdlAvisosEntrar', 'txtAvisosEntrar');
    const resetModal = getBootstrapModal(qs('mdlRedefSenha'));
    const resetEmailInput = qs('inputEmailLinkRedef');
    const sendResetButton = qs('btnEnviarLink');

    if (!emailInput || !passwordInput || !submitButton) return;
    if (!supabase) {
      setButtonEnabledState(submitButton, false);
      enterNotice.show('Não foi possível inicializar a conexão com o Supabase.');
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      window.location.href = 'home.html';
      return;
    }

    const prefilledEmail = getSessionStorageValue(STORAGE_KEYS.PENDING_LOGIN_EMAIL);
    if (prefilledEmail && !emailInput.value) {
      emailInput.value = prefilledEmail;
      removeSessionStorageValue(STORAGE_KEYS.PENDING_LOGIN_EMAIL);
    }

    function isPasswordValid() {
      return isAsciiPrintablePassword(passwordInput.value)
        && getPasswordLengthForPolicy(passwordInput.value) >= 12
        && getPasswordLengthForPolicy(passwordInput.value) <= 64;
    }

    function updateLoginButton() {
      const enabled = looksLikeEmail(emailInput.value) && isPasswordValid();
      setButtonEnabledState(submitButton, enabled);
    }

    function updateResetButton() {
      setButtonEnabledState(sendResetButton, looksLikeEmail(resetEmailInput?.value));
    }

    function showEnterNotice(text, options = {}) {
      enterNotice.show(text, options);
    }

    function showLoginError(text, options = {}) {
      setButtonText(submitButton, 'Entrar');
      showEnterNotice(text, {
        ...options,
        onClose: () => {
          setButtonText(submitButton, 'Entrar');
          if (typeof options.onClose === 'function') options.onClose();
        }
      });
    }

    emailInput.addEventListener('input', updateLoginButton);
    passwordInput.addEventListener('input', () => {
      sanitizePasswordInput(passwordInput);
      updateLoginButton();
    });
    resetEmailInput?.addEventListener('input', updateResetButton);

    if (showPasswordIcon) {
      showPasswordIcon.addEventListener('click', () => togglePasswordVisibility(passwordInput, showPasswordIcon));
    }

    signupButton?.addEventListener('click', () => {
      window.location.href = 'cadastrar.html';
    });

    forgotPasswordText?.addEventListener('click', () => {
      if (looksLikeEmail(emailInput.value)) {
        resetEmailInput.value = String(emailInput.value || '').trim();
      }
      updateResetButton();
      resetModal?.show();
    });

    sendResetButton?.addEventListener('click', async (event) => {
      event.preventDefault();
      if (!looksLikeEmail(resetEmailInput?.value)) return;

      const email = String(resetEmailInput.value || '').trim();
      setButtonEnabledState(sendResetButton, false);
      sendResetButton.textContent = 'Enviando...';

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: buildPageUrl('resetpw.html')
      });

      sendResetButton.textContent = 'Enviar Link';
      updateResetButton();

      if (error) {
         console.error('[Cifrei] resetPasswordForEmail error:', error);
//        showEnterNotice(getFriendlyAuthErrorMessage(error, 'Não foi possível enviar o link de redefinição de senha.'));
          showEnterNotice(error.message || 'Não foi possível enviar o link de redefinição de senha.');
        return;
      }

      setSessionStorageValue(STORAGE_KEYS.RESET_EMAIL, email);
      resetModal?.hide();
      showEnterNotice('Enviamos o link de redefinição de senha para o e-mail informado.');
    });

    submitButton.addEventListener('click', async () => {
      updateLoginButton();
      if (submitButton.disabled) return;

      const guard = loadLoginGuard();
      if (guard.lockUntil > Date.now()) {
        showLoginError(`Excesso de tentativas de login sem sucesso. Tente novamente em ${getRemainingLockMinutes(guard.lockUntil)} minutos.`);
        return;
      }

      // O client já foi criado com persistSession: true.
      // No browser, o supabase-js usa localStorage por padrão.
      // Então, por enquanto, não tente alternar persistência aqui.

      setButtonEnabledState(submitButton, false);
      setButtonText(submitButton, 'Entrando...');

      const { error } = await supabase.auth.signInWithPassword({
        email: String(emailInput.value || '').trim(),
        password: getTrimmedPassword(passwordInput.value)
      });

      if (error) {
        const nextCount = guard.count + 1;
        if (nextCount >= LOGIN_MAX_ATTEMPTS) {
          const lockUntil = Date.now() + (LOGIN_LOCK_MINUTES * 60000);
          saveLoginGuard({ count: nextCount, lockUntil });
          showLoginError(`Excesso de tentativas de login sem sucesso. Tente novamente em ${LOGIN_LOCK_MINUTES} minutos.`);
        } else {
          saveLoginGuard({ count: nextCount, lockUntil: 0 });
          showLoginError(getFriendlyAuthErrorMessage(error, 'Não foi possível realizar o login. Verifique o e-mail e a senha.'));
        }
        updateLoginButton();
        return;
      }

      clearLoginGuard();
      window.location.href = 'home.html';
    });

    updateLoginButton();
    updateResetButton();
  }

  async function initResetPage() {
    const supabase = getSupabaseClient();
    const passwordInput = qs('inputSenhaResetPw');
    const showPasswordIcon = qs('icnMostrarSenhaResetPw');
    const generatePasswordButton = qs('btnGenerateResetPw');
    const submitButton = qs('btnConfirmarResetPw');
    const resetNotice = createModalNoticeController('mdlAvisosResetPw', 'txtAvisosResetPw');

    if (!passwordInput || !submitButton) return;
    if (!supabase) {
      setButtonEnabledState(submitButton, false);
      resetNotice.show('Não foi possível inicializar a conexão com o Supabase.');
      return;
    }

    const passwordWatcher = createPasswordWatcher({
      inputId: 'inputSenhaResetPw',
      warningLabelId: 'lblAvisoProbResetPw',
      spacesLabelId: 'lblAvisoMultEspacosResetPw',
      onStateChange: updateButtonState
    });

    function showResetNotice(message, options = {}) {
      resetNotice.show(message, options);
    }

    function isPasswordValid() {
      return isAsciiPrintablePassword(passwordInput.value)
        && getPasswordLengthForPolicy(passwordInput.value) >= 12
        && getPasswordLengthForPolicy(passwordInput.value) <= 64;
    }

    function restoreSubmitButtonState() {
      setButtonText(submitButton, 'Confirmar');
      setButtonEnabledState(submitButton, isPasswordValid());
    }

    function updateButtonState() {
      setButtonEnabledState(submitButton, isPasswordValid());
    }

    resetNotice.element?.addEventListener('hidden.bs.modal', () => {
      const noticeText = String(resetNotice.textElement?.textContent || '');
      if (!noticeText.includes('Senha redefinida com sucesso')) {
        restoreSubmitButtonState();
      }
    });

    passwordInput.addEventListener('input', updateButtonState);


    if (showPasswordIcon) {
      showPasswordIcon.addEventListener('click', () => togglePasswordVisibility(passwordInput, showPasswordIcon));
    }

    if (generatePasswordButton) {
      generatePasswordButton.addEventListener('click', () => {
        passwordInput.value = generatePrintableAsciiPassword(20);
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      showResetNotice('Abra esta página pelo link de redefinição enviado ao seu e-mail.', {
        onClose: () => {
          window.location.href = 'entrar.html';
        }
      });
      return;
    }

    submitButton.addEventListener('click', async () => {
      await passwordWatcher.refresh();
      updateButtonState();
      if (submitButton.disabled) return;

      setButtonEnabledState(submitButton, false);
      setButtonText(submitButton, 'Confirmando...');

      const { error } = await supabase.auth.updateUser({
        password: getTrimmedPassword(passwordInput.value)
      });

      if (error) {
        restoreSubmitButtonState();
        showResetNotice(getFriendlyAuthErrorMessage(error, 'Não foi possível redefinir a senha.'));
        return;
      }

      const resetEmail = getSessionStorageValue(STORAGE_KEYS.RESET_EMAIL);
      if (resetEmail) {
        setSessionStorageValue(STORAGE_KEYS.PENDING_LOGIN_EMAIL, resetEmail);
        removeSessionStorageValue(STORAGE_KEYS.RESET_EMAIL);
      }
      await supabase.auth.signOut();
      showResetNotice('Senha redefinida com sucesso. Faça login novamente.', {
        onClose: () => {
          window.location.href = 'entrar.html';
        }
      });
    });

    updateButtonState();
    passwordWatcher.refresh();
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const accessState = await enforcePageAccess();
    if (accessState.redirected) return;

    await initCadastroPage();
    await initEntrarPage();
    await initResetPage();
    await initMeuPerfilPage();
    initMeuPerfilLogout();
  });
})();

// Resetar o input de e-mail do modal "Esqueci minha senha" sempre que o modal fechar
 document.addEventListener('DOMContentLoaded', function () {
  const modalRedef = document.getElementById('mdlRedefSenha');
  const inputEmailRedef = document.getElementById('inputEmailLinkRedef');

  if (modalRedef && inputEmailRedef) {
    modalRedef.addEventListener('hidden.bs.modal', function () {
      inputEmailRedef.value = '';
    });
  }
});
