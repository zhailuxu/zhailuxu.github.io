import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(new URL('../index.html',import.meta.url)));
const notices=fs.readFileSync(path.join(root,'THIRD_PARTY_NOTICES.html'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const copyright=fs.readFileSync(path.join(root,'copyright.html'),'utf8');

assert.ok(notices.includes('<!DOCTYPE html>')&&notices.includes('<html lang="zh-CN">'),'第三方授权说明不是完整 HTML 页面');
assert.ok(index.includes('href="THIRD_PARTY_NOTICES.html"'),'首页没有链接到 HTML 授权说明');
assert.ok(copyright.includes('href="THIRD_PARTY_NOTICES.html"'),'版权页没有链接到 HTML 授权说明');

const localLinks=[...notices.matchAll(/href="([^"]+)"/g)]
  .map(match=>match[1])
  .filter(href=>!href.startsWith('http')&&!href.startsWith('#')&&!href.startsWith('mailto:'));
for(const href of localLinks){
  assert.ok(fs.existsSync(path.join(root,href)),`第三方授权说明中的本地链接不存在：${href}`);
}

for(const license of [
  'JetBrains-Mono-OFL-1.1.txt','Special-Elite-Apache-2.0.txt',
  'Hanzi-Writer-MIT.txt','Hanzi-Writer-Data-Arphic.txt',
  'server/bcryptjs-BSD-3-Clause.txt','server/better-sqlite3-MIT.txt',
  'server/cors-MIT.txt','server/dotenv-BSD-2-Clause.txt',
  'server/express-MIT.txt','server/jsonwebtoken-MIT.txt'
]){
  assert.ok(notices.includes(`licenses/${license}`),`HTML 页面缺少许可证入口：${license}`);
}

console.log(`第三方授权 HTML 检查通过：${localLinks.length} 个本地链接均有效，首页与版权页入口已更新。`);
