// Huipeixue shared footer navigation and voluntary appreciation entry.
(function (global) {
  'use strict';

  var FOOTER_ID = 'hpxFooterActions';
  var STYLE_ID = 'hpxFooterActionsStyle';
  var ARTICLE_URL = 'https://mp.weixin.qq.com/s/RDQF21aA75QpOi_CAHq9Dw';

  function currentFileName() {
    var pathname = String(global.location && global.location.pathname || '').replace(/\/+$/, '');
    return pathname.split('/').pop().toLowerCase();
  }

  function isHomePage() {
    var fileName = currentFileName();
    return !fileName || fileName === 'index.html';
  }

  function isLegacyHomeLink(link) {
    var text = String(link.textContent || '').replace(/\s+/g, '');
    var href = String(link.getAttribute('href') || '').split(/[?#]/)[0];
    var isHomeHref = /^(?:\.\/)?index\.html$/.test(href) || href === '/' || /\/index\.html$/.test(href);
    var isReturnText = /^(?:←|🏠)?返回(?:慧陪学(?:首页)?|首页|主页)$/.test(text);
    return isHomeHref && isReturnText;
  }

  function isNearPageEnd(link) {
    var rect = link.getBoundingClientRect();
    if (!rect.width && !rect.height) return false;
    var viewportHeight = global.innerHeight || document.documentElement.clientHeight || 0;
    var pageHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      viewportHeight
    );
    var linkBottom = rect.bottom + (global.scrollY || global.pageYOffset || 0);
    var endZone = Math.max(360, viewportHeight * 0.6);
    return pageHeight <= viewportHeight + 40 || linkBottom >= pageHeight - endZone;
  }

  function hideReplacedHomeLinks() {
    if (isHomePage()) return;
    document.querySelectorAll('a[href]').forEach(function (link) {
      if (!isLegacyHomeLink(link) || !isNearPageEnd(link) || link.closest('#' + FOOTER_ID)) return;
      link.hidden = true;
      link.setAttribute('data-hpx-footer-replaced', 'true');
    });
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#' + FOOTER_ID + '{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;width:100%;margin:24px auto max(8px,env(safe-area-inset-bottom));padding:0 12px;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}',
      '#' + FOOTER_ID + ' .hpx-footer-action{display:inline-block;padding:8px 14px;border:2px solid #1565c0;border-radius:999px;font-size:13px;line-height:1.25;font-weight:700;text-align:center;text-decoration:none;box-sizing:border-box;transition:transform .12s,box-shadow .12s,background .12s}',
      '#' + FOOTER_ID + ' .hpx-footer-action:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(21,101,192,.18)}',
      '#' + FOOTER_ID + ' .hpx-footer-action:focus-visible{outline:3px solid rgba(21,101,192,.3);outline-offset:3px}',
      '#' + FOOTER_ID + ' .hpx-footer-home{color:#fff;background:#1565c0}',
      '#' + FOOTER_ID + ' .hpx-footer-support{color:#1565c0;background:rgba(255,255,255,.88)}',
      '@media(prefers-reduced-motion:reduce){#' + FOOTER_ID + ' .hpx-footer-action{transition:none}}'
    ].join('');
    (document.head || document.documentElement).appendChild(style);
  }

  function createLink(className, href, text, label) {
    var link = document.createElement('a');
    link.className = 'hpx-footer-action ' + className;
    link.href = href;
    link.textContent = text;
    if (label) link.setAttribute('aria-label', label);
    return link;
  }

  function mountFooterActions() {
    if (!document.body || document.getElementById(FOOTER_ID)) return;

    hideReplacedHomeLinks();
    addStyles();

    var footer = document.createElement('nav');
    footer.id = FOOTER_ID;
    footer.setAttribute('aria-label', '页面底部操作');

    if (!isHomePage()) {
      footer.appendChild(createLink('hpx-footer-home', 'index.html', '← 返回慧陪学'));
    }

    var support = createLink(
      'hpx-footer-support',
      ARTICLE_URL,
      '赞赏作者 ↗',
      '前往微信公众号文章赞赏作者，将在新窗口打开'
    );
    support.target = '_blank';
    support.rel = 'noopener noreferrer';
    footer.appendChild(support);

    document.body.appendChild(footer);
  }

  function loadDailyResultCapture() {
    var params;
    try { params = new URLSearchParams(global.location.search); } catch (error) { return; }
    if (params.get('from') !== 'grade2-daily-math' || document.getElementById('hpxDailyResultCapture')) return;
    var script = document.createElement('script');
    script.id = 'hpxDailyResultCapture';
    script.src = 'hpx-daily-result-capture.js';
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { mountFooterActions(); loadDailyResultCapture(); }, { once: true });
  } else {
    mountFooterActions();
    loadDailyResultCapture();
  }
})(window);
