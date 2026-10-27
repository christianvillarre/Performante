(() => {
  const showImageFill = () => {
    const wordmark = document.querySelector('.pw5-closing-cta__wordmark');
    if (!wordmark) return;

    const image = new Image();
    const markReady = () => wordmark.classList.add('pw5-wordmark-ready');
    image.addEventListener('load', markReady, { once: true });
    image.src = '/images/stock15.jpeg';
    if (image.complete && image.naturalWidth > 0) markReady();
  };

  const addCreditTab = () => {
    const footer = document.querySelector('.pw6-final-cta');
    if (!footer || footer.querySelector('.pw-credit-tab')) return;
    const tab = document.createElement('a');
    tab.className = 'pw-credit-tab';
    tab.href = 'https://mcvdesign.com/';
    tab.target = '_blank';
    tab.rel = 'noopener noreferrer';
    tab.setAttribute('aria-label', 'Website by MCV Design (opens in a new tab)');
    tab.innerHTML = '<span class="pw-credit-tab__label">Website by</span><img class="pw-credit-tab__logo" src="/images/mcvlogo.png" alt="" loading="lazy"><span class="pw-credit-tab__arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 19 19 5M8 5h11v11"/></svg></span>';
    footer.appendChild(tab);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { showImageFill(); addCreditTab(); }, { once: true });
  } else {
    showImageFill();
    addCreditTab();
  }
})();
