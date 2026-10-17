// Huipeixue global speech-synthesis compatibility notice.
(function (global) {
  'use strict';

  var supported = Boolean(
    global.speechSynthesis &&
    typeof global.SpeechSynthesisUtterance !== 'undefined'
  );
  if (supported) return;

  function browserName() {
    var ua = String(global.navigator && global.navigator.userAgent || '');
    if (/EdgA?\//.test(ua) || /EdgiOS\//.test(ua)) return 'Edge';
    if (/CriOS\//.test(ua) || /Chrome\//.test(ua)) return 'Chrome';
    if (/FxiOS\//.test(ua) || /Firefox\//.test(ua)) return 'Firefox';
    if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
    return '';
  }

  function mountNotice() {
    if (!document.body || document.getElementById('hpxSpeechCompatNotice')) return;

    var currentBrowser = browserName();
    var upgradeText = currentBrowser
      ? '请将 ' + currentBrowser + ' 升级到最新版本后重试。'
      : '请升级当前浏览器，或改用最新版 Chrome、Edge、Safari 或 Firefox。';

    var notice = document.createElement('div');
    notice.id = 'hpxSpeechCompatNotice';
    notice.setAttribute('role', 'alert');
    notice.setAttribute('aria-live', 'assertive');
    notice.style.cssText = [
      'position:fixed',
      'top:max(10px,env(safe-area-inset-top))',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:2147483647',
      'width:calc(100% - 24px)',
      'max-width:760px',
      'padding:12px 42px 12px 16px',
      'border:2px solid #ffb74d',
      'border-radius:14px',
      'background:#fff3e0',
      'color:#9a3412',
      'box-shadow:0 6px 24px rgba(120,53,15,.22)',
      'font:700 14px/1.55 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif',
      'text-align:center'
    ].join(';');

    var message = document.createElement('span');
    message.textContent = '⚠️ 当前浏览器不支持语音朗读。' + upgradeText;
    notice.appendChild(message);

    var close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', '关闭语音兼容提示');
    close.textContent = '×';
    close.style.cssText = 'position:absolute;top:5px;right:9px;border:0;background:transparent;color:#9a3412;font:700 24px/1 sans-serif;cursor:pointer;padding:4px 7px';
    close.onclick = function () {
      if (notice.parentNode) notice.parentNode.removeChild(notice);
    };
    notice.appendChild(close);

    document.body.insertBefore(notice, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountNotice, { once: true });
  } else {
    mountNotice();
  }
})(window);
