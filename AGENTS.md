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
- 做 UI 改动时，如果有可用的本地 dev server，尽量用浏览器实际查看效果。
- 做玩法相关改动时，要同时关注 engine、audio、renderer 和 chart data；节奏游戏的 timing 问题可能来自任一层。
- 生成资源时，保持源脚本和输出路径清晰，方便之后重新生成和审阅。
- 稳定的项目决策应该记录在这里，不要只留在聊天记录里。

## 体验地址和本地服务

- 用户白天可能在公司，晚上可能在家里；不同网络环境下，本地体验地址可能不同。
- 不要复用几个小时前或上一个对话里提供过的体验地址。每次需要给用户体验地址时，都要重新确认当前环境下真实可访问的地址。
- 完成 Web 相关 feature、UI 调整、玩法调整或可视化改动后，主动告诉用户“已经改好，可以在某个地址体验”。
- 提供体验地址前，必须确认对应 dev server 当前正在运行，并且页面真实可访问。
- 如果 dev server 没有运行或已经挂掉，先启动它，再给用户地址。
- 如果已有服务占用默认端口，使用实际可用端口，并把最终地址清楚告诉用户。
- 对 `web` 主线，通常在 `web` 目录运行 `npm run dev`；对 `web-parkour`，在 `web-parkour` 目录运行 `npm run dev`。
- 最终回复里的体验地址应该是本次刚确认过的地址，而不是记忆中的旧地址。

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
