/* Mobile calculator fixes: prevent iOS input zoom and make generated PDFs accessible. */
(function () {
  'use strict';

  var isMobile = window.matchMedia && window.matchMedia('(max-width: 860px)').matches;
  if (!isMobile) return;

  var viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
    );
  }

  var style = document.createElement('style');
  style.setAttribute('data-vh-mobile-input-nozoom', '');
  style.textContent = [
    '@media (max-width: 860px) {',
    '  input, select, textarea, [contenteditable="true"] {',
    '    font-size: 16px !important;',
    '    text-size-adjust: 100% !important;',
    '    -webkit-text-size-adjust: 100% !important;',
    '  }',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var patchedPdfConstructor = null;
  var patchedHtml2Canvas = null;

  function openPdfBlob(blob, filename) {
    var objectUrl = URL.createObjectURL(blob);

    if (isIOS) {
      window.location.assign(objectUrl);
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
    if (!JsPdf || patchedPdfConstructor === JsPdf || !JsPdf.prototype) return false;

    patchedPdfConstructor = JsPdf;
    JsPdf.prototype.save = function (filename) {
      openPdfBlob(this.output('blob'), filename);
      return this;
    };
    return true;
  }

  function patchCanvasRenderer() {
    var original = window.html2canvas;
    if (!original || patchedHtml2Canvas === original) return false;

    patchedHtml2Canvas = original;
    window.html2canvas = function (element, options) {
      var mobileOptions = Object.assign({}, options || {}, {
        scale: Math.min(Number(options && options.scale) || 1, 1.25),
        logging: false
      });
      return original(element, mobileOptions);
    };
    return true;
  }

  function patchPdfLibraries() {
    patchCanvasRenderer();
    patchJsPdf();
  }

  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      Array.prototype.forEach.call(mutation.addedNodes || [], function (node) {
        if (!node || node.tagName !== 'SCRIPT') return;
        var src = node.src || '';
        if (src.indexOf('html2canvas') === -1 && src.indexOf('jspdf') === -1) return;
        node.addEventListener('load', patchPdfLibraries, { once: true });
      });
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('#vhCalcPdfDownload');
    if (!button || button.classList.contains('is-disabled')) return;
    patchPdfLibraries();
  }, true);

  patchPdfLibraries();
})();
