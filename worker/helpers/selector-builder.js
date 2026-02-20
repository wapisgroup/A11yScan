/**
 * @file build-selector.js
 * @module worker/helpers/build-selector
 *
 * Shared buildSelector utility for generating CSS selectors from DOM elements.
 * Used across ablelytics-core checks — injected once via evaluateOnNewDocument
 * to avoid copy-pasting in every page.evaluate() call.
 */

/**
 * Browser-side buildSelector function source string.
 * Inject into page context via evaluateOnNewDocument or evaluate.
 * Once injected, use `window.__buildSelector(el)` in any evaluate call.
 */
const BUILD_SELECTOR_SOURCE = `
  window.__buildSelector = function(el) {
    if (!el || !el.tagName) return null;
    if (el.id) return '#' + CSS.escape(el.id);
    var parts = [];
    var node = el;
    while (node && node.tagName && parts.length < 4) {
      var part = node.tagName.toLowerCase();
      if (node.classList && node.classList.length > 0) {
        var classes = Array.from(node.classList).slice(0, 2).map(function(c) { return CSS.escape(c); });
        if (classes.length) part += '.' + classes.join('.');
      }
      var parent = node.parentElement;
      if (parent) {
        var siblings = Array.from(parent.children).filter(function(s) { return s.tagName === node.tagName; });
        if (siblings.length > 1) {
          part += ':nth-of-type(' + (siblings.indexOf(node) + 1) + ')';
        }
      }
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.join(' > ');
  };
`;

module.exports = { BUILD_SELECTOR_SOURCE };
