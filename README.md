# Rhythm Game Prototype

这是一个 Web 优先的节奏游戏原型仓库。项目最早从微信小程序方向开始，所以还保留了 `miniprogram` 目录；当前主线已经转向 Web 发布路线，之后新增功能、视觉调整、玩法迭代、资源接入和发布验证都默认围绕 `web` 目录进行。

当前重点：

- 把 React/Vite Web 版作为主要可玩版本持续迭代。
- 保持音乐、谱面、判定、渲染和音频播放对齐。
- 用本地谱面编辑器快速手改中立谱面；`shared/charts/ditto.editable.chart.json` 是唯一 source-of-truth，多端 JS adapter 由它同步生成。
- 保留小程序版本作为历史参考，不再把它当作默认维护目标。
- 将 `web-parkour` 作为旁线跑酷玩法原型，只有明确提到跑酷方向时再进入。

## 目录定位

- `web`：当前主项目，React/Vite Web 版节奏小游戏，也是默认发布和迭代目标。
- `miniprogram`：早期微信小程序版本，已经不是当前发布主线；一般只作为历史参考。
- `tools/chart-editor`：本地可视化谱面编辑器，用来调整 Ditto 谱面。
- `web-parkour`：React/Vite 跑酷玩法原型，是旁线项目。
- `scripts`：资源生成脚本和预览辅助脚本。
- `docs`：设计说明、审阅页面和项目文档。
- `previews`：生成出来的视觉预览、实验稿和审阅材料。

如果只说“游戏”“音游”“网页版本”“当前版本”或“小游戏”，默认指 `web`。

## 启动 Web 主项目

进入 Web 项目目录：

```bash
cd web
```

安装依赖：

```bash
npm install
```

启动本地开发服务：

```bash
npm run dev
```

Vite 配置的默认端口是：

```text
http://localhost:5173/
```

`web/package.json` 里的开发脚本使用 `vite --host 0.0.0.0`，所以需要手机或同局域网设备访问时，可以使用终端输出的 Network 地址。

## 构建和本地预览

生产构建：

```bash
cd web
npm run build
```

构建产物输出到：

```text
web/dist
```

本地预览生产构建：

```bash
cd web
npm run preview
```

## 部署

当前仓库根目录包含 `netlify.toml`，Netlify 部署配置已经指向 Web 主项目：

```toml
[build]
  base = "web"
  command = "npm run build"
  publish = "dist"
```

如果手动在 Netlify、Vercel 或类似平台配置项目，使用：

- Project root / Base directory: `web`
- Build command: `npm run build`
- Output / Publish directory: `dist`
- SPA fallback: 所有路径回退到 `index.html`

如果平台从仓库根目录读取配置，参考根目录的 `netlify.toml`。

## Web 关键文件

Web 应用入口：

- [web/src/main.jsx](/Users/yaohermione/Desktop/rhythm game/web/src/main.jsx)
- [web/src/App.jsx](/Users/yaohermione/Desktop/rhythm game/web/src/App.jsx)
- [web/src/styles.css](/Users/yaohermione/Desktop/rhythm game/web/src/styles.css)

主要页面：

- [web/src/screens/StartScreen.jsx](/Users/yaohermione/Desktop/rhythm game/web/src/screens/StartScreen.jsx)
- [web/src/screens/GameScreen.jsx](/Users/yaohermione/Desktop/rhythm game/web/src/screens/GameScreen.jsx)
- [web/src/screens/ResultScreen.jsx](/Users/yaohermione/Desktop/rhythm game/web/src/screens/ResultScreen.jsx)
- [web/src/screens/StageShell.jsx](/Users/yaohermione/Desktop/rhythm game/web/src/screens/StageShell.jsx)

游戏核心：

- [web/src/game/GameRunner.js](/Users/yaohermione/Desktop/rhythm game/web/src/game/GameRunner.js)
- [web/src/game/engine.js](/Users/yaohermione/Desktop/rhythm game/web/src/game/engine.js)
- [web/src/game/renderer.js](/Users/yaohermione/Desktop/rhythm game/web/src/game/renderer.js)
- [web/src/game/AudioControllerWeb.js](/Users/yaohermione/Desktop/rhythm game/web/src/game/AudioControllerWeb.js)

歌曲入口和资源：

- [web/src/game/songs.js](/Users/yaohermione/Desktop/rhythm game/web/src/game/songs.js)
- [web/src/game/assets.js](/Users/yaohermione/Desktop/rhythm game/web/src/game/assets.js)
- [web/public/assets](/Users/yaohermione/Desktop/rhythm game/web/public/assets)

谱面 source 和消费 adapter：

- [shared/charts/ditto.editable.chart.json](/Users/yaohermione/Desktop/rhythm game/shared/charts/ditto.editable.chart.json)：唯一 source-of-truth，保存中立时间数据。
- [shared/charts/ditto.editable.chart.js](/Users/yaohermione/Desktop/rhythm game/shared/charts/ditto.editable.chart.js)：由 JSON 生成的 ESM adapter，供 Web、web-parkour 等 JS 运行时消费。
- [web/src/game/ditto.editable.chart.js](/Users/yaohermione/Desktop/rhythm game/web/src/game/ditto.editable.chart.js)：Web 端兼容消费文件 / 同步产物。
- [web/public/assets/charts/ditto.editable.chart.js](/Users/yaohermione/Desktop/rhythm game/web/public/assets/charts/ditto.editable.chart.js)：静态资源消费文件 / 同步产物。
- [miniprogram/assets/charts/ditto.editable.chart.js](/Users/yaohermione/Desktop/rhythm game/miniprogram/assets/charts/ditto.editable.chart.js)：历史小程序端 CommonJS adapter / 同步产物。

## 谱面编辑器

在仓库根目录启动本地谱面编辑器：

```bash
npm run chart:editor
```

然后打开：

```text
http://127.0.0.1:4317
```

谱面是中立时间数据，不归属于 Web、web-parkour 或小程序中的任何一个端。

编辑器会读取并保存唯一 source-of-truth：

- [shared/charts/ditto.editable.chart.json](/Users/yaohermione/Desktop/rhythm game/shared/charts/ditto.editable.chart.json)

保存时会从 JSON 同步生成各端消费 adapter / 同步产物：

- [shared/charts/ditto.editable.chart.js](/Users/yaohermione/Desktop/rhythm game/shared/charts/ditto.editable.chart.js)
- [web/src/game/ditto.editable.chart.js](/Users/yaohermione/Desktop/rhythm game/web/src/game/ditto.editable.chart.js)
- [web/public/assets/charts/ditto.editable.chart.js](/Users/yaohermione/Desktop/rhythm game/web/public/assets/charts/ditto.editable.chart.js)
- [miniprogram/assets/charts/ditto.editable.chart.js](/Users/yaohermione/Desktop/rhythm game/miniprogram/assets/charts/ditto.editable.chart.js)

这些 JS 文件都是消费 adapter，不是主数据；如果它们和 JSON 不一致，以 [shared/charts/ditto.editable.chart.json](/Users/yaohermione/Desktop/rhythm game/shared/charts/ditto.editable.chart.json) 为准重新生成。

每次保存会自动留备份到：

```text
tools/chart-editor/backups
```

编辑器常用操作：

- 双击轨道：新增点按
- `Shift + 双击`：新增长按
- 拖动圆点或长条：改开始时间
- 拖动长按右侧把手：改结束时间
- `Cmd/Ctrl + Z`：撤销
- `Cmd/Ctrl + Shift + Z` 或 `Cmd/Ctrl + Y`：重做
- 空格：播放 / 暂停
- `Delete`：删除选中 note
- `Cmd/Ctrl + S`：保存

## 资源脚本

在仓库根目录运行：

```bash
npm run assets:rabbit-hit
npm run assets:song-covers
npm run assets:parchment
npm run assets:stage
```

这些脚本用于重新生成角色、封面、羊皮纸、舞台等运行时资源。生成资源时要确认输出路径是否面向 `web/public/assets`，不要默认写回小程序目录。

## 小程序历史版本

`miniprogram` 是早期微信小程序版本，当前不再作为默认发布目标。除非任务明确要求维护小程序，否则不要优先修改这里。

历史参考入口：

- [miniprogram/game/data/songs.js](/Users/yaohermione/Desktop/rhythm game/miniprogram/game/data/songs.js)
- [miniprogram/pages/game/game.js](/Users/yaohermione/Desktop/rhythm game/miniprogram/pages/game/game.js)
- [miniprogram/game/core/engine.js](/Users/yaohermione/Desktop/rhythm game/miniprogram/game/core/engine.js)
- [miniprogram/game/core/audio.js](/Users/yaohermione/Desktop/rhythm game/miniprogram/game/core/audio.js)
- [miniprogram/game/render/renderer.js](/Users/yaohermione/Desktop/rhythm game/miniprogram/game/render/renderer.js)

如果确实需要在微信开发者工具里查看历史版本，可以导入仓库根目录；本地模拟器可临时使用 `touristappid`，真机预览需要替换 `project.config.json` 里的小程序 AppID。

## 跑酷旁线项目

`web-parkour` 是旁线跑酷玩法原型，不属于当前音游主线。只有明确提到跑酷、城市奔跑、场景运动、parkour 或 `web-parkour` 时，才把它作为当前任务目标。

运行方式：

```bash
cd web-parkour
npm install
npm run dev
```

构建方式：

```bash
cd web-parkour
npm run build
```

关键参考文件：

- [web-parkour/src/game/ParkourRunner.js](/Users/yaohermione/Desktop/rhythm game/web-parkour/src/game/ParkourRunner.js)
- [web-parkour/src/game/engine.js](/Users/yaohermione/Desktop/rhythm game/web-parkour/src/game/engine.js)
- [web-parkour/src/game/renderer.js](/Users/yaohermione/Desktop/rhythm game/web-parkour/src/game/renderer.js)
- [web-parkour/src/screens/GameScreen.jsx](/Users/yaohermione/Desktop/rhythm game/web-parkour/src/screens/GameScreen.jsx)

## 协作约定

- 开始改动前先看 [AGENTS.md](/Users/yaohermione/Desktop/rhythm game/AGENTS.md)。
- 改代码前先检查工作区状态，避免覆盖用户已有的未提交改动。
- 默认优先修改 `web`，除非任务明确指定 `miniprogram` 或 `web-parkour`。
- 做玩法改动时同时关注 `engine`、`AudioControllerWeb`、`renderer`、`GameRunner` 和 chart data。
- 做 UI 或视觉改动后，尽量启动 Web dev server 并在浏览器实际确认效果。
- 给体验地址前，重新确认当前 dev server 正在运行，使用本次真实可访问的地址。
