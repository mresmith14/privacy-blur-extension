// Auto Blur Sensitive Info - Content Script
// Detects and blurs emails, phone numbers, and passwords on web pages

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    blurEmails: true,
    blurPhones: true,
    blurPasswords: true,
    blurCreditCards: false, // Optional feature
    hoverToReveal: true,
    showIndicators: true,
    blurStrength: {
      email: '6px',
      phone: '6px',
      password: '12px',
      creditCard: '8px'
    }
  };

  // Regex patterns for detection
  const PATTERNS = {
    // Email pattern - comprehensive
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

    // Phone patterns - international formats
    phone: /\b(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([0-9]{3})\s*\)|([0-9]{3}))\s*(?:[.-]\s*)?)?([0-9]{3})\s*(?:[.-]\s*)?([0-9]{4})\b/g,

    // International phone format
    phoneIntl: /\+(?:[0-9] ?){6,14}[0-9]/g,

    // Credit card (optional, basic pattern)
    creditCard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g
  };

  // State
  let isEnabled = true;
  let processedElements = new WeakSet();
  let observer = null;

  // Utility: Check if element is editable or interactive
  function isEditable(element) {
    if (!element) return false;
    const tagName = element.tagName.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea';
    const isContentEditable = element.isContentEditable;
    return isInput || isContentEditable;
  }

  // Utility: Check if element should be excluded
  function shouldExclude(element) {
    if (!element) return true;

    // Exclude script, style, code elements
    const excludeTags = ['script', 'style', 'code', 'pre', 'noscript', 'iframe'];
    if (excludeTags.includes(element.tagName.toLowerCase())) return true;

    // Exclude elements inside code blocks
    let parent = element.parentElement;
    while (parent) {
      if (excludeTags.includes(parent.tagName.toLowerCase())) return true;
      parent = parent.parentElement;
    }

    // Check if already processed
    if (processedElements.has(element)) return true;

    return false;
  }

  // Create blurred span wrapper
  function createBlurSpan(text, type) {
    const span = document.createElement('span');
    span.className = 'auto-blur-sensitive';
    span.setAttribute('data-type', type);
    span.setAttribute('data-original', text);
    span.setAttribute('tabindex', '0');
    span.setAttribute('role', 'button');
    span.setAttribute('aria-label', `${type} information blurred for privacy. Click or hover to reveal.`);
    span.textContent = text;

    // Add indicator badge if enabled
    if (CONFIG.showIndicators) {
      const badge = document.createElement('span');
      badge.className = 'auto-blur-badge';
      badge.textContent = type === 'password' ? '🔒' : '👁';
      span.appendChild(badge);
    }

    // Add click to toggle
    span.addEventListener('click', function(e) {
      e.stopPropagation();
      if (this.classList.contains('auto-blur-revealed')) {
        this.classList.remove('auto-blur-revealed');
        this.style.filter = '';
      } else {
        this.classList.add('auto-blur-revealed');
        this.style.filter = 'blur(0px)';
      }
    });

    return span;
  }

  // Process text node for sensitive data
  function processTextNode(node) {
    if (!node || !node.textContent) return;

    const text = node.textContent;
    const parent = node.parentElement;

    if (shouldExclude(parent)) return;

    let hasMatch = false;
    let html = text;
    const matches = [];

    // Find all sensitive data matches
    if (CONFIG.blurEmails) {
      let match;
      while ((match = PATTERNS.email.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          type: 'email'
        });
      }
      PATTERNS.email.lastIndex = 0;
    }

    if (CONFIG.blurPhones) {
      let match;
      while ((match = PATTERNS.phone.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          type: 'phone'
        });
      }
      PATTERNS.phone.lastIndex = 0;

      while ((match = PATTERNS.phoneIntl.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          type: 'phone'
        });
      }
      PATTERNS.phoneIntl.lastIndex = 0;
    }

    if (CONFIG.blurCreditCards) {
      let match;
      while ((match = PATTERNS.creditCard.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          type: 'creditCard'
        });
      }
      PATTERNS.creditCard.lastIndex = 0;
    }

    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches
    const filteredMatches = [];
    let lastEnd = 0;
    for (const match of matches) {
      if (match.start >= lastEnd) {
        filteredMatches.push(match);
        lastEnd = match.end;
      }
    }

    // Replace matches with blurred spans
    if (filteredMatches.length > 0) {
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      for (const match of filteredMatches) {
        // Add text before match
        if (match.start > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.start)));
        }

        // Add blurred span
        const blurSpan = createBlurSpan(match.text, match.type);
        fragment.appendChild(blurSpan);
        processedElements.add(blurSpan);

        lastIndex = match.end;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      // Replace original node
      if (parent) {
        parent.replaceChild(fragment, node);
      }
    }
  }

  // Process password inputs
  function processPasswordInputs() {
    if (!CONFIG.blurPasswords) return;

    const passwordInputs = document.querySelectorAll('input[type="password"]');

    passwordInputs.forEach(input => {
      if (processedElements.has(input)) return;

      input.classList.add('auto-blur-sensitive');
      input.setAttribute('data-type', 'password');
      input.setAttribute('data-blurred', 'true');

      // Add event listeners for hover/focus
      input.addEventListener('mouseenter', function() {
        if (CONFIG.hoverToReveal) {
          this.classList.add('auto-blur-revealed');
        }
      });

      input.addEventListener('mouseleave', function() {
        if (!document.activeElement === this) {
          this.classList.remove('auto-blur-revealed');
        }
      });

      input.addEventListener('focus', function() {
        this.classList.add('auto-blur-revealed');
      });

      input.addEventListener('blur', function() {
        this.classList.remove('auto-blur-revealed');
      });

      processedElements.add(input);
    });
  }

  // Process text content in element
  function processElement(element) {
    if (!element || shouldExclude(element)) return;

    // Process child text nodes
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while ((node = walker.nextNode()) !== null) {
      textNodes.push(node);
    }

    // Process text nodes (in reverse to avoid index issues)
    textNodes.reverse().forEach(processTextNode);
  }

  // Main scan function
  function scanPage() {
    if (!isEnabled) return;

    // Process password inputs
    processPasswordInputs();

    // Process text content
    processElement(document.body);
  }

  // Set up mutation observer for dynamic content
  function setupObserver() {
    if (observer) observer.disconnect();

    observer = new MutationObserver((mutations) => {
      if (!isEnabled) return;

      let shouldScan = false;

      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Process new elements
              if (node.tagName === 'INPUT' && node.type === 'password') {
                processPasswordInputs();
              } else if (!shouldExclude(node)) {
                processElement(node);
              }
            } else if (node.nodeType === Node.TEXT_NODE) {
              processTextNode(node);
            }
          });
        } else if (mutation.type === 'characterData') {
          processTextNode(mutation.target);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggle') {
      isEnabled = request.enabled;
      if (isEnabled) {
        scanPage();
      } else {
        // Remove all blur effects
        document.querySelectorAll('.auto-blur-sensitive').forEach(el => {
          el.classList.remove('auto-blur-sensitive');
          el.style.filter = '';
        });
      }
      sendResponse({ success: true });
    } else if (request.action === 'getStatus') {
      sendResponse({ enabled: isEnabled });
    } else if (request.action === 'scan') {
      scanPage();
      sendResponse({ success: true });
    }
    return true;
  });

  // Load settings from storage
  chrome.storage.sync.get(['blurSettings'], (result) => {
    if (result.blurSettings) {
      Object.assign(CONFIG, result.blurSettings);
    }

    // Initialize
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        scanPage();
        setupObserver();
      });
    } else {
      scanPage();
      setupObserver();
    }
  });

  // Re-scan on URL changes (for SPAs)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(scanPage, 500);
    }
  }).observe(document, { subtree: true, childList: true });

  console.log('🔒 Auto Blur Sensitive Info: Extension loaded');
})();
