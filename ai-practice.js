/* ══════════════════════════════════════════
   AI 出题 / AI 解析 —— 共享逻辑
   由 olympiad1.html / olympiad2.html / olympiad3.html 共同引用。

   使用方法：在引入本文件之前，先在页面里设置：
     window.EXAM_GRADE = '一年级';   // 或 '二年级' / '三年级'
   本文件依赖宿主页面已定义的全局变量/函数：
     currentExam （数组，当前试卷/错题练习的题目列表，每项含 qnum/section/data）
   任何这三份文件都需要的 AI 相关行为改动，只改这一处即可。

   要求：Ollama 需在同一台设备上运行，且已设置
   OLLAMA_HOST=0.0.0.0 / OLLAMA_ORIGINS=* 允许跨域访问，
   否则浏览器会因 CORS 被拒绝。

   采用 Ollama Structured Outputs（format: JSON Schema）
   强制模型按固定结构输出，替代"自由文本 + 正则表达式解析"，
   从根本上避免格式不稳定导致解析失败的问题。
   参考：https://docs.ollama.com/capabilities/structured-outputs
══════════════════════════════════════════ */
const OLLAMA_URL='http://localhost:11434/api/generate';
const OLLAMA_MODEL='qwen2.5:14b';
const EXAM_GRADE=window.EXAM_GRADE||'小学';

function findExamItem(qnum){
  return currentExam.find(it=>it.qnum===qnum);
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ══════════════════════════════════════════
   AI 相似题生成（"错题练习"里每道题右侧的"🤖 出一道类似的题"）
══════════════════════════════════════════ */

// ─── 输出契约：AI 出题必须返回的 JSON 结构 ───
// 与 buildSimilarPrompt() 的文字要求分离，方便单独维护
const SIMILAR_QUESTION_SCHEMA={
  type:'object',
  properties:{
    question:{type:'string', description:'新题目的题干（含具体数字/情境，不含答案）'},
    answer:  {type:'string', description:'该题的正确答案，尽量只写数字或最简短的结论'},
    hint:    {type:'string', description:'1-2句简短的解题思路'},
  },
  required:['question','answer','hint'],
};

function buildSimilarPrompt(item){
  const {section,data}=item;
  return `你是一名小学${EXAM_GRADE}数学老师。下面是一道学生做错的"${section}"题目：
原题：${data.qtext}
正确答案：${data.displayAns}

请你出一道【题型和难度都非常相似】的新题目，帮助这名${EXAM_GRADE}学生针对性巩固练习。
要求：
1. 只出 1 道题，数字和情境可以换，但考查的知识点和解题方法要和原题一致；
2. 题目难度要适合${EXAM_GRADE}小学生，语言简洁易懂；
3. 答案尽量简短（只写数字或最简结论，比如"15"或"15个"）；
4. 解题思路只需 1-2 句话。`;
}

// 缓存每道 AI 生成题的解析结果（答案/思路），供作答校验使用
const _aiCache={};

async function genSimilar(qnum){
  const item=findExamItem(qnum);
  const panel=document.getElementById(`aip-${qnum}`);
  const btn=document.getElementById(`aib-${qnum}`);
  if(!item||!panel) return;

  btn.disabled=true;
  panel.classList.add('show');
  panel.innerHTML=`<span class="ai-tag">🤖 AI 出题</span><div class="ai-loading">正在生成类似题目，请稍候…</div>`;

  const prompt=buildSimilarPrompt(item);

  try{
    const resp=await fetch(OLLAMA_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:OLLAMA_MODEL,
        prompt,
        stream:false,
        format:SIMILAR_QUESTION_SCHEMA, // 强制按 schema 输出，模型只能吐合法 JSON
      })
    });
    if(!resp.ok) throw new Error('HTTP '+resp.status);
    const data=await resp.json();
    const raw=(data.response||'').trim();
    if(!raw) throw new Error('空响应');
    let parsed;
    try{ parsed=JSON.parse(raw); }
    catch(e){ throw new Error('返回内容不是合法 JSON'); }
    if(!parsed.question||!parsed.answer) throw new Error('返回内容缺少题目或答案字段');
    renderAiResult(qnum,parsed);
  }catch(err){
    panel.innerHTML=`<span class="ai-tag">🤖 AI 出题</span>
      <div class="ai-err">生成失败：无法连接本地 Ollama（${escapeHtml(err.message)}）。<br>
      请确认：① 本机已安装并启动 Ollama；② 已执行 <code>ollama pull ${OLLAMA_MODEL}</code>；
      ③ 若本页面不是从本机打开，需设置 <code>OLLAMA_ORIGINS=*</code> 允许跨域访问。</div>
      <button class="ai-retry" onclick="genSimilar(${qnum})">🔄 重试</button>`;
  }finally{
    btn.disabled=false;
  }
}

function renderAiResult(qnum,parsed){
  const panel=document.getElementById(`aip-${qnum}`);
  if(!panel) return;
  // 有了 JSON Schema 强约束，这里不再需要正则表达式猜格式，
  // parsed.question / parsed.answer / parsed.hint 直接可用
  const qStr=String(parsed.question||'').trim();
  const ansStr=String(parsed.answer||'').trim();
  const stepStr=String(parsed.hint||'').trim();
  _aiCache[qnum]={ans:ansStr,step:stepStr};

  const body=`<div><b>📝 题目：</b>${escapeHtml(qStr)}</div>
    <div class="ai-try-row">
      <input class="ai-try-input" id="ait-${qnum}" placeholder="填答案" autocomplete="off"
        onkeydown="if(event.key==='Enter')checkAiAnswer(${qnum})">
      <button class="ai-check-btn" onclick="checkAiAnswer(${qnum})">✅ 提交</button>
    </div>
    <div class="ai-fb" id="aifb-${qnum}"></div>
    <button class="ai-reveal" onclick="toggleAiAnswer(${qnum},this)">👀 我不会，直接看答案</button>
    <div class="ai-answer" id="aia-${qnum}">
      <div><b>✅ 答案：</b>${escapeHtml(ansStr)}</div>
      ${stepStr?`<div style="margin-top:4px;color:#5e35b1"><b>💡 思路：</b>${escapeHtml(stepStr)}</div>`:''}
    </div>`;
  panel.innerHTML=`<span class="ai-tag">🤖 AI 出的类似题</span>${body}
    <button class="ai-retry" onclick="genSimilar(${qnum})">🔄 再来一题</button>`;
}

// 宽松比较：去空格、去常见单位词、全角转半角数字后再比较
function normalizeAns(s){
  return String(s).trim()
    .replace(/[，,。.！!？?\s]/g,'')
    .replace(/(个|颗|只|条|张|块|元|岁|名|种|格|节|米|厘米|分|段|棵|次)$/g,'');
}

function checkAiAnswer(qnum){
  const cache=_aiCache[qnum];
  const inp=document.getElementById(`ait-${qnum}`);
  const fb=document.getElementById(`aifb-${qnum}`);
  if(!cache||!inp||!fb) return;
  const userVal=inp.value.trim();
  if(!userVal){ fb.className='ai-fb'; fb.textContent='请先填写答案哦～'; return; }
  const ok=normalizeAns(userVal)===normalizeAns(cache.ans);
  if(ok){
    fb.className='ai-fb ok'; fb.textContent='✅ 答对了，真棒！';
    inp.disabled=true;
  } else {
    fb.className='ai-fb no'; fb.textContent='❌ 再想想，或点下面查看答案';
  }
}

function toggleAiAnswer(qnum,btn){
  const el=document.getElementById(`aia-${qnum}`);
  if(!el) return;
  const willShow=!el.classList.contains('show');
  el.classList.toggle('show',willShow);
  btn.textContent=willShow?'🙈 隐藏答案':'👀 我不会，直接看答案';
}

/* ══════════════════════════════════════════
   AI 答案解析（"答案解析"弹窗里每道题的"🤖 AI 解析"）
   与上面 genSimilar() 的区别：
   genSimilar()      → 出一道全新的相似题
   genSolAnalysis()  → 针对已有题目+已有答案，生成更详细的讲解说明
   两者共用同一个 OLLAMA_URL / OLLAMA_MODEL，走各自独立的 schema 和 prompt。
══════════════════════════════════════════ */
// 输出改成"结构化步骤数组"，而不是一大段自由文本——
// 每一步都很短，配一个emoji，前端按编号小卡片（步骤1/2/3/4）逐条展示，
// 小朋友一眼就能看清"第几步做什么"，不用啃大段文字。
//
// 字数上一开始压得太狠（14字/16字）导致内容被硬截断到看不懂，
// 现在放宽到"能说清一件事"的长度，同时保留编号步骤卡片这个展示形式。
//
// 精简策略（三道防线，不完全依赖模型自觉）：
// 1. schema 里用 maxLength 限制字符数上限（防止跑飞，但不会切成碎片）
// 2. prompt 里给出"好例子/坏例子"对比，示范"简短但说清楚"是什么样
// 3. 前端 renderSolAnalysis() 兜底截断，模型不听话时也不会整段文字糊出来
const SOL_STEP_MAXLEN=26;   // 每步正文最多多少字（含标点）——够写清楚一个小动作+结果
const SOL_IDEA_MAXLEN=22;   // bigIdea 最多多少字
const SOL_MAX_STEPS=4;      // 最多几步

const SOL_ANALYSIS_SCHEMA={
  type:'object',
  properties:{
    bigIdea:{type:'string', maxLength:SOL_IDEA_MAXLEN,
      description:`一句话点出核心思路，最多${SOL_IDEA_MAXLEN}个字，要能让人看懂`},
    steps:{
      type:'array',
      minItems:2, maxItems:SOL_MAX_STEPS,
      description:`2到${SOL_MAX_STEPS}个解题步骤，编号展示（步骤1/2/3/4），每步讲清楚一个动作`,
      items:{
        type:'object',
        properties:{
          emoji:{type:'string', maxLength:2, description:'一个emoji表情，比如🔢👀➕✅'},
          text:{type:'string', maxLength:SOL_STEP_MAXLEN,
            description:`这一步做什么、算出了什么，最多${SOL_STEP_MAXLEN}个字，要写清楚不能太简略`},
        },
        required:['emoji','text'],
      },
    },
  },
  required:['bigIdea','steps'],
};

function buildSolAnalysisPrompt(item){
  const {section,data}=item;
  const stepsText=(data.steps||[]).map((s,i)=>`${i+1}. ${s}`).join('\n');
  return `你是一名耐心的小学数学老师，正在给${EXAM_GRADE}学生讲解一道"${section}"题目。
题目：${data.qtext}
正确答案：${data.displayAns}
参考解题要点（供你理解题意，不用照抄）：
${stepsText||'（无）'}

请把解题过程拆成"步骤1、步骤2、步骤3…"这样编号的小卡片。
**默认按下面这个固定三步走的模板来写**（大多数题目都适用这个逻辑顺序）：
- 步骤1【理解题意】：说清楚题目在问什么、要用哪种运算（加/减/乘/除），emoji用🤔
- 步骤2【列式计算】：写出具体的算式和结果，比如"42-8=34"，emoji用✏️或🔢
- 步骤3【得出答案】：说出最终答案，emoji用✅
如果题目本身需要更多步骤（比如要先算出中间量、或者要分两次运算），可以在"列式计算"这一步前后插入1-2个额外步骤，但整体仍然遵循"先理解题意，再计算，最后给答案"的顺序，最多不超过${SOL_MAX_STEPS}步。

字数要求（重要，但优先保证意思讲清楚，不要为了短而写得看不懂）：
- bigIdea：最多${SOL_IDEA_MAXLEN}个字，说清楚这道题的核心思路
- 每个 step 的 text：最多${SOL_STEP_MAXLEN}个字，要包含"做什么+算出多少"，不能只写一个数字
- 总共 2-${SOL_MAX_STEPS} 步

参考例子1（题目是"比42少8的数是___"，单一运算，标准三步模板）：
  bigIdea："比42少8，用减法"
  步骤1：emoji=🤔 text="题意是42减去8，是减法"
  步骤2：emoji=✏️ text="列式计算：42-8=34"
  步骤3：emoji=✅ text="所以答案是34"

参考例子2（题目是"树上8只鸟，飞走3只，又飞来2只，还剩几只"，需要两次运算，在标准三步基础上多插1步）：
  bigIdea："先减去飞走的，再加上飞来的"
  步骤1：emoji=🤔 text="先减飞走的，再加飞来的，两次运算"
  步骤2：emoji=➖ text="8只减去飞走的3只，8-3=5只"
  步骤3：emoji=➕ text="再加上飞来的2只，5+2=7只"
  步骤4：emoji=✅ text="所以现在一共有7只小鸟"

❌ 不好的例子1（太长，写成了一段话）：
  "先数一数树上原来有多少只小鸟，然后减去飞走的数量，最后再加上飞回来的数量就是答案"
❌ 不好的例子2（太简略，看不懂在说什么）：
  "8" / "-3" / "+2"

直接输出内容，不要说"好的""下面是"这类客套话。`;
}

async function genSolAnalysis(qnum){
  const item=findExamItem(qnum);
  const box=document.getElementById(`solaib-box-${qnum}`);
  const btn=document.getElementById(`solaib-${qnum}`);
  if(!item||!box) return;

  btn.disabled=true;
  box.classList.add('show');
  box.innerHTML=`<span class="sol-ai-tag">🤖 AI 解析</span><div class="sol-ai-loading">正在生成详细讲解，请稍候…</div>`;

  const prompt=buildSolAnalysisPrompt(item);

  try{
    const resp=await fetch(OLLAMA_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:OLLAMA_MODEL,
        prompt,
        stream:false,
        format:SOL_ANALYSIS_SCHEMA,
      })
    });
    if(!resp.ok) throw new Error('HTTP '+resp.status);
    const data=await resp.json();
    const raw=(data.response||'').trim();
    if(!raw) throw new Error('空响应');
    let parsed;
    try{ parsed=JSON.parse(raw); }
    catch(e){ throw new Error('返回内容不是合法 JSON'); }
    if(!parsed.bigIdea||!Array.isArray(parsed.steps)||!parsed.steps.length) throw new Error('返回内容缺少讲解字段');
    renderSolAnalysis(box,parsed);
  }catch(err){
    box.innerHTML=`<span class="sol-ai-tag">🤖 AI 解析</span>
      <div class="sol-ai-err">生成失败：无法连接本地 Ollama（${escapeHtml(err.message)}）。<br>
      请确认：① 本机已安装并启动 Ollama；② 已执行 <code>ollama pull ${OLLAMA_MODEL}</code>；
      ③ 若本页面不是从本机打开，需设置 <code>OLLAMA_ORIGINS=*</code> 允许跨域访问。</div>
      <button class="sol-ai-retry" onclick="genSolAnalysis(${qnum})">🔄 重试</button>`;
  }finally{
    btn.disabled=false;
  }
}

// 兜底截断：不管模型是否听话遵守字数要求，前端都强制截断，
// 保证界面上永远不会出现一大段文字。
function clampText(s,maxLen){
  s=String(s||'').trim();
  return s.length>maxLen ? s.slice(0,maxLen)+'…' : s;
}

// 把结构化的 bigIdea + steps 渲染成"小卡片"，而不是一大段文字
function renderSolAnalysis(box,parsed){
  const bigIdea=clampText(parsed.bigIdea, SOL_IDEA_MAXLEN); // 严格按 schema 限定的字数截断，不留余量
  const steps=(parsed.steps||[])
    .slice(0,SOL_MAX_STEPS) // 即使模型多给了几步，也只展示前 SOL_MAX_STEPS 步
    .map(s=>({
      emoji:String(s&&s.emoji||'✏️').trim().slice(0,2),
      text:clampText(s&&s.text, SOL_STEP_MAXLEN),
    }))
    .filter(s=>s.text);

  const stepsHtml=steps.map((s,i)=>`
    <div class="sol-ai-step">
      <span class="sol-ai-step-n">步骤${i+1}</span>
      <span class="sol-ai-step-emoji">${escapeHtml(s.emoji)}</span>
      <span class="sol-ai-step-text">${escapeHtml(s.text)}</span>
    </div>`).join('');

  box.innerHTML=`<span class="sol-ai-tag">🤖 AI 详细讲解</span>
    ${bigIdea?`<div class="sol-ai-bigidea">💡 ${escapeHtml(bigIdea)}</div>`:''}
    <div class="sol-ai-steps">${stepsHtml}</div>`;
}
