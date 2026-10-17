# 第三方组件与授权说明

最后核对日期：2026-08-09

本项目使用以下第三方组件、字体和数据。它们均不要求按网站访问量支付版权费，但使用和再分发时仍须遵守对应许可证。本目录下的 `licenses/` 保存了随项目分发所需的许可证原文。

## 随网站分发的组件

| 组件 | 使用位置 | 版本/来源 | 许可证 | 许可证文件 |
| --- | --- | --- | --- | --- |
| JetBrains Mono | `study-plan.html` 内嵌 WOFF2 | JetBrains Mono 2.305 | SIL Open Font License 1.1 | `licenses/JetBrains-Mono-OFL-1.1.txt` |
| Special Elite | `english-study-plan.html` 内嵌 WOFF2 | Special Elite 1.001；Copyright © 2010 Brian J. Bonislawsky DBA Astigmatic (AOETI) | Apache License 2.0 | `licenses/Special-Elite-Apache-2.0.txt` |
| Hanzi Writer | `lib/hanzi-writer.min.js` | Hanzi Writer 3.7.3 | MIT | `licenses/Hanzi-Writer-MIT.txt` |
| Hanzi Writer Character Data | `hanzi-data.js` | Hanzi Writer Data / Make Me A Hanzi；原始字形来自 Arphic Technology，本站转换为单个离线 JavaScript 数据文件 | Arphic Public License | `licenses/Hanzi-Writer-Data-Arphic.txt` |

字体均可嵌入和免费商用，但不得脱离软件单独销售字体，并应继续携带对应许可证。Apache 2.0、MIT 和 Arphic Public License 组件再分发时也必须保留其版权及许可声明。

`hanzi-data.js` 只是对上游公开字符数据进行打包和格式转换，没有修改单字笔画轮廓。该数据文件随本站公开提供，接收者可依据 Arphic Public License 继续复制和修改；若以后改动笔画轮廓，应在数据文件和本说明中记录改动日期与内容。

## 服务端直接依赖

版本以 `server/package-lock.json` 为准。直接依赖如下：

| 包 | 当前版本 | 许可证 | 许可证文件 |
| --- | --- | --- | --- |
| bcryptjs | 3.0.3 | BSD-3-Clause | `licenses/server/bcryptjs-BSD-3-Clause.txt` |
| better-sqlite3 | 13.0.2 | MIT | `licenses/server/better-sqlite3-MIT.txt` |
| cors | 2.8.6 | MIT | `licenses/server/cors-MIT.txt` |
| dotenv | 17.4.2 | BSD-2-Clause | `licenses/server/dotenv-BSD-2-Clause.txt` |
| express | 5.2.1 | MIT | `licenses/server/express-MIT.txt` |
| jsonwebtoken | 9.0.3 | MIT | `licenses/server/jsonwebtoken-MIT.txt` |

传递依赖由 npm 安装在 `server/node_modules` 中，每个包自带许可证。若以后把依赖打包成单文件、容器镜像或安装包，打包流程必须保留这些许可证文件。

## 外部或本地运行服务

以下服务没有作为代码或素材打包进网站，因此不属于本站静态文件的再分发授权，但运行时可能受服务条款、模型许可证或账户费用约束：

- GoatCounter：托管统计服务；当前对合理的公开网站流量免费，具体以其最新使用条款为准。
- Ollama：本机推理程序采用 MIT 许可证；通过 Ollama 使用的每个模型都有独立许可证，部署前须逐个核对。
- EasyOCR：采用 Apache License 2.0；模型文件及其依赖应随实际部署环境一并核对。
- Claude Code：`beads.html` 的可选本地代理会调用用户已登录的 Claude Code；可能消耗订阅额度或产生 API 费用，不属于免费本地模型。
- Web Speech API、Web Audio API、Canvas、SVG：浏览器原生能力，不是按调用计费的第三方素材服务。

## 系统字体与 Emoji

页面 CSS 还会按名称调用 `Comic Sans MS`、`华文圆体`、`微软雅黑`、`PingFang SC` 等系统字体。本项目没有分发这些字体文件，实际显示由用户设备已安装字体及其系统许可决定。页面中的 Emoji 以 Unicode 文本保存，没有随项目分发第三方 Emoji 图片集。

## 上游项目

- JetBrains Mono：https://github.com/JetBrains/JetBrainsMono
- Special Elite：https://github.com/google/fonts/tree/main/apache/specialelite
- Hanzi Writer：https://github.com/chanind/hanzi-writer
- Hanzi Writer Data：https://github.com/chanind/hanzi-writer-data
- GoatCounter：https://www.goatcounter.com/
- Ollama：https://github.com/ollama/ollama
- EasyOCR：https://github.com/JaidedAI/EasyOCR

本文件是工程合规记录，不构成法律意见。新增字体、图片、音频、文章、模型或第三方服务时，应同步更新本文件和 `licenses/`。
