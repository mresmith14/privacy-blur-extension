// Auto Blur Sensitive Info - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const mainToggle = document.getElementById('mainToggle');
  const blurEmail = document.getElementById('blurEmail');
  const blurPhone = document.getElementById('blurPhone');
  const blurPassword = document.getElementById('blurPassword');
  const blurCreditCard = document.getElementById('blurCreditCard');
  const scanNowBtn = document.getElementById('scanNow');
  const resetAllBtn = document.getElementById('resetAll');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const emailCount = document.getElementById('emailCount');
  const phoneCount = document.getElementById('phoneCount');
  const passwordCount = document.getElementById('passwordCount');

  // Option items for disabling
  const optionItems = [
    document.getElementById('emailOption'),
    document.getElementById('phoneOption'),
    document.getElementById('passwordOption'),
    document.getElementById('creditCardOption')
  ];

  // Load settings from storage
  async function loadSettings() {
    const result = await chrome.storage.sync.get(['blurSettings', 'extensionEnabled']);
    const settings = result.blurSettings || {};
    const enabled = result.extensionEnabled !== false; // default true

    mainToggle.checked = enabled;
    blurEmail.checked = settings.blurEmails !== false;
    blurPhone.checked = settings.blurPhones !== false;
    blurPassword.checked = settings.blurPasswords !== false;
    blurCreditCard.checked = settings.blurCreditCards || false;

    updateUIState(enabled);
  }

  // Save settings to storage
  async function saveSettings() {
    const settings = {
      blurEmails: blurEmail.checked,
      blurPhones: blurPhone.checked,
      blurPasswords: blurPassword.checked,
      blurCreditCards: blurCreditCard.checked
    };

    await chrome.storage.sync.set({
      blurSettings: settings,
      extensionEnabled: mainToggle.checked
    });

    // Notify content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'toggle',
          enabled: mainToggle.checked,
          settings: settings
        });
      } catch (e) {
        console.log('Could not send message to tab:', e);
      }
    }
  }

  // Update UI based on enabled state
  function updateUIState(enabled) {
    if (enabled) {
      statusIndicator.className = 'status-indicator active';
      statusText.textContent = 'Protection Active';
      optionItems.forEach(item => item.classList.remove('disabled'));
    } else {
      statusIndicator.className = 'status-indicator inactive';
      statusText.textContent = 'Protection Paused';
      optionItems.forEach(item => item.classList.add('disabled'));
    }
  }

  // Update stats from current page
  async function updateStats() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const emails = document.querySelectorAll('[data-type="email"]').length;
          const phones = document.querySelectorAll('[data-type="phone"]').length;
          const passwords = document.querySelectorAll('input[type="password"], [data-type="password"]').length;
          return { emails, phones, passwords };
        }
      });

      if (results && results[0]) {
        const stats = results[0].result;
        emailCount.textContent = stats.emails;
        phoneCount.textContent = stats.phones;
        passwordCount.textContent = stats.passwords;
      }
    } catch (e) {
      console.log('Could not get stats:', e);
    }
  }

  // Event Listeners
  mainToggle.addEventListener('change', async () => {
    updateUIState(mainToggle.checked);
    await saveSettings();
  });

  blurEmail.addEventListener('change', saveSettings);
  blurPhone.addEventListener('change', saveSettings);
  blurPassword.addEventListener('change', saveSettings);
  blurCreditCard.addEventListener('change', saveSettings);

  scanNowBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'scan' });
        scanNowBtn.textContent = '✓ Scanned!';
        setTimeout(() => {
          scanNowBtn.textContent = '🔍 Scan Now';
        }, 1500);
        updateStats();
      } catch (e) {
        console.log('Could not scan:', e);
      }
    }
  });

  resetAllBtn.addEventListener('click', async () => {
    blurEmail.checked = true;
    blurPhone.checked = true;
    blurPassword.checked = true;
    blurCreditCard.checked = false;
    mainToggle.checked = true;
    updateUIState(true);
    await saveSettings();

    resetAllBtn.textContent = '✓ Reset!';
    setTimeout(() => {
      resetAllBtn.textContent = '↺ Reset';
    }, 1500);
  });

  // Initialize
  await loadSettings();
  await updateStats();
});
