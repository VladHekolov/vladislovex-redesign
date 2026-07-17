/* Mobile calculator fixes: prevent iOS input zoom and make generated PDFs accessible. */
(function () {
  'use strict';

  var isMobile = window.matchMedia && window.matchMedia('(max-width: 860px)').matches;
  if (!isMobile) return;

  var style = document.createElement('style');
  style.setAttribute('data-vh-mobile-input-nozoom', '');
  style.textContent = [
    '@media (max-width: 860px) {',
    '  input, select, textarea, [contenteditable="true"] {',
    '    font-size: 16px !important;',
    '  }',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var pendingPdfWindow = null;
  var patchedConstructor = null;

  function prepareIOSWindow() {
    if (!isIOS || (pendingPdfWindow && !pendingPdfWindow.closed)) return;

    try {
      pendingPdfWindow = window.open('', '_blank');
      if (pendingPdfWindow) {
        pendingPdfWindow.document.title = 'Готовим PDF';
        pendingPdfWindow.document.body.innerHTML =
          '<p style="font:16px -apple-system,BlinkMacSystemFont,sans-serif;padding:24px">Готовим коммерческое предложение…</p>';
      }
    } catch (error) {
      pendingPdfWindow = null;
    }
  }

  function downloadBlob(blob, filename) {
    var objectUrl = URL.createObjectURL(blob);

    if (isIOS && pendingPdfWindow && !pendingPdfWindow.closed) {
      pendingPdfWindow.location.href = objectUrl;
      pendingPdfWindow = null;
      window.setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 120000);
      return;
    }

    var link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename || 'vystuplenie-muzykanta-vladislav-hekolov.pdf';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 120000);
  }

  function patchJsPdf() {
    var JsPdf = window.jspdf && window.jspdf.jsPDF;
    if (!JsPdf || patchedConstructor === JsPdf || !JsPdf.prototype) return false;

    patchedConstructor = JsPdf;
    JsPdf.prototype.save = function (filename) {
      downloadBlob(this.output('blob'), filename);
      return this;
    };
    return true;
  }

  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      Array.prototype.forEach.call(mutation.addedNodes || [], function (node) {
        if (!node || node.tagName !== 'SCRIPT') return;
        if ((node.src || '').indexOf('jspdf') === -1) return;
        node.addEventListener('load', patchJsPdf, { once: true });
      });
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('#vhCalcPdfDownload');
    if (!button || button.classList.contains('is-disabled')) return;
    prepareIOSWindow();
    patchJsPdf();
  }, true);

  patchJsPdf();
})();
