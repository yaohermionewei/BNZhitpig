# AGENTS.md

这个文件是给在本仓库里工作的 AI coding agent 看的项目说明和长期记忆本。

它适合记录稳定的项目背景、工作约定、技术入口、产品决策和容易踩坑的地方。不要在这里记录密码、私密 token、cookie、证书、恢复密钥或其他敏感信息。

## Codex 应该怎么使用这个文件

- 在这个仓库里开始改动前，先阅读本文件。
- 把本文件当作项目级指导；如果它和用户当前明确指令冲突，以用户当前指令为准。
- 当本文件记录了工作流、命令、路径、产品决策或禁区时，优先参考这里。
- 如果某次任务形成了稳定的新约定，可以建议追加到这里；用户要求时再更新。
- 如果本文件和当前任务存在明显冲突，在执行时说明冲突点。
- 改代码前先检查工作区状态，避免覆盖用户已有的未提交改动。

## 开始工作前的阅读顺序

如果这些文件存在，开始一个新任务时优先按这个顺序理解项目：

1. `AGENTS.md`：先读这里，了解项目主线、协作规则、目录优先级和长期共识。
2. `README.md`：需要运行、构建、部署或面向人类的项目说明时再参考；如果它和 `AGENTS.md` 冲突，以 `AGENTS.md` 中记录的当前项目方向为准。
3. `PLANS.md`：如果任务是复杂功能、重大重构或多小时任务，阅读这里的 ExecPlan 规范，并按需创建具体 ExecPlan。
4. 相关源码和配置文件：最后根据具体任务阅读 `web`、`web-parkour`、`scripts` 等目录下的实际实现。

## PLANS.md 和 ExecPlan

`PLANS.md` 是官方风格的 ExecPlan 使用规范，面向复杂功能、重大重构和多小时任务。

- 遇到复杂功能、重大重构、跨阶段任务或可能被中断的多小时工作时，先阅读 `PLANS.md`。
- 如果任务需要 ExecPlan，在 `plans/` 下创建具体计划文件，并在执行过程中持续更新。
- 普通小任务、简单问答、单文件小修，不要使用 ExecPlan，避免过度工程。
- 如果不确定某个任务是否需要 ExecPlan，先问用户。

## 项目概况

这是一个节奏游戏原型仓库。项目最早计划发布到微信小程序，所以有 `miniprogram` 目录；后来因为微信小程序发布游戏成本和流程太麻烦，项目已经转向 Web 发布路线。

当前默认聚焦的是 `web` 目录里的网页版本。除非用户明确说明要改小程序或跑酷版本，否则所有新功能、视觉调整、玩法迭代、资源接入和验证工作，都应该优先围绕 `web` 进行。

主要目录：

- `web`：当前主项目，React/Vite Web 版节奏小游戏，也是之后优先发布和迭代的版本。
- `shared`：三端共用数据和跨端共享资源；当前 Ditto 谱面 source-of-truth 在 `shared/charts`。
- `miniprogram`：早期微信小程序版本，已经不是当前发布目标；一般只作为历史参考，不主动维护。
- `tools/chart-editor`：本地可视化谱面编辑器。
- `web-parkour`：React/Vite 跑酷玩法原型，是之后可能穿插迭代的下一个项目方向。
- `scripts`：资源生成脚本和预览辅助脚本。
- `docs` 和 `previews`：设计说明、预览页面、生成出来的审阅材料。

## 当前项目优先级

- 默认主线：`web`。
- 历史遗留：`miniprogram`。不要因为旧 README 或旧脚本提到小程序，就默认继续维护小程序版本。
- 旁线项目：`web-parkour`。只有当用户明确提到跑酷、城市奔跑、场景运动、parkour 或 `web-parkour` 时，才把它作为当前任务目标。
- 如果用户只说“游戏”“音游”“网页版本”“当前版本”“小游戏”，默认指 `web`。
- 如果需要新增资源、调整 UI、改玩法、修 bug、做发布准备，优先检查和修改 `web` 下的实现。

## 平台和布局原则

- 三个游戏形态都采用 mobile-first：`web`、`miniprogram`、`web-parkour` 的核心体验优先为手机竖屏和触摸操作设计。
- 桌面端需要顺带覆盖和保持可用，但不是主要设计基准；不要为了桌面大屏牺牲手机体验。
- 做 UI、交互、画布布局、输入方式、资源加载和性能优化时，先考虑移动端尺寸、触摸手感、移动浏览器音频限制和弱网/加载表现。
- 桌面适配应作为 responsive enhancement：保证画面居中、比例合理、可操作、文字不溢出，但不把界面改成桌面优先布局。

共享谱面源：

- `shared/charts/ditto.editable.chart.json`
- `shared/charts/ditto.editable.chart.js`

当前 Web 版重要文件：

- `web/src/App.jsx`
- `web/src/main.jsx`
- `web/src/styles.css`
- `web/src/game/songs.js`
- `web/src/game/ditto.editable.chart.js`
- `web/src/game/GameRunner.js`
- `web/src/game/AudioControllerWeb.js`
- `web/src/game/engine.js`
- `web/src/game/renderer.js`
- `web/src/screens/GameScreen.jsx`
- `web/src/screens/StartScreen.jsx`
- `web/src/screens/ResultScreen.jsx`
- `web/src/screens/StageShell.jsx`

历史小程序参考文件：

- `miniprogram/assets/charts/ditto.editable.chart.js`
- `miniprogram/game/data/songs.js`
- `miniprogram/pages/game/game.js`
- `miniprogram/game/core/engine.js`
- `miniprogram/game/core/audio.js`
- `miniprogram/game/render/renderer.js`

跑酷旁线参考文件：

- `web-parkour/src/game/ParkourRunner.js`
- `web-parkour/src/game/engine.js`
- `web-parkour/src/game/renderer.js`
- `web-parkour/src/screens/GameScreen.jsx`

重要谱面编辑器文件：

- `tools/chart-editor/server.js`
- `tools/chart-editor/public/app.js`

## 常用命令

在仓库根目录启动本地谱面编辑器：

```bash
npm run chart:editor
```

然后打开：

```text
http://127.0.0.1:4317
```

运行主 Web 原型：

```bash
cd web
npm install
npm run dev
```

构建主 Web 原型：

```bash
cd web
npm run build
```

运行跑酷 Web 原型：

```bash
cd web-parkour
npm install
npm run dev
```

构建跑酷 Web 原型：

```bash
cd web-parkour
npm run build
```

在仓库根目录运行的常用资源脚本：

```bash
npm run assets:rabbit-hit
npm run assets:song-covers
npm run assets:parchment
npm run assets:stage
```

## 谱面工作流

- 谱面的唯一 source-of-truth 是 `shared/charts/ditto.editable.chart.json`。谱面本身是中立数据，不属于 Web、小程序或 web-parkour 任一端。
- `shared/charts/ditto.editable.chart.js`、`web/src/game/ditto.editable.chart.js`、`web/public/assets/charts/ditto.editable.chart.js` 和 `miniprogram/assets/charts/ditto.editable.chart.js` 都是从 shared JSON 同步出来的消费文件/adapter；一般不要手改。
- 如果端侧谱面文件和 shared source 不一致，以 `shared/charts/ditto.editable.chart.json` 为准重新生成。
- `web` 和 `web-parkour` 当前通过 `shared/charts/ditto.editable.chart.js` 消费谱面；不要把某个端侧副本误认为主源。
- 在编辑器里还没保存的改动，只存在当前编辑器页面内，不会写入游戏文件。
- 谱面编辑器会把备份保存到 `tools/chart-editor/backups`。
- 修改 timing 时，要保护用户手调过的谱面数据；除非用户明确要求大范围重排，否则不要随意批量重写。

## 工作约定

- 搜索文件和文本时，优先使用 `rg` 或 `rg --files`。
- 改动范围尽量限制在当前任务相关的文件和行为内。
- 不要回滚、覆盖或清理用户已有的未提交改动，除非用户明确要求。
- 优先沿用项目里已有的写法、结构和命名方式。
- 新增或修改 Markdown 文档时，默认使用中文撰写；除非用户明确要求英文，或原文件/外部规范必须使用英文。
- 做 UI 改动时，如果有可用的本地 dev server，尽量用浏览器实际查看效果。
- 做玩法相关改动时，要同时关注 engine、audio、renderer 和 chart data；节奏游戏的 timing 问题可能来自任一层。
- 生成资源时，保持源脚本和输出路径清晰，方便之后重新生成和审阅。
- 稳定的项目决策应该记录在这里，不要只留在聊天记录里。

## 设计系统优先

- 任何新的 UI、视觉、交互、结果页、调试页或宣传/预览设计，都要先参考本项目已有设计系统和既有实现，不要自己杜撰新的 property、token、组件变体、命名或视觉规则。
- 优先参考：
  - `docs/castle-stage-pixel-design-system.zh-CN.md`
  - `docs/ui-design-system-summary.zh-CN.md`
  - `web/src/styles.css`
  - 现有 screen/component 实现，例如 `web/src/screens/StartScreen.jsx`、`web/src/screens/GameScreen.jsx`、`web/src/screens/ResultScreen.jsx`。
- 如果现有设计系统没有覆盖某个新需求，先向用户说明缺口、拟新增的 property/token/组件变体是什么、为什么需要新增；得到确认后再落地。
- 不要因为做单个页面或临时功能，就绕开现有设计系统另起一套颜色、字号、圆角、阴影、动效、组件状态或命名方式。

## 中文像素字体子集

- 当前游戏 UI 使用中文像素字字体子集包，相关说明见 `web/public/assets/fonts/README.md`。
- 新增或修改 feature 时，如果引入了新的中文 UI 文案、按钮文案、结果页文案、loading 文案、提示语或调试预览文案，必须多做一步：把新增汉字加入中文字体子集字符表，并重新生成对应的中文像素字体子集包。
- Web 侧重点关注 `web/public/assets/fonts/bunnies-pixel-zh-ui.subset.txt` 和 `web/public/assets/fonts/bunnies-pixel-zh-ui.woff2`。
- 不要只改 JSX/JS 里的中文字符串就结束；否则新字可能回退到系统字体，破坏像素风一致性。
- 如果不确定某个新增字符是否已在子集里，先检查 subset 文本文件；缺字时补齐并重新生成字体。
- 完成涉及中文 UI 文案的改动后，验证页面中新增文字没有字体回退、缺字、字形不一致或布局溢出。

## Git 提交和预览产物

- 仓库里混有不少开发者模式、debug 模式、设计审阅和预览产物，尤其集中在 `previews/`。
- 常见预览/临时产物还可能出现在 `test-results/`、`web/tmp-result-preview/`、`docs/*preview*`、`docs/*design-system-board*`、`web/public/assets/images/*preview*/`、`web/public/assets/images/rank-thin/` 等位置。
- 用户希望保留本地调试能力；不要因为正式发布或准备提交，就擅自删除用户仍可能使用的 debug 页面、debug URL、验收入口或本地测试工具。
- 但调试工具和临时验收脚手架默认不应该进入 GitHub 提交。尤其是一次性 debug 页面、临时实验样式、预览资源、测试输出和大体积审阅产物，除非用户明确要求提交，否则只保留在本地或保持未跟踪。
- 如果新增的是长期有价值的开发工具，提交前需要和用户确认是否纳入代码库；如果纳入，必须确保只在开发环境生效，例如通过 `import.meta.env.DEV` 或等价机制隔离，避免普通玩家在生产环境访问。
- 当用户要求提交到 GitHub 时，默认不要把 `previews/`、debug preview、临时审阅截图、测试结果、临时 HTML 预览页或类似生成产物一起提交。
- 不要因为这些目录里有未跟踪文件就犹豫是否要提交；除非用户明确说要提交预览/审阅产物，否则应忽略它们。
- 提交前用 `git status --short` 和按路径暂存，确保只提交本次任务需要的源码、配置、正式资源或文档。
- 如果某个生成资源是否属于正式运行时资产不确定，先问用户，不要擅自把 preview/debug 产物纳入提交。

## 提交和部署

- 这个项目的发布链路默认走 GitHub：完成需要上线的改动后，提交并推送到 GitHub，由已配置好的 Cloudflare 和/或 Netlify 自动同步部署。
- 不要默认使用 `wrangler login`、`wrangler pages deploy`、Cloudflare Pages 临时内部部署、Netlify CLI 或其他手动部署路径；这些会引入额外登录/授权和不必要的分叉流程。
- 如果用户说“提交”“发到 GitHub”“发布”“部署”，优先理解为提交并推送当前相关改动到 GitHub，让平台自动拉取，而不是直接把 `web/dist` 手动上传到 Cloudflare 或 Netlify。
- 用户在迭代期间可能会暂时关闭 Netlify 同步，所以通常只有 Cloudflare 会从 GitHub 自动更新；等所有东西 ready 后，用户会自行重新打开 Netlify 同步。
- 除非用户明确要求手动部署或临时预览链接，否则不要启动 Cloudflare OAuth、要求用户授权 `wrangler`、或尝试绕过 GitHub 自动部署链路。

## 体验地址和本地服务

- 用户白天可能在公司，晚上可能在家里；不同网络环境下，本地体验地址可能不同。
- 不要复用几个小时前或上一个对话里提供过的体验地址。每次需要给用户体验地址时，都要重新确认当前环境下真实可访问的地址。
- 完成 Web 相关 feature、UI 调整、玩法调整或可视化改动后，主动告诉用户“已经改好，可以在某个地址体验”。
- 提供体验地址前，必须确认对应 dev server 当前正在运行，并且页面真实可访问。
- 如果 dev server 没有运行或已经挂掉，先启动它，再给用户地址。
- 如果已有服务占用默认端口，使用实际可用端口，并把最终地址清楚告诉用户。
- 对 `web` 主线，通常在 `web` 目录运行 `npm run dev`；对 `web-parkour`，在 `web-parkour` 目录运行 `npm run dev`。
- 最终回复里的体验地址应该是本次刚确认过的地址，而不是记忆中的旧地址。
- 如果为了验证效果自行打开了浏览器、内置浏览器或任何会播放游戏音频的页面，验证完成后要关闭对应标签页，或确保页面停止播放音频；不要把有背景音乐/音效的游戏页面留在用户电脑上持续发声。

## 适合记录在这里的内容

这个文件适合记录长期有用的信息，例如：

- 产品目标和暂时不做的事情。
- 游戏手感决策、判定窗口、offset、计分规则、combo 规则和长按结算规则。
- 单曲谱面备注、校准偏移、BPM 假设、难调段落和已经手工校准过的区域。
- 视觉方向、颜色偏好、字体选择、资源风格和素材使用规则。
- 微信开发者工具里的特殊设置、设备差异、调试坑点和真机表现。
- Web 部署设置、构建命令、环境假设和预览地址。
- 已知 bug、疑似原因和临时 workaround。
- 架构决策，以及当时为什么这么做。
- 文件、素材、脚本、谱面 ID 的命名约定。
- 没有明确确认前不要随便改动的区域。

不建议记录：

- 密码、API key、cookie、证书、私密 token 或账号恢复信息。
- 很快会过期的临时想法。
- 大段日志；日志更适合放到 issue、测试结果或单独的调试文件里。

## 当前开放记录

以后稳定下来的项目备注可以写在这里。

-
