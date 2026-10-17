import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const errors=[];
const index=read('index.html');
const progress=read('hpx-game-progress.js');
const supplement=read('hpx-page-speech.js');
const allHtml=fs.readdirSync(root).filter(name=>name.endsWith('.html'));

for(const name of allHtml){
  const count=(read(name).match(/src=["']hpx-speech-compat\.js["']/g)||[]).length;
  if(count!==1) errors.push(`${name}: 全站语音兼容提示脚本应加载一次，当前为 ${count} 次`);
}

const pages=new Set(
  [...index.matchAll(/href="([^"]+\.html)"/g)].map(match=>match[1])
    .filter(name=>!name.includes('/')&&!['copyright.html','THIRD_PARTY_NOTICES.html'].includes(name))
);
for(const match of progress.matchAll(/'([^']+)':\{name:/g)) pages.add(`${match[1]}.html`);
for(const name of ['index.html','ability-check.html','achievements.html','daily-camp.html','game-paradise.html','game-progress.html']) pages.add(name);

for(const name of [...pages].sort()){
  const file=path.join(root,name);
  if(!fs.existsSync(file)){errors.push(`${name}: 首页或游戏目录引用的页面不存在`);continue;}
  const html=fs.readFileSync(file,'utf8');
  const direct=html.includes('id="speakToggle"')||html.includes('id="soundToggle"');
  const supplemented=supplement.includes(`'${name}'`)&&(html.includes('feedback.js')||html.includes('hpx-page-speech.js'));
  if(!direct&&!supplemented) errors.push(`${name}: 没有声音开关，也没有登记公共语音补全配置`);
}

for(const asset of ['hpx-page-speech.js','hpx-core.js','hpx-speech-compat.js']){
  try{new vm.Script(read(asset),{filename:asset});}catch(error){errors.push(`${asset}: JavaScript语法错误：${error.message}`);}
}
if(!read('feedback.js').includes("speechScript.src = 'hpx-page-speech.js'")) errors.push('feedback.js: 没有加载旧页面语音补全层');

async function runSupplement(page,{existing=false}={}){
  const byId=new Map(),spoken=[],events=[];
  class FakeElement{
    constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.listeners={};this.textContent='';this.className='';this.disabled=false;this.offsetParent={};}
    set id(value){this._id=value;if(value)byId.set(value,this);}
    get id(){return this._id||'';}
    appendChild(child){this.children.push(child);if(child.id)byId.set(child.id,child);return child;}
    setAttribute(){}
    addEventListener(type,handler){this.listeners[type]=handler;}
    insertAdjacentElement(_where,child){this.appendChild(child);}
    matches(){return false;}
    closest(){return null;}
    querySelectorAll(){return [];}
    classList={add(){},remove(){},toggle(){}};
  }
  const header=new FakeElement('header'),head=new FakeElement('head'),body=new FakeElement('body'),root=new FakeElement('main');
  const document={
    head,body,
    createElement:tag=>new FakeElement(tag),
    getElementById:id=>byId.get(id)||null,
    querySelector(selector){
      if(selector==='.header,header,.hero')return header;
      if(selector==='main,.container')return root;
      return null;
    },
    addEventListener(type){events.push(type);}
  };
  const controller={
    speak(text){spoken.push(String(text));return Promise.resolve();},
    sequence(){return Promise.resolve(true);},stop(){},toggle(){events.push('toggle');}
  };
  const window={Hpx:{speech:{install(){return controller;}}},setTimeout,clearTimeout};
  if(existing){window.toggleSpeak=()=>events.push('existing-toggle');window.speak=()=>Promise.resolve();}
  const context=vm.createContext({window,document,location:{pathname:`/${page}`},MutationObserver:class{observe(){}},Set,Promise,String,Array,Object,Boolean,Math,setTimeout,clearTimeout});
  new vm.Script(supplement,{filename:`${page}#hpx-page-speech`}).runInContext(context);
  await Promise.resolve();
  await Promise.resolve();
  return{byId,spoken,events,header};
}

const legacyRuntime=await runSupplement('game-paradise.html');
if(!legacyRuntime.byId.has('speakToggle')||!legacyRuntime.spoken[0]?.includes('游戏乐园')) errors.push('game-paradise.html: 运行时没有插入声音开关或播放页面欢迎语');
const existingRuntime=await runSupplement('clock.html',{existing:true});
existingRuntime.byId.get('speakToggle')?.listeners.click?.();
if(!existingRuntime.events.includes('existing-toggle')) errors.push('clock.html: 补入的声音开关没有连接页面原有语音控制器');
const mapRuntime=await runSupplement('study-plan.html');
if(!mapRuntime.header.children.some(node=>node.children.some(child=>child.textContent==='▶ 朗读本页'))) errors.push('study-plan.html: 没有生成朗读本页按钮');

if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`语音覆盖检查通过：${pages.size} 个儿童课程、练习、游戏及入口页面有语音控制，${allHtml.length} 个页面均有浏览器升级提示。`);
