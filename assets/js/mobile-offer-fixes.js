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
    '  .vh-benefits, .vh-benefits-section, .vh-benefits-carousel, [data-vh-benefits] {',
    '    margin-top: 24px !important;',
    '  }',
    '  .vh-mobile-pdf-ready {',
    '    position: fixed; inset: 0; z-index: 2147483647;',
    '    display: grid; place-items: center; padding: 20px;',
    '    background: rgba(0,0,0,.72);',
    '  }',
    '  .vh-mobile-pdf-ready__card {',
    '    width: min(100%, 360px); padding: 22px; border-radius: 18px;',
    '    background: #fff; color: #171717; text-align: center;',
    '    box-shadow: 0 20px 60px rgba(0,0,0,.32);',
    '  }',
    '  .vh-mobile-pdf-ready__card strong { display:block; margin-bottom:8px; font-size:18px; }',
    '  .vh-mobile-pdf-ready__card p { margin:0 0 16px; font-size:14px; line-height:1.45; }',
    '  .vh-mobile-pdf-ready__actions { display:grid; gap:10px; }',
    '  .vh-mobile-pdf-ready__actions a, .vh-mobile-pdf-ready__actions button {',
    '    min-height:46px; border:0; border-radius:12px; font:700 16px/1.2 -apple-system,BlinkMacSystemFont,sans-serif;',
    '    display:flex; align-items:center; justify-content:center; text-decoration:none; cursor:pointer;',
    '  }',
    '  .vh-mobile-pdf-ready__open { background:#f68a1f; color:#fff; }',
    '  .vh-mobile-pdf-ready__share { background:#171717; color:#fff; }',
    '  .vh-mobile-pdf-ready__close { background:#ececec; color:#171717; }',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var patchedPdfConstructor = null;
  var patchedHtml2Canvas = null;

  function showIOSPdfReady(blob, filename) {
    var objectUrl = URL.createObjectURL(blob);
    var safeName = filename || 'vystuplenie-muzykanta-vladislav-hekolov.pdf';
    var oldModal = document.querySelector('.vh-mobile-pdf-ready');
    if (oldModal) oldModal.remove();

    var modal = document.createElement('div');
    modal.className = 'vh-mobile-pdf-ready';
    modal.innerHTML =
      '<div class="vh-mobile-pdf-ready__card" role="dialog" aria-modal="true" aria-label="PDF готов">' +
        '<strong>Коммерческое предложение готово</strong>' +
        '<p>Нажмите кнопку ниже, чтобы открыть PDF и сохранить его через меню «Поделиться».</p>' +
        '<div class="vh-mobile-pdf-ready__actions">' +
          '<a class="vh-mobile-pdf-ready__open" href="' + objectUrl + '" target="_blank" rel="noopener">Открыть PDF</a>' +
          '<button class="vh-mobile-pdf-ready__share" type="button">Сохранить / поделиться</button>' +
          '<button class="vh-mobile-pdf-ready__close" type="button">Закрыть</button>' +
        '</div>' +
      '</div>';

    modal.querySelector('.vh-mobile-pdf-ready__share').addEventListener('click', function () {
      var file = new File([blob], safeName, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        navigator.share({ files: [file], title: 'Коммерческое предложение' }).catch(function () {});
      } else {
        modal.querySelector('.vh-mobile-pdf-ready__open').click();
      }
    });

    modal.querySelector('.vh-mobile-pdf-ready__close').addEventListener('click', function () {
      modal.remove();
      window.setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 1000);
    });

    document.body.appendChild(modal);
  }

  function openPdfBlob(blob, filename) {
    if (isIOS) {
      showIOSPdfReady(blob, filename);
      return;
    }

    var objectUrl = URL.createObjectURL(blob);
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
        scale: Math.min(Number(options && options.scale) || 1, 1.15),
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

  document.addEventListener('change', function (event) {
    var field = event.target;
    if (!field || field.tagName !== 'INPUT' || field.type !== 'date') return;
    window.setTimeout(function () { field.blur(); }, 0);
  }, true);

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
