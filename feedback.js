(function () {
  'use strict';

  const css = `
#fb-btn {
  position: fixed;
  bottom: 24px;
  right: 20px;
  z-index: 9999;
  background: linear-gradient(135deg, #ce93d8, #6a1b9a);
  color: #fff;
  border: none;
  border-radius: 24px;
  padding: 10px 18px;
  font-size: .92rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(106,27,154,.38);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: transform .15s, box-shadow .15s;
  font-family: inherit;
}
#fb-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(106,27,154,.45); }
#fb-mask {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 10000;
  justify-content: center;
  align-items: center;
  padding: 20px;
}
#fb-mask.show { display: flex; }
#fb-card {
  background: #fff;
  border-radius: 24px;
  padding: 28px 24px 22px;
  max-width: 360px;
  width: 100%;
  text-align: center;
  box-shadow: 0 12px 48px rgba(0,0,0,.22);
  animation: fbIn .22s ease-out;
  position: relative;
}
@keyframes fbIn { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
#fb-close {
  position: absolute;
  top: 12px; right: 14px;
  border: none; background: none;
  font-size: 1.4rem; cursor: pointer; color: #bbb;
}
#fb-close:hover { color: #888; }`;

  const html = `
<style>${css}</style>
<button id="fb-btn" type="button" aria-haspopup="dialog" aria-controls="fb-mask" aria-expanded="false"
        aria-keyshortcuts="Alt+Y" title="意见反馈（Option+Y）">
  💬 意见反馈
</button>
<div id="fb-mask" role="dialog" aria-modal="true" aria-labelledby="fb-title" hidden>
  <div id="fb-card" tabindex="-1">
    <button id="fb-close" type="button" aria-label="关闭意见反馈">×</button>
    <div id="fb-title" style="font-size:1.4rem;font-weight:bold;color:#4a148c;margin-bottom:6px;">💬 意见反馈</div>
    <div style="font-size:.85rem;color:#888;margin-bottom:18px;">发现问题或有建议？欢迎联系我！</div>
    <div style="display:flex;gap:20px;justify-content:center;align-items:flex-start;flex-wrap:wrap;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
        <img src="jiaduowechat.png" alt="微信公众号二维码"
             style="width:120px;height:120px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.12);">
        <div style="font-size:.78rem;color:#777;">微信公众号</div>
      </div>
      <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;gap:10px;padding-top:12px;">
        <div style="font-size:.82rem;color:#aaa;">或发邮件联系</div>
        <a href="mailto:zhailuxu@163.com"
           style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#ce93d8,#6a1b9a);color:#fff;text-decoration:none;padding:9px 18px;border-radius:18px;font-weight:bold;font-size:.88rem;box-shadow:0 3px 10px rgba(106,27,154,.3);">
          ✉️ 发送邮件
        </a>
      </div>
    </div>
  </div>
</div>`;

  function mountFeedback() {
    if (!document.body || document.getElementById('fb-btn')) return;
    document.body.insertAdjacentHTML('beforeend', html);

    const button = document.getElementById('fb-btn');
    const mask = document.getElementById('fb-mask');
    const card = document.getElementById('fb-card');
    const closeButton = document.getElementById('fb-close');
    let returnFocus = null;

    function openFeedback() {
      returnFocus = document.activeElement;
      mask.hidden = false;
      mask.classList.add('show');
      button.setAttribute('aria-expanded', 'true');
      card.focus();
    }

    function closeFeedback() {
      mask.classList.remove('show');
      mask.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      if (returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus();
    }

    button.addEventListener('click', openFeedback);
    closeButton.addEventListener('click', closeFeedback);
    mask.addEventListener('click', function (event) {
      if (event.target === mask) closeFeedback();
    });
    document.addEventListener('keydown', function (event) {
      const isFeedbackShortcut = event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey &&
        (event.code === 'KeyY' || String(event.key).toLowerCase() === 'y');
      if (isFeedbackShortcut) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (mask.hidden) openFeedback();
        return;
      }
      if (event.key === 'Escape' && !mask.hidden) closeFeedback();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountFeedback, { once: true });
  else mountFeedback();

  // Legacy learning pages without an explicit speech control opt into the
  // page-specific narration map in hpx-page-speech.js.
  if (!document.getElementById('speakToggle') && !document.getElementById('hpxPageSpeechScript')) {
    const speechScript = document.createElement('script');
    speechScript.id = 'hpxPageSpeechScript';
    speechScript.src = 'hpx-page-speech.js';
    document.head.appendChild(speechScript);
  }
})();
