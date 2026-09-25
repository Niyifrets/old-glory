(function (global) {
  'use strict';

  const DEFAULT_BALANCES = {
    freedomChecking: 1785000.98,
    businessSavings: 12001156.55
  };

  const STORAGE_KEYS = {
    balances: 'ogb_balances',
    transactions: 'ogb_transactions',
    csrf: 'csrfToken',
    otp: 'otpVerified',
    verifiedAt: 'verifiedAt'
  };

  function getBalances() {
    const stored = localStorage.getItem(STORAGE_KEYS.balances);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          freedomChecking: parsed.freedomChecking ?? DEFAULT_BALANCES.freedomChecking,
          businessSavings: parsed.businessSavings ?? DEFAULT_BALANCES.businessSavings
        };
      } catch (e) {}
    }
    return { ...DEFAULT_BALANCES };
  }

  function saveBalances(balances) {
    localStorage.setItem(STORAGE_KEYS.balances, JSON.stringify(balances));
  }

  function deductFromAccount(accountKey, amount) {
    const balances = getBalances();
    const key = accountKey === 'freedom-checking' ? 'freedomChecking' : 'businessSavings';
    balances[key] = Math.round((balances[key] - amount) * 100) / 100;
    saveBalances(balances);
    return balances;
  }

  function getBalanceFor(accountKey) {
    const b = getBalances();
    return accountKey === 'freedom-checking' ? b.freedomChecking : b.businessSavings;
  }

  function getSavedTransactions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.transactions) || '[]');
    } catch (e) {
      return [];
    }
  }

  function addTransaction(tx) {
    const list = getSavedTransactions();
    list.push(tx);
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(list));
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEYS.balances);
    localStorage.removeItem(STORAGE_KEYS.transactions);
  }

  function formatCurrency(n) {
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    return sign + '$' + abs.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatBalanceHTML(n) {
    const abs = Math.abs(n);
    const dollars = Math.floor(abs).toLocaleString('en-US');
    const cents = Math.round((abs - Math.floor(abs)) * 100).toString().padStart(2, '0');
    const sign = n < 0 ? '-' : '';
    return `${sign}$${dollars}<span style="font-size:14px;vertical-align:super">${cents}</span>`;
  }

  function sanitizeInput(input) {
    return (input || '').replace(/[<>]/g, '').trim();
  }

  function generateCSRFToken() {
    return 'csrf_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  function initCSRF() {
    const token = generateCSRFToken();
    sessionStorage.setItem(STORAGE_KEYS.csrf, token);
    return token;
  }

  function checkAuthentication() {
    const otpVerified = sessionStorage.getItem(STORAGE_KEYS.otp);
    const verifiedAt = sessionStorage.getItem(STORAGE_KEYS.verifiedAt);

    if (!otpVerified || !verifiedAt) {
      showSecurityAlert('Authentication required. Redirecting to login...');
      setTimeout(() => { window.location.href = 'index.html'; }, 2000);
      return false;
    }

    const oneHour = 60 * 60 * 1000;
    if (Date.now() - parseInt(verifiedAt) > oneHour) {
      showSecurityAlert('Session expired. Please login again.');
      setTimeout(() => { window.location.href = 'index.html'; }, 2000);
      return false;
    }
    return true;
  }

  function showSecurityAlert(message) {
    const alert = document.createElement('div');
    alert.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: #f8d7da; color: #721c24; padding: 12px 20px;
      border-radius: 8px; border: 1px solid #f5c6cb; z-index: 10000;
      font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: 'Nunito', sans-serif;
    `;
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => { if (alert.parentNode) alert.remove(); }, 5000);
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEYS.otp);
    sessionStorage.removeItem(STORAGE_KEYS.verifiedAt);
    sessionStorage.removeItem(STORAGE_KEYS.csrf);
    showSecurityAlert('You have been successfully logged out.');
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
  }

  function setupSessionTimeout() {
    let inactivityTime = 0;
    const sessionTimeout = 30 * 60 * 1000;
    const reset = () => { inactivityTime = 0; };
    document.addEventListener('mousemove', reset);
    document.addEventListener('keypress', reset);
    document.addEventListener('click', reset);
    setInterval(() => {
      inactivityTime += 1000;
      if (inactivityTime >= sessionTimeout - 60000) {
        showSecurityAlert('Your session will expire in 1 minute due to inactivity.');
      }
      if (inactivityTime >= sessionTimeout) {
        showSecurityAlert('Session expired due to inactivity.');
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
      }
    }, 1000);
  }

  global.BankCommon = {
    DEFAULT_BALANCES,
    STORAGE_KEYS,
    getBalances,
    saveBalances,
    deductFromAccount,
    getBalanceFor,
    getSavedTransactions,
    addTransaction,
    clearAll,
    formatCurrency,
    formatBalanceHTML,
    sanitizeInput,
    generateCSRFToken,
    initCSRF,
    checkAuthentication,
    showSecurityAlert,
    handleLogout,
    setupSessionTimeout
  };

})(window);