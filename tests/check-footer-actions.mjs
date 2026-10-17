import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlFiles = fs.readdirSync(root).filter(name => name.endsWith('.html')).sort();
const component = fs.readFileSync(path.join(root, 'hpx-footer-actions.js'), 'utf8');

assert.ok(htmlFiles.length > 0, '没有找到 HTML 页面');
for (const name of htmlFiles) {
  const html = fs.readFileSync(path.join(root, name), 'utf8');
  const count = (html.match(/<script src="hpx-footer-actions\.js"><\/script>/g) || []).length;
  assert.equal(count, 1, `${name} 应且仅应加载一次公共页脚组件`);
}

assert.ok(component.includes("fileName === 'index.html'"), '组件没有识别首页');
assert.ok(component.includes("'← 返回慧陪学'"), '组件缺少返回首页入口');
assert.ok(component.includes("'赞赏作者 ↗'"), '组件缺少赞赏入口');
assert.ok(component.includes('noopener noreferrer'), '外部链接缺少安全 rel');
assert.ok(component.includes('data-hpx-footer-replaced'), '组件没有处理旧返回链接');
assert.ok(component.includes('isNearPageEnd'), '组件不应隐藏长页面顶部的返回导航');

console.log(`公共页脚组件检查通过：${htmlFiles.length} 个页面均已接入。`);
