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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showImageFill, { once: true });
  } else {
    showImageFill();
  }
})();
