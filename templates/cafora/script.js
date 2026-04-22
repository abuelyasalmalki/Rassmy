(function () {
  'use strict';

  const DEFAULT_WHATSAPP_TEXT = 'مرحباً، أود الطلب من كافورا.';

  function normalizeWhatsAppNumber(value) {
    return String(value || '').replace(/[^\d]/g, '').trim();
  }

  function buildWhatsAppUrl(number, text) {
    const normalizedNumber = normalizeWhatsAppNumber(number);
    const encodedText = encodeURIComponent(text || DEFAULT_WHATSAPP_TEXT);

    if (!normalizedNumber) {
      return `https://wa.me/?text=${encodedText}`;
    }

    return `https://wa.me/${normalizedNumber}?text=${encodedText}`;
  }

  function openWhatsApp(customText) {
    const number =
      document.querySelector('[data-whatsapp]')?.getAttribute('data-whatsapp') || '';

    const url = buildWhatsAppUrl(number, customText || DEFAULT_WHATSAPP_TEXT);
    window.open(url, '_blank', 'noopener');
  }

  async function copyTextToClipboard(text) {
    const value = String(text || '').trim();
    if (!value) return false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch (error) {
        // Fallback below
      }
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(textarea);
    return copied;
  }

  async function handleCopyButtonClick(button) {
    const explicitValue = button.getAttribute('data-copy');
    const fallbackValue = button.previousElementSibling?.textContent || '';
    const textToCopy = explicitValue || fallbackValue;

    if (!textToCopy) return;

    const originalLabel = button.textContent;
    const copied = await copyTextToClipboard(textToCopy);

    button.textContent = copied ? '✓ نُسخ' : 'تعذر النسخ';
    button.disabled = true;

    window.setTimeout(() => {
      button.textContent = originalLabel;
      button.disabled = false;
    }, 1200);
  }

  function setupCopyButtons() {
    document.addEventListener('click', function (event) {
      const button = event.target.closest('.copy-btn');
      if (!button) return;

      handleCopyButtonClick(button);
    });
  }

  setupCopyButtons();

  window.openWhatsApp = openWhatsApp;
})();
