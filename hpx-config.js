// 慧陪学 前端统一配置：所有页面（登录/续费/门禁脚本）共用这一份
// 想改后端地址、试用横幅文案，改这里就行，不用碰各页面里的逻辑代码
window.HPX_CONFIG = {
  // 本地调试用 localhost:8787，部署到正式域名后把这里改成你的后端地址
  API_BASE: 'http://localhost:8787',
  // 试用期横幅文案，{days} 会被替换成剩余天数
  TRIAL_BANNER_TEMPLATE: '🎁 试用中，还剩 {days} 天，到期后需付费解锁',
};
