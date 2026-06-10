# 二期迭代

This ExecPlan is a living document. Keep it updated as work proceeds.

## Purpose / Big Picture

本计划记录 `web` 主线进入二期迭代后的功能进展。

二期迭代的核心方向是：从单曲体验扩展到多歌曲、多难度，并让首页歌曲选择和谱面编辑器都能支持新的歌曲结构。完成后，玩家可以在首页选择不同歌曲和难度；开发时也可以在谱面编辑器里选择具体歌曲/难度进行编辑，而不是继续把编辑目标写死在 Ditto 上。

## Progress

- [x] 新增歌曲 `Super Shy`。
  - 已加入 Web 主线歌曲列表。
  - `Super Shy` 当前分为两个难度：普通和困难。
  - 2026-06-10 用户确认：`Super Shy` 两个谱面先保持当前版本。
- [x] 首页歌曲选择面板支持多歌曲/多难度。
  - 首页前端已经为新增歌曲做了对应修改。
  - 歌曲选择面板已支持上下滑动，避免歌曲和难度变多后挤压首屏布局。
- [x] 谱面编辑器支持选择歌曲/谱面。
  - 旧实现默认围绕 Ditto，编辑目标相对写死。
  - 当前编辑器已经可以选择某一首歌及其对应谱面进行编辑。
  - 这让后续继续维护 `Super Shy` 两个难度谱面更方便。
- [x] 结果页/战报证书已开始接入歌曲难度显示。
  - 当前结果 summary 已带 `songDifficultyLabel`。
  - 战报证书区域已能在歌曲名下方展示难度。
- [x] 统一 `Super Shy` 难度命名为普通 / 困难。
  - Web 前台选歌使用“普通 / 困难”。
  - 谱面编辑器里的 `Super Shy` 标签也同步为“普通 / 困难”。
- [x] 本期前台隐藏 `OMG`。
  - 2026-06-10 用户确认：`OMG` 先不发布，谱面需要较多调整。
  - Web 前台选歌曲入口先不展示 `OMG`。
- [ ] 修复和验收首页多难度选中态 UI。
  - 当前重点关注：选中 `Super Shy` 时，选中态兔子是否会被两个难度按钮挡住。
  - 需要在移动端竖屏下确认歌曲行、难度按钮和选中标记的层级/布局稳定。
- [ ] 在战斗页 HUD 补齐当前难度显示。
  - 当前歌曲已经有难度概念，但战斗页 HUD 仍主要展示歌曲名。
  - 需要确认难度显示位置，避免遮挡封面、暂停按钮、血量和判定信息。
- [ ] 确认结果页普通界面是否也需要显示难度，并按确认结果补齐。
  - 战报证书已开始显示难度，但普通结果页歌曲区域是否也展示难度仍需确认。
  - 如果显示，需要同步考虑分享战报、截图导出和移动端排版。
- [ ] 继续调校 `Super Shy` 两个难度谱面。
  - 当前谱面来自外部谱面的导入/转换，已经压缩成当前游戏的一轨下落玩法。
  - note 密度、节奏重点、方向分布和手感都还需要人工精修。
- [ ] 精修 `OMG` 谱面。
  - `OMG` 不进入本次前台发布。
  - 后续需要重新调整谱面细节、手感和可玩性，再考虑是否纳入正式选歌。
- [x] 完成二期 Web 构建。
  - 2026-06-10 已在 `web` 目录运行 `npm run build`，构建通过。
- [ ] 完成二期移动端 smoke test。

## Surprises and Discoveries

- 多歌曲二期已经从 `Super Shy` 扩展出 `OMG` 的本地候选方向，但 `OMG` 不进入本次前台发布；相关候选谱面需要继续精修。
- 导入谱面不能等同于最终谱面。部分谱面来自多轨或其他玩法格式，转换成当前一轨下落玩法后，需要继续人工调 note 密度、节奏重点、方向分布和手感。
- 当前 Web 前台难度命名先统一为“普通 / 困难”；单难度歌曲在前台也可以显示为“普通”，以保持首页、战斗页、结果页和战报证书的信息一致。

## Decision Log

- 2026-06-07: 将二期迭代单独记录为计划文件，方便后续持续追加多歌曲、多难度和编辑器相关进展。
- 2026-06-07: 二期迭代默认仍聚焦 `web` 主线；`miniprogram` 不作为当前发布目标，`web-parkour` 仍是旁线项目。

## Outcomes and Retrospective

任务仍在进行中。等二期迭代阶段完成后，在这里记录最终上线范围、验证结果、剩余风险和下一阶段建议。

## Context and Orientation

当前相关目录和文件：

- `web/src/game/songs.js`：Web 主线歌曲列表，当前前台只发布 Ditto 和 Super Shy；OMG 先隐藏。
- `web/src/screens/StartScreen.jsx`：首页歌曲选择 UI 和交互。
- `web/src/screens/startScreenData.js`：首页歌曲选择面板的数据组织。
- `shared/charts/supershy.easy.editable.chart.json`：`Super Shy` 简单难度谱面源数据。
- `shared/charts/supershy.normal.editable.chart.json`：`Super Shy` 中等难度谱面源数据。
- `shared/charts/supershy.easy.editable.chart.js`：从 shared JSON 同步出来的简单难度消费文件。
- `shared/charts/supershy.normal.editable.chart.js`：从 shared JSON 同步出来的中等难度消费文件。
- `web/src/game/supershy.easy.editable.chart.js`：Web 侧简单难度谱面消费文件。
- `web/src/game/supershy.normal.editable.chart.js`：Web 侧中等难度谱面消费文件。
- `web/public/assets/charts/supershy.easy.editable.chart.js`：Web public 下的简单难度谱面消费文件。
- `web/public/assets/charts/supershy.normal.editable.chart.js`：Web public 下的中等难度谱面消费文件。
- `web/public/assets/audio/super-shy.mp3`：`Super Shy` 音频资源。
- `web/public/assets/images/song-covers/supershy.cover.pixel.png`：`Super Shy` 像素风封面资源。
- `tools/chart-editor/server.js`：谱面编辑器服务端谱面目录和读写逻辑。
- `tools/chart-editor/public/app.js`：谱面编辑器前端选择歌曲/难度和编辑交互。
- `tools/chart-editor/public/index.html`：谱面编辑器选择器入口。
- `tools/chart-editor/public/styles.css`：谱面编辑器选择器样式。

## Plan of Work

后续二期迭代可以继续按以下方向推进：

1. 完善 `Super Shy` 两个难度的谱面手感和 timing。
2. 保持本期前台只发布 Ditto 和 Super Shy；`OMG` 暂不进入前台选歌。
3. 检查首页多歌曲选择在移动端竖屏下的触摸、滚动、选中态和视觉层级。
4. 检查切换歌曲/难度后，战斗页、暂停页、结算页和分享战报是否都显示正确歌曲信息。
5. 检查谱面编辑器保存不同歌曲/难度时，不会写错目标文件。
6. 补齐新增中文 UI 文案对应的中文像素字体子集。
7. 完成二期功能后，做一次 Web 主线构建和移动端 smoke test。

## Concrete Steps

常用检查命令：

```bash
cd web
npm run build
```

启动主 Web 原型：

```bash
cd web
npm run dev
```

启动谱面编辑器：

```bash
npm run chart:editor
```

编辑器默认地址：

```text
http://127.0.0.1:4317
```

## Validation and Acceptance

二期迭代阶段的验收重点：

- 首页能看到 Ditto 和 Super Shy。
- Super Shy 能选择普通和困难两个难度，并能进入战斗页。
- 本期前台不展示 `OMG`。
- 首页歌曲选择面板在手机竖屏下可以上下滑动，文字、按钮、难度标签、选中态兔子和封面不溢出、不互相遮挡。
- 切换歌曲/难度后，战斗页 HUD、暂停恢复、结算页、分享战报都使用正确歌曲信息和难度信息。
- 谱面编辑器可以选择 Ditto、Super Shy 普通、Super Shy 困难，并能正确加载对应音频和谱面。
- 谱面编辑器保存时写入正确的 shared 源文件和 Web 消费文件。
- 新增中文文案没有字体缺字、字体 fallback 或布局溢出。

## Idempotence and Recovery

- 如果任务中断，下一位 agent 应先阅读本文件的 `Progress`、`Context and Orientation` 和 `Decision Log`。
- 谱面源数据以 `shared/charts/*.editable.chart.json` 为准；端侧 `.js` 文件一般视为同步产物。
- 编辑器保存前后应确认当前选中的歌曲和难度，避免把 Super Shy 的谱面保存到 Ditto，或把普通/困难难度互相覆盖。
- `OMG` 相关候选谱面、音频和预览资源暂不进入本次提交；等后续明确精修和发布范围后再纳入项目。
- 运行构建或编辑器验证前，先检查工作区状态，避免把无关预览产物、测试输出或 debug 文件混入提交。
