# Rhythm Game Prototype

这是一个面向微信小程序的竖屏单轨节奏原型。当前重点不是做最终美术，而是把这三件事先跑顺：

- 音乐、谱面、判定是否真正对齐
- 单轨点击加少量长按的玩法是否成立
- 玩法验证后，能不能快速手改谱面继续迭代

## 当前结构

- 小程序运行时音频：`miniprogram/assets/audio/ditto.m4a`
- 小程序实际读取的共享谱面：`miniprogram/assets/charts/ditto.editable.chart.js`
- 本地可视化谱面编辑器：`tools/chart-editor`
- Web 版运行目录：`web`

小游戏和编辑器现在共用同一份 chart 文件。也就是说，你在编辑器里点“保存谱面”之后，微信开发者工具重新编译，小程序里读到的就是刚改完的谱。

注意这里有一个边界：

- 你在编辑器里还没保存之前，改动只存在当前编辑器页面内，不会立刻写进小游戏。
- 只有点了“保存谱面”，共享 chart 文件才会真的被覆盖。

## 启动本地谱面编辑器

在项目根目录运行：

```bash
npm run chart:editor
```

然后打开：

```text
http://127.0.0.1:4317
```

编辑器功能：

- 播放歌曲并显示实时播放时间
- 单轨时间线可视化
- 圆点代表点按 note
- 长条代表长按 note
- 支持新增、删除、复制、拖动、修改开始时间、修改长按结束时间
- 支持撤销 / 重做
- 保存后直接写回共享谱面文件
- 每次保存会自动留一份本地备份到 `tools/chart-editor/backups`

编辑器里几个常用操作：

- 双击轨道：新增点按
- `Shift + 双击`：新增长按
- 拖动圆点或长条：改开始时间
- 拖动长按右侧把手：改结束时间
- `Cmd/Ctrl + Z`：撤销
- `Cmd/Ctrl + Shift + Z` 或 `Cmd/Ctrl + Y`：重做
- 空格：播放 / 暂停
- `Delete`：删除选中 note
- `Cmd/Ctrl + S`：保存

## 在微信开发者工具里跑小游戏

1. 安装微信开发者工具。
2. 选择“导入项目”。
3. 项目目录选择当前仓库根目录：

```text
/Users/yaohermione/Desktop/rhythm game
```

4. 如果只是先看本地模拟器，可以先用 `touristappid`。
5. 如果你要真机预览，把 [project.config.json](/Users/yaohermione/Desktop/rhythm game/project.config.json) 里的 `appid` 改成你注册好的小程序 AppID。
6. 导入后编译即可。

推荐联调方式：

1. 开着本地谱面编辑器，一边听歌一边调时间点。
2. 编辑器里保存。
3. 回到微信开发者工具重新编译。
4. 直接在小游戏里体验这一版谱子的手感。

## 启动 Web 版

Web 版在仓库根目录下的 `web` 文件夹内，和微信小程序目录平级。

```bash
cd web
npm install
npm run dev
```

本地默认打开：

```text
http://localhost:5173/
```

构建生产版本：

```bash
npm run build
```

部署到 Vercel 或 Netlify 时，项目根目录选择 `web`：

- Build command: `npm run build`
- Output directory: `dist`

## 当前主编辑入口

当前主流程已经切到“可视化编辑共享谱面文件”。如果只是继续打磨 Ditto 这首歌，优先直接改：

- 共享谱面：[miniprogram/assets/charts/ditto.editable.chart.js](/Users/yaohermione/Desktop/rhythm game/miniprogram/assets/charts/ditto.editable.chart.js)

## 关键文件

- 歌曲入口：[miniprogram/game/data/songs.js](/Users/yaohermione/Desktop/rhythm game/miniprogram/game/data/songs.js)
- 游戏页脚本：[miniprogram/pages/game/game.js](/Users/yaohermione/Desktop/rhythm game/miniprogram/pages/game/game.js)
- 判定逻辑：[miniprogram/game/core/engine.js](/Users/yaohermione/Desktop/rhythm game/miniprogram/game/core/engine.js)
- 音频控制：[miniprogram/game/core/audio.js](/Users/yaohermione/Desktop/rhythm game/miniprogram/game/core/audio.js)
- 渲染逻辑：[miniprogram/game/render/renderer.js](/Users/yaohermione/Desktop/rhythm game/miniprogram/game/render/renderer.js)
- 编辑器服务：[tools/chart-editor/server.js](/Users/yaohermione/Desktop/rhythm game/tools/chart-editor/server.js)
- 编辑器前端：[tools/chart-editor/public/app.js](/Users/yaohermione/Desktop/rhythm game/tools/chart-editor/public/app.js)
