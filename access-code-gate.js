(function (global) {
  'use strict';
  var script = document.currentScript;
  var page = script && script.dataset.accessPage;
  if (!page) return;
  var apiBase = (global.HPX_CONFIG && global.HPX_CONFIG.ACCESS_CODE_API_BASE) || 'https://www.huipeixue.cn';
  var storageKey = 'hpx_access_token_' + page + '_v1';
  var style = document.createElement('style');
  style.textContent = 'html:not(.hpx-access-ready) body>*{visibility:hidden!important}html:not(.hpx-access-ready) #hpxAccessGate{visibility:visible!important}.hpx-access-gate{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:20px;background:linear-gradient(145deg,#eaf6ff,#fff7e8);font-family:"PingFang SC","Microsoft YaHei",sans-serif}.hpx-access-card{width:min(420px,100%);padding:26px;border:1px solid #d6e5ef;border-radius:20px;background:#fff;color:#213d57;box-shadow:0 18px 42px #21455b2b}.hpx-access-card h1{margin:0 0 8px;font-size:1.45rem}.hpx-access-card p{margin:0;color:#60778b}.hpx-access-card input{width:100%;margin-top:18px;padding:11px 12px;border:1px solid #b9d7e8;border-radius:10px;font:inherit}.hpx-access-card button{width:100%;margin-top:10px;padding:10px;border:0;border-radius:10px;background:#2475a7;color:#fff;font:700 1rem inherit;cursor:pointer}.hpx-access-error{min-height:24px;margin:9px 0 0;color:#b34233;font-size:.9rem}';
  document.head.appendChild(style);

  function reveal() { document.documentElement.classList.add('hpx-access-ready'); var gate = document.getElementById('hpxAccessGate'); if (gate) gate.remove(); }
  function request(path, data) { return fetch(apiBase + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', body: JSON.stringify(data) }).then(async function (response) { var body = await response.json().catch(function () { return {}; }); if (!response.ok) throw new Error(body.error || '验证失败'); return body; }); }
  function validate(token) { return request('/api/access-code/validate', { page: page, token: token }).then(function (body) { return body.valid === true; }).catch(function () { return false; }); }
  function mount() {
    var gate = document.createElement('section');
    gate.id = 'hpxAccessGate'; gate.className = 'hpx-access-gate';
    gate.innerHTML = '<form class="hpx-access-card"><h1>请输入访问码</h1><p>验证通过后，本设备会记住访问资格 7 天。</p><input name="code" type="password" autocomplete="current-password" maxlength="200" placeholder="访问码" aria-label="访问码" required><button type="submit">验证并进入</button><div class="hpx-access-error" role="alert"></div></form>';
    document.body.appendChild(gate);
    var form = gate.querySelector('form'), input = form.elements.code, button = form.querySelector('button'), error = form.querySelector('.hpx-access-error');
    form.addEventListener('submit', function (event) {
      event.preventDefault(); error.textContent = ''; button.disabled = true; button.textContent = '验证中…';
      request('/api/access-code/verify', { page: page, code: input.value }).then(function (body) { localStorage.setItem(storageKey, body.token); input.value = ''; reveal(); }).catch(function (reason) { error.textContent = reason.message || '验证失败，请重试。'; }).finally(function () { button.disabled = false; button.textContent = '验证并进入'; });
    });
    input.focus();
  }
  var cached = localStorage.getItem(storageKey);
  validate(cached).then(function (valid) { if (valid) reveal(); else { localStorage.removeItem(storageKey); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount(); } });
})(window);