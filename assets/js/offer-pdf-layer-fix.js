/* Stable PDF-only layers for the commercial offer. */
(function initOfferPdfLayerFix() {
  'use strict';

  if (!document.body || document.body.id !== 'top') return;

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function injectStyles() {
    if (document.querySelector('style[data-vh-offer-pdf-layer-fix]')) return;

    var style = document.createElement('style');
    style.setAttribute('data-vh-offer-pdf-layer-fix', '');
    style.textContent = [
      'body #vhPdfStage {',
      '  width: 794px !important;',
      '  min-width: 794px !important;',
      '  max-width: 794px !important;',
      '  overflow: hidden !important;',
      '  background: #fbf7f1 !important;',
      '  border: 0 !important;',
      '  outline: 0 !important;',
      '  box-shadow: none !important;',
      '}',
      'body #vhPdfStage .vh-offer-page {',
      '  width: 794px !important;',
      '  min-width: 794px !important;',
      '  max-width: 794px !important;',
      '  box-sizing: border-box !important;',
      '  overflow: hidden !important;',
      '  background: #fbf7f1 !important;',
      '  border-right: 0 !important;',
      '  outline: 0 !important;',
      '  box-shadow: none !important;',
      '}',
      'body #vhPdfStage .vh-offer-equipment-trial-icon {',
      '  position: relative !important;',
      '  overflow: hidden !important;',
      '}',
      'body #vhPdfStage .vh-offer-equipment-trial-icon::before,',
      'body #vhPdfStage .vh-offer-equipment-trial-icon::after {',
      '  content: none !important;',
      '  display: none !important;',
      '}',
      'body #vhPdfStage .vh-offer-equipment-trial-icon > * {',
      '  display: none !important;',
      '}',
      'body #vhPdfStage .vh-offer-equipment-trial-icon > svg[data-vh-offer-microphone] {',
      '  display: block !important;',
      '  width: 16px !important;',
      '  height: 16px !important;',
      '  flex: 0 0 16px !important;',
      '  fill: none !important;',
      '  stroke: currentColor !important;',
      '  stroke-width: 2 !important;',
      '  stroke-linecap: round !important;',
      '  stroke-linejoin: round !important;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function createMicrophoneIcon() {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('data-vh-offer-microphone', 'true');

    var capsule = document.createElementNS(SVG_NS, 'path');
    capsule.setAttribute('d', 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z');

    var receiver = document.createElementNS(SVG_NS, 'path');
    receiver.setAttribute('d', 'M19 10v2a7 7 0 0 1-14 0v-2');

    var stem = document.createElementNS(SVG_NS, 'path');
    stem.setAttribute('d', 'M12 19v3');

    svg.appendChild(capsule);
    svg.appendChild(receiver);
    svg.appendChild(stem);
    return svg;
  }

  function normalizeEquipmentIcons(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    root.querySelectorAll('.vh-offer-equipment-trial-icon').forEach(function (container) {
      var current = container.querySelector('svg[data-vh-offer-microphone="true"]');
      if (current && container.childElementCount === 1) return;

      while (container.firstChild) container.removeChild(container.firstChild);
      container.appendChild(createMicrophoneIcon());
      container.setAttribute('data-vh-equipment-icon-ready', 'true');
    });
  }

  injectStyles();
  normalizeEquipmentIcons(document);

  var scheduled = false;
  var observer = new MutationObserver(function (mutations) {
    var relevant = mutations.some(function (mutation) {
      return Array.prototype.some.call(mutation.addedNodes || [], function (node) {
        return node && node.nodeType === 1;
      });
    });

    if (!relevant || scheduled) return;
    scheduled = true;
    Promise.resolve().then(function () {
      scheduled = false;
      normalizeEquipmentIcons(document);
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
