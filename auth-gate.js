// 门禁脚本：放在需要登录/付费才能看的页面最前面（<head> 里，越早越好）
// 逻辑：没登录 -> 跳登录页；登录了但没权限（试用过期且未付费）-> 跳续费页；有权限 -> 放行
(function () {
  var CFG = window.HPX_CONFIG || {};
  // 未引入 hpx-config.js 时的兜底默认值
  var API_BASE = CFG.API_BASE || 'http://localhost:8787';
  var TRIAL_BANNER_TEMPLATE = CFG.TRIAL_BANNER_TEMPLATE || '🎁 试用中，还剩 {days} 天，到期后需付费解锁';
  var TOKEN_KEY = 'huipeixue_token';

  // 先隐藏页面内容，等权限确认通过再显示，避免"正文先闪一下再跳转"
  var style = document.createElement('style');
  style.textContent = 'html:not(.hpx-ready) body{visibility:hidden;}';
  document.head.appendChild(style);

  var here = encodeURIComponent(location.pathname.split('/').pop());
  var token = localStorage.getItem(TOKEN_KEY);

  function goLogin() { location.href = 'login.html?redirect=' + here; }
  function goPaywall() { location.href = 'paywall.html?redirect=' + here; }
  function reveal() { document.documentElement.classList.add('hpx-ready'); }

  function showTrialBanner(daysLeft) {
    var run = function () {
      var bar = document.createElement('div');
      bar.textContent = TRIAL_BANNER_TEMPLATE.replace('{days}', daysLeft);
      bar.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#fff3cd;color:#856404;' +
        'text-align:center;padding:6px 8px;font-size:.85rem;z-index:99999;font-family:inherit;';
      document.body.prepend(bar);
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  }

  if (!token) { goLogin(); return; }

  fetch(API_BASE + '/api/entitlement', {
    headers: { Authorization: 'Bearer ' + token }
  }).then(function (r) {
    if (r.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      goLogin();
      return null;
    }
    return r.json();
  }).then(function (data) {
    if (!data) return;
    if (!data.allowed) { goPaywall(); return; }
    reveal();
    if (data.reason === 'trial') showTrialBanner(data.trialDaysLeft);
  }).catch(function () {
    // 后端暂时连不上：先放行，别把正常使用挡在门外（可按需改成更严格的策略）
    reveal();
  });
})();
