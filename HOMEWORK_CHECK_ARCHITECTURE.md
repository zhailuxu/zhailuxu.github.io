# 作业拍照检查（homework_check.html）实现文档

## 一、这是什么

一个单文件 HTML 页面，拍照或上传一张小学作业照片，调用本机部署的 Ollama 视觉大模型自动识别每一道题、判断对错，错题可以进一步让 AI 给出分步讲解。全部计算在本地完成，不依赖任何云端 API。

核心能力：
1. 拍照 / 上传作业照片
2. 调用本地视觉大模型识别图片里的每一道题目
3. 模型自己重新计算答案来校对学生写的对不对（不是简单比对文字）
4. 结果用两种视图展示：文字列表 / 在原图上打勾叉的标注图
5. 错题点击可展开 AI 分步讲解，数学加减法题额外配一张代码精确计算的竖式图

---

## 二、整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           浏览器（homework_check.html）                │
│                                                                       │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐  │
│  │  拍照/上传    │ ──▶ │  图片压缩     │ ──▶ │ currentImageBase64   │  │
│  │ getUserMedia │     │ hwDownscale  │     │ (长边≤1280px的base64) │  │
│  │ / file input │     │ Image()      │     └──────────┬───────────┘  │
│  └──────────────┘     └──────────────┘                │              │
│                                                         ▼              │
│                                          ┌───────────────────────┐   │
│                                          │   analyzeHomework()   │   │
│                                          └───────────┬───────────┘   │
│                                                       │               │
│              ①先发：列表请求(无bbox，主路径)           │               │
│                      ▼                                │               │
│         hwCallVisionWithRetry(false) ────────┐        │               │
│                      │                        │        │              │
│                      ▼                        │        │              │
│  ┌───────────────────────────────────┐        │        │              │
│  │ 本地 Ollama (localhost:11434)      │◀───────┘        │              │
│  │ /api/generate                      │                 │              │
│  │ model: qwen2.5vl:7b (视觉模型)      │                 │              │
│  │ images: [base64]                   │                 │              │
│  │ format: HW_CHECK_SCHEMA_LIST/ANNO   │                 │              │
│  └───────────────┬─────────────────────┘                 │              │
│                   │ JSON: {items:[{question,studentAnswer,  │              │
│                   │        correctAnswer,isCorrect,(bbox)}]}│              │
│                   ▼                                        │              │
│         hwParseJsonLoose() 宽松解析                          │              │
│                   │                                        │              │
│                   ▼                                        │              │
│           renderResults()  ──▶ 📋 列表视图展示               │              │
│                                                              │              │
│              ②列表展示完成后再发：标注图请求(带bbox)            │              │
│                      ▼                                      │              │
│         hwCallVisionWithRetry(true) ─────────────────────────┘              │
│                      │                                                      │
│                      ▼                                                      │
│           annoItems (含bbox) ──▶ renderAnnotatedView()                       │
│                                       │                                     │
│                                       ▼                                     │
│                          Canvas: 画原图 + 按bbox画✓/✗标记                     │
│                                       │                                     │
│                                       ▼ 点击错题标记                          │
│                                genAnnoAnalysis(idx)                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │            错题 AI 详细解析（列表视图 / 标注图视图共用一套逻辑）           │  │
│  │                                                                       │  │
│  │  genHwAnalysis(i) / genAnnoAnalysis(idx)                             │  │
│  │              │                                                       │  │
│  │              ▼                                                       │  │
│  │  hwBuildVerticalBlock(question) ──▶ 纯代码计算竖式(不调用AI)            │  │
│  │              │                       hwParseArithmetic()             │  │
│  │              │                       hwComputeAdd()/hwComputeSub()   │  │
│  │              ▼                                                       │  │
│  │  hwRunAnalysis(it, box, btn) ──▶ 调用文本模型(qwen2.5:14b)             │  │
│  │              │                    format: HW_ANALYSIS_SCHEMA         │  │
│  │              ▼                    "理解题意→列式计算→得出答案"三步走     │  │
│  │  渲染: 竖式图 + 步骤1/2/3/4 卡片                                        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   本地 Ollama 服务 (常驻进程)     │
              │   OLLAMA_NUM_PARALLEL=2         │
              │   ┌─────────────────────────┐  │
              │   │ qwen2.5vl:7b (视觉模型)   │  │  ← 负责"看图识别+判断对错+给bbox"
              │   │ 6GB, Q4_K_M量化          │  │
              │   └─────────────────────────┘  │
              │   ┌─────────────────────────┐  │
              │   │ qwen2.5:14b (文本模型)    │  │  ← 负责"错题分步讲解"，不需要读图
              │   └─────────────────────────┘  │
              └───────────────────────────────┘
```

---

## 三、分步骤详细实现

### 1. 拍照 / 上传：怎么拿到图片

两条入口，最终都汇聚到同一个 `showPreview(dataUrl)` 函数：

- **拍照**：`navigator.mediaDevices.getUserMedia()` 打开摄像头实时预览 → 点击拍照按钮 → 把 `<video>` 当前帧画到一个临时 `<canvas>` 上 → `canvas.toDataURL('image/jpeg', 0.9)` 得到 dataURL
- **上传**：`<input type="file" accept="image/*" capture="environment">` → `FileReader.readAsDataURL(file)` 得到 dataURL

> `getUserMedia` 在很多浏览器要求页面通过 `https://` 或 `localhost` 打开，直接双击本地文件（`file://`）会被拒绝，页面里做了错误提示并引导改用"上传照片"。

**关键点：图片压缩（`hwDownscaleImage`）**

手机原图动辄 3000×4000px、好几 MB，直接丢给本地视觉模型处理耗时极长（这是"一直转圈不出结果"的主要原因之一，不是卡死）。所以 `showPreview()` 会先调用 `hwDownscaleImage()`：

```js
const HW_MAX_DIM = 1280; // 长边上限

function hwDownscaleImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, HW_MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(dataUrl); // 压缩失败就退回原图
    img.src = dataUrl;
  });
}
```

- 长边超过 1280px 的图会被等比缩小到 1280px；已经小于 1280px 的图保持原样，绝不放大
- 压缩后的图同时用于「预览显示」和「发给模型识别」，保证用户看到的和模型看到的是同一张
- 最终存入 `currentImageBase64`（去掉 `data:image/jpeg;base64,` 前缀的纯 base64 字符串），这是后续所有 API 调用的输入

---

### 2. 调用大模型：怎么发请求

**模型分工（两个模型各司其职）**

| 模型 | 用途 | 是否需要看图 |
|---|---|---|
| `qwen2.5vl:7b` | 识别题目、判断对错、给出坐标框 | 需要（视觉模型） |
| `qwen2.5:14b` | 给错题写分步讲解 | 不需要（纯文本模型即可） |

**请求格式（Ollama `/api/generate` 接口）**

```js
fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'qwen2.5vl:7b',
    prompt: '...(见下文)',
    images: [currentImageBase64],   // 纯base64数组，不带data:前缀
    stream: false,                  // 一次性返回完整结果，不用处理流式拼接
    format: HW_CHECK_SCHEMA_LIST,   // JSON Schema，强制模型按固定结构输出
  })
})
```

**Structured Outputs（JSON Schema）—— 保证输出格式稳定的关键**

不依赖"模型自觉遵守格式说明"，而是用 Ollama 的 `format` 参数传入 JSON Schema，从解码层面强制模型只能输出符合结构的内容：

```js
const HW_ITEM_BASE_PROPS = {
  question:      { type: 'string', description: '题目内容（尽量还原原文，包含数字和运算符）' },
  studentAnswer: { type: 'string', description: '学生在作业上写的答案，如果看不清写"看不清"' },
  correctAnswer: { type: 'string', description: '这道题真正正确的答案' },
  isCorrect:     { type: 'boolean', description: '学生的答案是否正确' },
};

// 列表视图用：schema更简单，作为主路径
const HW_CHECK_SCHEMA_LIST = {
  type: 'object',
  properties: { items: { type: 'array', items: { type: 'object',
    properties: HW_ITEM_BASE_PROPS,
    required: ['question','studentAnswer','correctAnswer','isCorrect'] } } },
  required: ['items'],
};

// 标注图视图用：多了bbox坐标字段
const HW_CHECK_SCHEMA_ANNO = {
  type: 'object',
  properties: { items: { type: 'array', items: { type: 'object',
    properties: { ...HW_ITEM_BASE_PROPS,
      bbox: { type: 'array', items: { type: 'integer' }, minItems: 4, maxItems: 4,
        description: '[x1,y1,x2,y2]，0-1000归一化坐标' } },
    required: ['question','studentAnswer','correctAnswer','isCorrect','bbox'] } } },
  required: ['items'],
};
```

**Prompt 设计（怎么让模型"自己校对"而不是抄学生答案）**

```js
function buildHwCheckPrompt(withBbox) {
  return `你是一名小学老师，正在批改学生拍照上传的一份数学/语文作业照片。
请你仔细看图，找出图片里的每一道题目，对每一道题：
1. question：识别出题目本身的内容
2. studentAnswer：识别学生手写的答案是什么（看不清写"看不清"）
3. correctAnswer：你自己算出/判断出的正确答案
4. isCorrect：学生写的答案是否等于正确答案
${withBbox ? '5. bbox：这道题在图片里的位置...' : ''}
注意：
- 数字类题目要自己认真计算，不要直接照抄学生的答案当正确答案。
- 按图片里题目出现的顺序返回。`;
}
```

关键的一句是 **"数字类题目要自己认真计算，不要直接照抄学生的答案当正确答案"**——这是"校对"的核心机制：不是拿 OCR 出来的学生答案去和某个题库比对，而是让视觉模型看着题目**自己重新算一遍**，得到 `correctAnswer`，再跟识别出的 `studentAnswer` 做对比得出 `isCorrect`。这样即使题库里没有这道题（任意手写题目都能批改），也能判断对错。

---

### 3. 两路独立请求的架构（为什么拆成"列表"和"标注图"两次调用）

**背景问题**：本机 Ollama 用 `-np 1`（后来调整为 `-np 2`）启动，意味着同一时间只能处理有限个请求。如果"列表"和"标注图"两个请求同时发出、又恰好被服务端排队处理，复杂的那个（带 bbox）可能会拖慢简单的那个。

**解决方案**：不追求"两个请求同时发出"，而是**列表请求永远第一个发、独占等待**：

```js
async function analyzeHomework() {
  // ① 列表请求（无bbox，主路径），失败会自动重试
  try {
    const listItems = await hwCallVisionWithRetry(false, onRetryCallback);
    currentResults = listItems;
    renderResults(listItems);          // 立即展示，不等标注图
  } catch (err) {
    showFullScreenError(err);          // 列表失败=真的批改失败，展示全屏错误
    annoState = 'error';
    return;                            // 列表都失败了，不再浪费资源跑标注图
  }

  // ② 列表已经展示出来了，才发起标注图请求（带bbox）
  try {
    annoItems = await hwCallVisionWithRetry(true);
    annoState = 'ready';
    if (标注图tab当前可见) renderAnnotatedView();
  } catch (err) {
    annoState = 'error';               // 标注图失败不影响已展示的列表结果
  }
}
```

**关键设计原则**：
- 列表是**主路径**：只要它成功，用户就能看到结果，不因标注图变慢或失败而受影响
- 标注图是**增值功能**：失败了只在"标注图"tab里单独提示+提供"只重试标注图"按钮，不弹全屏错误
- `annoState` 状态机（`idle | pending | ready | error`）驱动"标注图"tab 的显示内容（转圈 / 画布 / 错误提示），tab 按钮上还会显示 ⏳/⚠️ 图标提示当前状态

**并发度调优**：把 Ollama 的 `OLLAMA_NUM_PARALLEL` 设置为 `2`（`launchctl setenv OLLAMA_NUM_PARALLEL 2` 后重启 Ollama），实测证实：
- Ollama 会自动按并发数等比放大总上下文（`-c` 从 4096 → 8192），每个并发槽位仍保留完整的 4096 token 上下文，不会因为并发数变多而让单个请求"缩水"
- 两个请求同时跑时总耗时约等于较慢那个请求的独立耗时（真正实现了并行），而不是两者相加（串行）
- 设为 `2` 而不是更大的数字，是因为这个页面架构上最多同时只需要 2 个并发请求，没必要多占内存

---

### 4. 解析结果：怎么把模型返回的文本变成可用数据

模型返回的是一段应该符合 JSON Schema 的文本（在 Ollama 响应的 `response` 字段里）。**即便有 Schema 约束，本地量化模型偶尔还是会输出格式不完全规范的 JSON**（这是概率性问题），所以做了两层解析兜底：

```js
function hwParseJsonLoose(raw) {
  try { return JSON.parse(raw); }               // 第一层：直接解析
  catch (e) {}
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(raw.slice(start, end + 1)); }  // 第二层：抠出花括号包裹的部分再解析
    catch (e2) {}
  }
  return null;   // 两层都失败，判定为真的解析不出来
}
```

再加上**自动重试机制**（`hwCallVisionWithRetry`，最多 `HW_MAX_RETRY = 2` 次）和**请求超时**（`HW_TIMEOUT_MS = 90秒`，用 `AbortController` 实现，超时会主动放弃而不是无限等待）：

```js
async function hwCallVisionWithRetry(withBbox, onRetry) {
  let lastErr = null;
  for (let attempt = 1; attempt <= HW_MAX_RETRY; attempt++) {
    if (attempt > 1 && onRetry) onRetry(attempt);   // 通知UI"正在重试"
    try {
      const parsed = await hwCallVisionOnce(withBbox);
      return parsed.items;
    } catch (err) { lastErr = err; }
  }
  throw lastErr;   // 重试次数用完仍失败，才真正抛出错误
}
```

失败时的错误信息会附带"模型原始输出预览"（截取前120字），方便排查具体是什么原因导致解析失败，而不是只看到一句笼统的"不是合法JSON"。

---

### 5. 识别图片内容：位置信息（bbox）是怎么来的

标注图视图需要知道每道题在图片里的**具体位置**，才能把 ✓/✗ 画在正确的地方。这个坐标同样是模型在同一次视觉推理里直接返回的（`HW_CHECK_SCHEMA_ANNO` 多出的 `bbox` 字段），采用的是 **Qwen2.5-VL 系列模型的标准 grounding 约定：坐标归一化到 0-1000 范围**（不是像素值）：

```js
// bbox = [x1, y1, x2, y2]，(0,0)是图片左上角，(1000,1000)是图片右下角
```

**实测发现的精度限制**：本地 7B 量化视觉模型给出的坐标是"大致准确、能分清题目的上下顺序"级别，**不是像素级精确定位**。所以标注图的渲染做了容错设计：

```js
function renderAnnotatedView() {
  // ...把图片画到canvas上...
  annoItems.forEach((it, idx) => {
    const bbox = it.bbox;
    // 0-1000归一化坐标换算成当前canvas的实际像素坐标
    const x1 = bbox[0] / 1000 * canvas.width;
    const y1 = bbox[1] / 1000 * canvas.height;
    const x2 = bbox[2] / 1000 * canvas.width;
    const y2 = bbox[3] / 1000 * canvas.height;

    // 标记画在这一行的右侧外沿（不是正中央），避免遮住手写字迹本身，
    // 也给"坐标不够精确"留出视觉容错空间
    const markX = Math.min(canvas.width - 16, x2 + 14);
    const markY = (y1 + y2) / 2;
    drawMark(ctx, markX, markY, it.isCorrect);

    // 点击命中区域比标记本身更大，进一步增加容错
    annoScaledBoxes.push({ idx, isCorrect: it.isCorrect,
      x1: x1 - 10, y1: y1 - 12, x2: markX + 16, y2: y2 + 12 });
  });
}
```

点击画布时，`handleAnnoCanvasClick` 会把点击坐标换算回真实像素坐标，命中某个题目的范围就触发对应逻辑（正确→提示语，错误→打开 AI 解析）。

---

### 6. 校对结果：判定对错的逻辑在哪一层

**判定对错本身发生在视觉模型内部**（prompt 明确要求模型"自己计算，不要照抄学生答案"），前端代码不做二次判断，只是**统计和展示**模型已经给出的 `isCorrect` 字段：

```js
function renderResults(items) {
  const ok = items.filter(it => it.isCorrect).length;
  const fail = items.length - ok;
  // 更新统计数字 + 渲染每一行（正确/错误配色、显示学生答案与正确答案对比）
}
```

对"看不清"的情况做了特殊提示（不会假装看清楚了强行判断）：

```js
${it.studentAnswer === '看不清' ? '<div class="q-confirm">⚠️ AI 没看清这题的手写答案，建议自己核对一下</div>' : ''}
```

---

### 7. 发现错题后的 AI 分析

点击某道错题的"🤖 AI解析"按钮，触发 `hwRunAnalysis(it, box, btn, retryFnName)`——这是**列表视图和标注图视图共用的核心逻辑**（两个视图各自的入口函数 `genHwAnalysis(i)` / `genAnnoAnalysis(idx)` 都只是薄封装，最终都调用它）。

**分两部分同时展示：**

**(a) 竖式计算图 —— 纯代码计算，不调用 AI，保证 100% 准确**

```js
function hwBuildVerticalBlock(qtext) {
  const parsed = hwParseArithmetic(qtext);   // 正则解析"数字 运算符 数字"格式
  if (!parsed) return '';                     // 应用题/比大小/找规律等解析不出来就不画竖式
  const board = hwRenderVertical(parsed.a, parsed.b, parsed.op);
  return `<div><span class="vcalc-tag">🧮 竖式计算</span>...</div>`;
}
```

逐位计算加法进位（`hwComputeAdd`）、减法退位（`hwComputeSub`），渲染出带删除线（借位前）、橙色新值（借位后）的静态竖式图。**为什么不让 AI 生成竖式**：算术正确性必须由确定性代码保证，不能让模型去猜每一位怎么借位——这是本页面里唯一完全不依赖 AI、纯规则计算的环节。

**(b) 文字分步讲解 —— 调用文本模型，Structured Outputs 强约束**

```js
const HW_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    bigIdea: { type: 'string', maxLength: 22, description: '一句话点出核心思路' },
    steps: {
      type: 'array', minItems: 2, maxItems: 4,
      items: { type: 'object', properties: {
        emoji: { type: 'string', maxLength: 2 },
        text:  { type: 'string', maxLength: 26 },
      }, required: ['emoji','text'] },
    },
  },
  required: ['bigIdea','steps'],
};
```

Prompt 要求按 **"理解题意→列式计算→得出答案"** 三步走的固定模板讲解，并且**特别规定：如果涉及进位/退位，必须把这个具体过程单独列成一步详细讲出来**，还给出了具体的好例子/坏例子对比（比如"54-6"退位减法该怎么讲、不该怎么讲）。字数上限 + 前端 `hwClampText()` 二次截断兜底，避免模型输出大段文字。

最终渲染效果：

```
🧮 竖式计算
[  竖式图，代码精确计算  ]

💡 个位不够减，要向十位借1
步骤1 🤔 个位4减6，不够减
步骤2 🔄 向十位借1，变成14减6
步骤3 ✏️ 14减6等于8，十位5减1等于4
步骤4 ✅ 答案是48
```

---

## 四、关键设计原则总结

| 原则 | 具体体现 |
|---|---|
| **确定性计算优先于AI猜测** | 竖式的进位/退位完全由代码计算，不依赖AI |
| **Structured Outputs 保证格式稳定** | 所有 AI 调用都用 JSON Schema 强约束输出结构，而非依赖文字提示"请按格式输出" |
| **多层防御，不假设AI/网络一定成功** | JSON宽松解析 + 自动重试 + 请求超时 + 原始输出预览 |
| **主路径与增值功能解耦** | 列表（主路径）永远优先，标注图（增值功能）独立失败不影响主路径 |
| **诚实的精度声明** | 页面明确告知"本地视觉模型定位是大致准确，不是像素级精确" |
| **字数受控，适合小学生阅读** | AI讲解严格限制字数+步骤数，避免输出大段难懂的文字 |
| **本地隐私优先** | 全程调用本机 Ollama，图片和作业内容不出本地设备 |

---

## 五、环境依赖

- 本机需安装并启动 [Ollama](https://ollama.com)
- 需要拉取两个模型：
  ```bash
  ollama pull qwen2.5vl:7b   # 视觉模型，约6GB
  ollama pull qwen2.5:14b    # 文本模型，约9GB
  ```
- 若本页面不是从运行 Ollama 的同一台设备打开，需要设置：
  ```bash
  launchctl setenv OLLAMA_HOST 0.0.0.0
  launchctl setenv OLLAMA_ORIGINS "*"
  ```
  否则浏览器会因 CORS 被拒绝
- 建议设置并发度以获得更好的响应速度：
  ```bash
  launchctl setenv OLLAMA_NUM_PARALLEL 2
  ```
  设置后需要重启 Ollama（退出菜单栏图标 + 重新打开）才能生效
