(function () {
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
<button id="fb-btn" onclick="document.getElementById('fb-mask').classList.add('show')">
  💬 意见反馈
</button>
<div id="fb-mask" onclick="if(event.target===this)this.classList.remove('show')">
  <div id="fb-card">
    <button id="fb-close" onclick="document.getElementById('fb-mask').classList.remove('show')">×</button>
    <div style="font-size:1.4rem;font-weight:bold;color:#4a148c;margin-bottom:6px;">💬 意见反馈</div>
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

  document.body.insertAdjacentHTML('beforeend', html);
})();
