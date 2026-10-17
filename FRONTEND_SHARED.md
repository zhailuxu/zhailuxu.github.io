# 慧陪学前端共享层

`hpx-core.js` 和 `hpx-common.css` 是标准课程页的公共基础层。新增课程页不要再复制语音初始化、Tab 显隐和通用控制样式。

## 页面接入

```html
<link rel="stylesheet" href="hpx-common.css">
</head>
<body data-hpx-page style="--hpx-accent:#1565c0">
  ...
  <script src="hpx-core.js"></script>
  <script>
    Hpx.speech.install({ rate: 0.9 });

    function switchTab(tab) {
      Hpx.tabs.activate(tab, ['learn', 'practice', 'quiz']);
      // 页面自己的初始化或朗读逻辑继续写在这里。
    }
  </script>
```

约定每个 Tab 面板使用 `tab-名称` 作为 ID，按钮放在 `.tabs` 容器中并使用 `.tab-btn`。

## 公共 API

- `Hpx.speech.install(options)`：安装全局 `speak()` 和 `toggleSpeak()`。
- `Hpx.speech.create(options)`：创建独立语音控制器，适合中英文双语页面。
- `controller.sequence(items, options)`：连续朗读多句，支持 `gapMs`、动态语速和取消旧队列。
- `controller.stop()`：停止当前朗读或连续朗读队列。
- `Hpx.tabs.activate(name, names, options)`：统一显示目标面板并更新按钮状态。
- `Hpx.random.int(min, max)`：生成闭区间随机整数。
- `Hpx.random.shuffled(items)`：返回乱序副本，不修改原数组。

语音的 `speak()` 统一返回 Promise，因此普通页面可以直接调用，需要等待朗读完成的动画页面也可以使用 `await speak(text)`。

## 检查

```bash
node tests/check-shared-layer.mjs
node tests/check-study-plan-coverage.mjs
```

检查会验证内联脚本语法、共享资源加载顺序、Tab 面板契约，并禁止课程页面重新直接操作 Web Speech API。

## 新增学习页清单

新增课程或练习页面时：

1. 在 `index.html` 增加课程卡片，并准确填写 `data-subject` 与 `data-grades`。
2. 检查它是否对应 `study-plan.html`、`chinese-study-plan.html` 或 `english-study-plan.html` 中的年级目标；对应时增加 `.study-link` 入口。
3. 如果页面是跨学科工具或导航、不适合加入学习地图，在 `tests/check-study-plan-coverage.mjs` 的 `reviewedExclusions` 中登记原因。
4. 运行 `node tests/check-study-plan-coverage.mjs`；未链接且未登记的首页课程页会使检查失败。
