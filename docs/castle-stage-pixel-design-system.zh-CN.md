# Castle Stage Pixel Design System / 城堡舞台像素设计系统

## 1. 文档定位

这份文档是当前微信小游戏 UI 的唯一现行主规范。

当前系统已经从早期的单一「暖金城堡」叙事，演进为 **Light / Dark 双主题的城堡舞台像素系统**：

- `dark`: 夜晚蓝灰主题，基于夜晚首页、深蓝面板、蓝灰框线和冷色魔法星光。
- `light`: 夕阳暖纸主题，基于夕阳首页、暖纸底色、深棕框线和橙金 CTA。

旧的 Blue-Gold 深蓝金边弹窗系统不再是默认 UI 基线；但蓝灰和深蓝并没有被完全禁用，它们已经被收编为 `dark` 夜晚主题、战斗场景和部分玩法层的正式语言。

适用范围：

- 首页 title screen
- 战斗页 / Canvas HUD / 暂停层
- 结果页 / 羊皮纸结算
- 过场加载态
- 音符、长按尾部、判定爆点、伤害暗角
- 世界观资产：城堡、云层、火把、传送门星光、兔子与方猪 sprite

不适用范围：

- 通用 SaaS 面板语言
- 冷色玻璃态和现代霓虹 UI
- 旧 Blue-Gold 文档中“深蓝弹窗 + 金边 trim”的默认页面框架

## 2. 当前真实事实来源

规范优先从活代码和活资产总结，而不是从历史文档倒推。

主题契约：

- [`miniprogram/utils/start-theme.js`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/utils/start-theme.js)

首页：

- [`miniprogram/pages/start/start.wxml`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/pages/start/start.wxml)
- [`miniprogram/pages/start/start.wxss`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/pages/start/start.wxss)
- `miniprogram/assets/images/首页夜晚版.runtime.jpg`
- `miniprogram/assets/images/首页夕阳版.runtime.jpg`

战斗页：

- [`miniprogram/pages/game/game.js`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/pages/game/game.js)
- [`miniprogram/pages/game/game.wxss`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/pages/game/game.wxss)
- [`miniprogram/game/render/renderer.js`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/game/render/renderer.js)
- `miniprogram/assets/images/战斗场景dark.runtime.jpg`
- `miniprogram/assets/images/战斗场景light.runtime.jpg`

结果页：

- [`miniprogram/pages/result/result.wxml`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/pages/result/result.wxml)
- [`miniprogram/pages/result/result.wxss`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/pages/result/result.wxss)
- `miniprogram/assets/images/透明羊皮纸完整版.runtime.png`

历史文档：

- [`docs/ui-blue-gold-style-guide.md`](/Users/yaohermione/Desktop/rhythm%20game/docs/ui-blue-gold-style-guide.md) 只作为迁移说明，不作为新 UI 设计依据。

## 3. 系统总览

### 3.1 核心气质

主气质必须同时满足以下四点：

- 城堡舞台：背景、火光、传送门、角色站位和像素面板都属于同一个舞台世界。
- 双主题：`dark` 是夜晚蓝灰，`light` 是夕阳暖纸，两者不是简单反色。
- 像素：像素感来自真实 sprite、块状云、像素字、切角面板、离散星光和网格化数字。
- 角色驱动：兔子和方猪不是装饰物，而是首页、玩法和结果页连续叙事的主角。

### 3.2 设计目标

UI 不是独立于游戏世界的 App 皮肤，而是嵌入世界观的游戏舞台系统：

- 背景和角色先建立空间。
- UI 像舞台道具一样进入空间。
- 主题色保持跨页面连续。
- 玩法反馈可以高饱和，但不能抢走页面主气氛。

### 3.3 三层模型

#### A. 世界观资产层

负责建立“我在哪儿”的感觉。

- 夜晚 / 夕阳首页背景
- 夜晚 / 夕阳战斗背景
- 城堡、云层、火把、传送门星光
- 兔子、方猪、观众角色

#### B. UI 组件层

负责建立“我要做什么”的感觉。

- 主题切换按钮
- 首页标题
- 曲目条
- 开始 CTA
- 结果面板
- 统计行
- 主 / 次按钮
- 加载字幕图
- 暂停 icon button

#### C. 玩法表现层

负责建立“这一拍发生了什么”的感觉。

- HUD
- 生命心形
- SCORE / COMBO 数字 sprite
- 猪猪音符
- 长按猪尾
- 判定爆点
- 伤害暗角
- Game Over 文案

规则：

- 世界观资产层优先决定整体气氛。
- UI 组件层服务于结构、层级和操作。
- 玩法表现层允许使用高识别反馈色，但这些颜色不能升级为页面主色。

## 4. 主题架构

### 4.1 主题枚举

当前代码的主题枚举只有两个：

| 主题 | 当前含义 | 旧别名 |
| --- | --- | --- |
| `dark` | 夜晚蓝灰主题 | `night` |
| `light` | 夕阳暖纸主题 | `sunset` |

默认主题是 `dark`。主题存储键为 `startThemeV1`。

### 4.2 跨页面主题契约

`startTheme` 是跨页面主题契约，不是首页局部状态。

主题必须沿以下路径保持连续：

```text
start -> game -> result -> start
```

实现要求：

- 首页读取或设置 `startTheme`。
- 进入战斗页时通过 query 和全局状态保持同一主题。
- 战斗页选择 `战斗场景dark.runtime.jpg` 或 `战斗场景light.runtime.jpg`。
- 结算 summary 必须写入 `startTheme`，结果页按该主题显示离场 loading 和 overlay。
- 从结果页回首页时继续带回同一主题。

### 4.3 Dark / 夜晚蓝灰主题

视觉意图：

- 夜晚城堡开场
- 蓝灰云层与深蓝面板
- 冷色魔法传送门星光
- 比 `light` 更安静、更夜色、更神秘

核心颜色：

| Token | 值 | 代码用途 |
| --- | --- | --- |
| `theme.dark.page` | `#6f86aa` | 页面底色、loading 背景 |
| `theme.dark.deep` | `#17233d` | 深蓝面板、spinner、云层阴影 |
| `theme.dark.frame` | `#4f668a` | 曲目条外框、CTA 外框、云层主体 |
| `theme.dark.cta` | `#325389` | 首页开始按钮面 |
| `theme.dark.title` | `#e8c08c` | 首页标题字 |
| `theme.dark.textSelected` | `#fff0d7` | 选中曲目、CTA 文字 |
| `theme.dark.textMuted` | `#4f668a` | 未选曲目 |
| `theme.dark.portalCore` | `#f3fbff` | 战斗页传送门星光核心 |
| `theme.dark.portalMid` | `#9fe4ff` | 战斗页传送门星光中间色 |
| `theme.dark.portalAccent` | `#4db7ff` | 战斗页传送门星光强调色 |

使用边界：

- 可以用于 `dark` 首页、战斗背景、加载态、暂停按钮、传送门星光。
- 可以用于夜晚主题下的曲目条和 CTA。
- 不要把它扩展为所有新 UI 的默认颜色。
- 不要回到旧式“通用深蓝弹窗 + 金边 trim”的页面框架。

### 4.4 Light / 夕阳暖纸主题

视觉意图：

- 夕阳城堡开场
- 暖纸底色和深棕像素框
- 橙金 CTA 与羊皮纸结算
- 比 `dark` 更温暖、更庆典、更舞台仪式感

核心颜色：

| Token | 值 | 代码用途 |
| --- | --- | --- |
| `theme.light.page` | `#e8c08c` | 页面底色、loading 背景 |
| `theme.light.spinner` | `#d6a461` | loading spinner |
| `theme.light.frame` | `#582f28` | 深棕边框、正文、图标 |
| `theme.light.frameStrong` | `#6b3418` | CTA 外框 |
| `theme.light.panel` | `#e8c08c` | 首页曲目条面 |
| `theme.light.panelRaised` | `#ecd2a6` | 暂停按钮面 |
| `theme.light.cta` | `#ee8d4a` | 主行动按钮面 |
| `theme.light.textInverse` | `#fff0d7` | CTA 文字、亮字 |
| `theme.light.textMuted` | `rgba(122, 79, 44, 0.86)` | loading fallback 文案 |

使用边界：

- 用于 `light` 首页、loading、CTA、结果页按钮和暖纸 UI。
- 深棕必须承担框线、图标和主文案角色。
- 橙金只用于主行动，不要把所有小控件都刷成 CTA 色。

### 4.5 结果页共享结算系统

结果页当前不是完全独立的 Dark / Light 双套 UI。它以羊皮纸素材和暖金结算面板为主，两种主题共享主体结构：

| Token | 值 | 用途 |
| --- | --- | --- |
| `result.parchmentBase` | `#c59247` | 羊皮纸背景基底 |
| `result.panelFrame` | `#ddbc6c` | 结果面板外框 |
| `result.panelFace` | `#fbeec2` | 结果面板内面 |
| `result.textPrimary` | `#582f28` | 数字、正文、深色图形 |
| `result.textBrown` | `#654915` | 歌名、按钮框 |
| `result.statusGold` | `#ffcd2f` | COMPLETED / FULL COMBO |
| `result.statusGoldShadow` | `#8f4a19` | 状态标题阴影 |
| `result.statusFail` | `#f77e67` | Faild |
| `result.statusFailShadow` | `#8f3b2b` | Faild 阴影 |
| `result.buttonSecondary` | `#fff0d7` | 次按钮面 |
| `result.buttonPrimary` | `#ee8d4a` | 主按钮面 |

`dark` 主题结果页会额外叠加 `rgba(79, 102, 138, 0.15)` 的蓝色 overlay，让夜晚主题回流到结算页，但不改变羊皮纸主结构。

## 5. Token 架构

本系统采用三层 token：

1. `primitive`: 原始颜色与基础数值
2. `semantic`: 带语义的界面角色
3. `component`: 具体组件使用位

### 5.1 Primitive Tokens

#### Dark 主题原始色

| Token | 值 | 说明 |
| --- | --- | --- |
| `color.night.blueGray.1` | `#6f86aa` | 夜晚页面底、loading 背景 |
| `color.night.blueGray.2` | `#4f668a` | 蓝灰框线、云层主体 |
| `color.night.deep.1` | `#17233d` | 深蓝面、spinner、云层阴影 |
| `color.night.deep.2` | `#325389` | 深蓝 CTA 面 |
| `color.night.magic.1` | `#f3fbff` | 冷色传送门星光核心 |
| `color.night.magic.2` | `#9fe4ff` | 冷色传送门星光中段 |
| `color.night.magic.3` | `#4db7ff` | 冷色传送门星光强调 |

#### Light 主题原始色

| Token | 值 | 说明 |
| --- | --- | --- |
| `color.paper.warm.1` | `#e8c08c` | 暖纸底色、light loading |
| `color.paper.warm.2` | `#f5d490` | 更亮的庆典底色 |
| `color.panel.cream.1` | `#e7c394` | 传统奶油金面 |
| `color.panel.cream.2` | `#ecd2a6` | 暂停按钮面、提亮层 |
| `color.ink.brown.1` | `#582f28` | 深棕边框、文字、图标 |
| `color.ink.brown.2` | `#6b3418` | CTA 外框、强调深边 |
| `color.cta.orange.1` | `#ee8d4a` | CTA 主色 |
| `color.text.light.1` | `#fff0c7` | 标题亮字 |
| `color.text.light.2` | `#fff0d7` | 按钮亮字、结果次按钮 |

#### 世界观与结果页辅助色

| Token | 值 | 说明 |
| --- | --- | --- |
| `color.world.torch.gold` | `#ffb24b` | 火焰、余烬、light 魔法星光 |
| `color.world.torch.glow` | `#fff2b8` | 火把与星光亮芯 |
| `color.world.spark.mid` | `#ffd56f` | 暖色星光中段 |
| `color.world.spark.trail` | `#ffcf79` | 暖色星光拖尾 |
| `color.world.stone.warm` | `#8f6b52` | 石墙与低对比辅助文案 |
| `color.sky.orange` | `#d6a461` | light loading spinner |
| `color.result.parchment` | `#c59247` | 羊皮纸背景基底 |
| `color.result.frame` | `#ddbc6c` | 结果面板金框 |
| `color.result.face` | `#fbeec2` | 结果面板面 |

#### 玩法反馈色

| Token | 值 | 说明 |
| --- | --- | --- |
| `color.feedback.perfect` | `#6EDE7D` | Perfect 文案 |
| `color.feedback.perfectBright` | `#AEFAB8` | Perfect 爆点亮面 |
| `color.feedback.good` | `#8BDDFF` | Good 文案 |
| `color.feedback.goodCanvas` | `#68B8FF` | Good 爆点主色 |
| `color.feedback.goodBright` | `#B7E1FF` | Good 爆点亮面 |
| `color.feedback.miss` | `#FF7F90` | Miss 文案 |
| `color.feedback.missCanvas` | `#ff8b98` | Miss 爆点主色 |
| `color.feedback.damage` | `rgba(255, 74, 98, 1)` | 伤害暗角基色 |

### 5.2 Semantic Tokens

| Token | Dark | Light |
| --- | --- | --- |
| `surface.page` | `#6f86aa` | `#e8c08c` |
| `surface.loading` | `#6f86aa` | `#e8c08c` |
| `loading.spinner` | `#17233d` | `#d6a461` |
| `loading.spinnerTrack` | `rgba(23, 35, 61, 0.22)` | `rgba(214, 164, 97, 0.2)` |
| `title.primary` | `#e8c08c` | `#fff0c7` |
| `panel.frame` | `#4f668a` | `#582f28` |
| `panel.face` | `#17233d` | `#e8c08c` |
| `cta.frame` | `#4f668a` | `#6b3418` |
| `cta.face` | `#325389` | `#ee8d4a` |
| `cta.text` | `#fff0d7` | `#fff0d7` |
| `pause.frame` | `#17233d` | `#582f28` |
| `pause.face` | `#6f86aa` | `#ecd2a6` |
| `pause.icon` | `#17233d` | `#582f28` |
| `portal.core` | `#f3fbff` | `#fff2b8` |
| `portal.mid` | `#9fe4ff` | `#ffd56f` |
| `portal.accent` | `#4db7ff` | `#ffb24b` |

### 5.3 Component Tokens

以下命名固定保留，用于后续继续整理代码或文档：

- `start.themeToggle.iconBg`
- `start.cloud.body`
- `start.cloud.highlight`
- `start.cloud.shadow`
- `start.title.text`
- `start.songPanel.frame`
- `start.songPanel.face`
- `start.songRow.text`
- `start.songRow.selectedText`
- `start.songRow.mark`
- `start.cta.frame`
- `start.cta.face`
- `start.cta.text`
- `game.loading.background`
- `game.loading.spinner`
- `game.scene.background`
- `game.portal.core`
- `game.portal.mid`
- `game.portal.accent`
- `game.pause.frame`
- `game.pause.face`
- `game.pause.icon`
- `hud.heart.filled`
- `hud.score.label`
- `hud.score.value`
- `note.pig.base`
- `note.holdTail.base`
- `fx.impact.perfect`
- `fx.impact.good`
- `fx.impact.miss`
- `fx.damage.vignette`
- `result.background.parchment`
- `result.panel.frame`
- `result.panel.face`
- `result.status.completed`
- `result.status.failed`
- `result.stat.perfect`
- `result.stat.good`
- `result.stat.miss`
- `result.stat.combo`
- `result.button.primary`
- `result.button.secondary`

## 6. 世界观资产层规范

### 6.1 首页背景

`dark` 使用 `首页夜晚版.runtime.jpg`，`light` 使用 `首页夕阳版.runtime.jpg`。

规则：

- 背景必须是第一视觉信号，不要被中心 modal 遮住。
- `dark` 允许蓝灰夜色、深蓝云层和更低亮度的标题。
- `light` 允许暖橙天空、暖纸标题和深棕 UI。
- 背景之上保留轻微 veil 和底部压暗，保证角色与 UI 可读。

禁用：

- 抽象渐变替代城堡背景。
- 科幻霓虹背景。
- 通用 App landing page 式上文下图结构。

### 6.2 云层

云层由代码生成块状像素云，并根据主题换色。

| 部位 | Dark | Light |
| --- | --- | --- |
| body | `#4f668a` | `#d9965c` |
| highlight | `#6f86aa` | `#f0bd70` |
| shadow | `#17233d` | `#a85d50` |

规则：

- 运动应慢漂浮、轻摆动、微缩放。
- 云层是世界气氛，不是主 UI 控件。
- 不要使用现代烟雾、玻璃 blur 或过快漂移动效。

### 6.3 战斗背景

战斗页按主题选择不同背景：

- `dark`: `战斗场景dark.runtime.jpg`
- `light`: `战斗场景light.runtime.jpg`

规则：

- 战斗背景是玩法空间的主承载。
- 火把余烬、传送门星光、角色站位必须与背景透视一致。
- Canvas fallback 只作为兜底，不作为视觉基线。

### 6.4 火把与余烬

规则：

- 火焰允许暖橙到浅金的像素 glow。
- 余烬应轻量、稀疏、上升。
- 颜色以 `#ffb24b`、`#fff2b8`、`#ffcf79` 为主。
- 不要做成现代粒子烟花特效。

### 6.5 传送门星光

传送门星光在 `dark` / `light` 中有不同色相：

| 部位 | Dark | Light |
| --- | --- | --- |
| core | `#f3fbff` | `#fff2b8` |
| mid | `#9fe4ff` | `#ffd56f` |
| accent | `#4db7ff` | `#ffb24b` |
| trail | `#b9ecff` | `#ffcf79` |

规则：

- 星光是“魔法传送门”的世界观特效。
- 形状应保持小尺度、离散、像素化。
- 不要变成大面积柔雾光球。

### 6.6 角色

角色职责：

- 兔子：主动、魔法、舞台引导。
- 方猪：被动、被追逐、带冲突喜感。

规则：

- 首页、玩法、结果页应保持角色语言连续。
- 角色阴影必须贴合地面和站位。
- 可爱，但不做幼儿向表情包化处理。
- `dark` 使用暗色标题帧资源，`light` 使用常规标题帧资源。

## 7. UI 组件层规范

### 7.1 首页 Title Screen

视觉意图：

- 标题是舞台中心，不是普通 logo badge。
- 世界先出现，UI 再进入。

结构：

1. 主题化城堡背景
2. 主题化像素云层
3. 压暗 veil
4. 主题切换按钮
5. 双角色舞台站位
6. 像素标题字
7. 曲目条
8. 开始按钮

颜色：

- `dark`: 标题 `#e8c08c`，曲目外框 `#4f668a`，面 `#17233d`，CTA 面 `#325389`。
- `light`: 标题 `#fff0c7`，曲目外框 `#582f28`，面 `#e8c08c`，CTA 面 `#ee8d4a`。

禁用：

- 冷蓝徽章式标题。
- 居中单 modal 框住所有元素。
- 现代 App landing page 排版。

### 7.2 主题切换按钮

视觉意图：

- 轻量切换，不抢首页主视觉。

当前实现：

- 位置：右上角。
- `dark` 显示 sun icon，背景 `rgba(255, 255, 255, 0.2)`。
- `light` 显示 moon icon，背景 `rgba(0, 0, 0, 0.2)`。

规则：

- 只承担主题切换，不加说明性长文案。
- icon 必须清晰，按钮大小保持轻量。
- 不要做成大号设置按钮。

### 7.3 曲目条

视觉意图：

- 像舞台上的节目选择牌。

结构：

1. 像素切角外框
2. 主题化面板面
3. 像素歌名
4. 右侧兔子标记

颜色：

- `dark`: 外框 `#4f668a`，面 `#17233d`，未选文字 `#4f668a`，选中文字 `#fff0d7`。
- `light`: 外框 `#582f28`，面 `#e8c08c`，文字 `#582f28`。

规则：

- 曲目条比 CTA 更轻。
- 选中态优先用兔子标记，不用 `已选择` 文案。
- 不用蓝色外发光表达选中。

### 7.4 主 CTA

视觉意图：

- 像舞台机关或开场按钮。

结构：

1. 像素切角外框
2. 主题化主面
3. 明亮像素文字

颜色：

- `dark`: 外框 `#4f668a`，面 `#325389`，字 `#fff0d7`。
- `light`: 外框 `#6b3418`，面 `#ee8d4a`，字 `#fff0d7`。

规则：

- 比曲目条更厚、更亮、更重。
- 文案短促明确，优先两到四字动作。
- 不使用细边 outline button 或长说明型 CTA。

### 7.5 加载态

视觉意图：

- 明确告知“进入 / 回到魔法世界”的过场动作。

结构：

1. 主题背景色
2. 主题 spinner
3. 像素字幕图

颜色：

| 部位 | Dark | Light |
| --- | --- | --- |
| background | `#6f86aa` | `#e8c08c` |
| spinner | `#17233d` | `#d6a461` |
| spinner track | `rgba(23, 35, 61, 0.22)` | `rgba(214, 164, 97, 0.2)` |

规则：

- start / game / result 的过场 loading 必须共用这套颜色逻辑。
- `进入魔法世界` 和 `回到魔法世界` 的图片要按主题选择。
- 不要每页发明不同 loading 色和文案语气。

### 7.6 结果页主面板

视觉意图：

- 不是成绩弹窗，而是舞台演出后的羊皮纸庆典结算。

结构：

1. 羊皮纸背景素材
2. 暖金闪光
3. 兔子角色立于面板上方
4. 金色状态标题
5. 奶油面板与像素数字
6. 主 / 次操作按钮

规则：

- 主体使用羊皮纸暖金系统，两种主题共享。
- `dark` 可以叠加轻微蓝色 overlay，但不把结果页改回深蓝弹窗。
- 结果页按钮继续使用像素切角结构。

禁用：

- 大面积蓝黑半透明结果面板。
- 现代圆角统计 dashboard。

### 7.7 统计信息

当前结果页统计不是彩色卡片，而是羊皮纸面板内的统计行。颜色用于标签和等级：

| 类型 | 色值 | 用途 |
| --- | --- | --- |
| Perfect | `#37a348` / `#8ed881` | 统计标签 / mint rank |
| Good | `#6990bc` / `#89c8ff` | 统计标签 / sky rank |
| Miss | `#d85a67` / `#f28a95` | 统计标签 / rose rank |
| Combo | `#ca7d23` | 统计标签 |
| Violet rank | `#c59ff5` | 特殊 rank 色 |
| Prism rank | `#ffcf4d` | 特殊 rank 色 |

规则：

- 彩色只用于读数分类和等级强调。
- 数字主体仍保持深棕像素字。
- 不要把统计区变成多色卡片墙。

### 7.8 暂停与控制按钮

视觉意图：

- 像主题化像素工具钮，不抢走玩法世界观。

当前 Canvas 暂停按钮：

| 部位 | Dark | Light |
| --- | --- | --- |
| outer | `#17233d` | `#582f28` |
| face | `#6f86aa` | `#ecd2a6` |
| icon | `#17233d` | `#582f28` |
| shadow | `rgba(23, 35, 61, 0.24)` | `rgba(88, 47, 40, 0.18)` |

规则：

- Home / Replay / Play 三类 icon 保持统一线重和填充语言。
- `dark` 暂停按钮使用夜晚蓝灰，不是历史残留。
- `light` 暂停按钮使用暖色线框。
- 暂停遮罩使用 `rgba(10, 9, 15, 0.64)`。

## 8. 玩法表现层规范

### 8.1 HUD

视觉意图：

- 低存在感、高可读性。

当前实现：

- 心形生命：粉红像素心。
- SCORE / COMBO 标签：金色像素字。
- 数值：亮米白数字 sprite。
- 暂停键：小尺寸像素 plate。

规则：

- HUD 属于玩法信息层，视觉优先级低于世界观层。
- 不要把 HUD 放大成页面主视觉。
- HUD 可以保留旧金色文字常量，因为它服务战斗可读性。

### 8.2 猪猪音符与长按猪尾

规则：

- 音符不是抽象圆点，而是具像化的小猪对象。
- 长按尾部必须像同一个生物的延展，不是普通能量条。
- 高亮与边缘色统一来自猪猪配色。
- Miss 音符与兔子遮挡关系必须保持空间层级。

### 8.3 判定爆点

视觉意图：

- 像兔子的魔法击中与像素火花，而不是 UI 粒子爆炸。

映射：

| 判定 | 文案主色 | 爆点主色 | 亮面 |
| --- | --- | --- | --- |
| Perfect | `#6EDE7D` | `#6EDE7D` | `#AEFAB8` |
| Good | `#8BDDFF` | `#68B8FF` | `#B7E1FF` |
| Miss | `#FF7F90` | `#ff8b98` | `#fff0f2` |
| Hold | `#ffd85d` | `#47dfcf` | `#fff4d8` |

规则：

- Perfect / Good / Miss 必须高识别。
- 形状优先星点、像素条、法术束和块状爆点。
- 不做现代柔雾辉光球。

### 8.4 伤害暗角与 Game Over

规则：

- 伤害暗角使用红粉系 vignette，从边缘和四角进入。
- 中央信息必须保持可读。
- Game Over 使用 `#FF7F90`，遮罩使用深红黑色。
- 不要把失败态改成通用 modal。

## 9. 字体与文案语气

### 9.1 字体策略

- 像素字优先。
- 中文与英文都需要保持游戏标题卡语气。
- 英文偏招牌、标签、街机标题。
- 中文偏像素提示牌和剧情指示牌。

当前关键文案：

- 首页标题：`Bunnies / 爆锤方猪`
- CTA：`开始`
- 加载：`进入魔法世界`、`回到魔法世界`
- 结果状态：`COMPLETED`、`FULL COMBO`、`ALL PERFECT`、`Faild`
- 结果按钮：`回到首页`、`再来一遍`
- 战斗反馈：`PERFECT`、`GOOD`、`MISS`、`GAME OVER`

规则：

- 主行动文案短。
- 结果状态允许夸张，但必须像像素标题。
- 避免产品说明式、教程式、SaaS 式语气。

## 10. 动效原则

- 首页云层：慢漂浮、轻摆动、微缩放。
- 首页角色：小幅呼吸与帧动画。
- 战斗页：火把闪烁、余烬上升、传送门星光闪烁。
- 判定：短促、有力、像素化。
- 加载：稳定 spinner + 字幕图。

禁用：

- 大面积现代玻璃 blur。
- 快速夸张的卡通过场。
- 不受主题约束的霓虹 glow。
- 会遮挡玩法判定区的装饰动效。

## 11. 迁移与维护判断

### 11.1 保留并升格

- `startTheme` 跨页面主题契约。
- 首页夜晚 / 夕阳双背景。
- 主题化云层。
- 主题化曲目条和 CTA。
- 战斗页双背景。
- 结果页羊皮纸结算系统。
- 像素加载字幕图。
- 兔子、方猪、观众角色叙事。

### 11.2 保留但限定边界

- 蓝灰 / 深蓝：正式属于 `dark` 夜晚主题和战斗层，不再作为泛用弹窗系统。
- Perfect / Good / Miss：正式属于玩法反馈层，不作为页面主色。
- HUD sprite：正式属于玩法信息层，不需要改造成暖纸按钮。
- 旧 `UI_PANEL_BLUE` 等命名：可后续重命名，但当前颜色仍服务战斗页可读性。

### 11.3 明确废弃

- 旧 Blue-Gold 文档作为新 UI 基线。
- 首页中心 modal 式结构。
- 通用深蓝结果弹窗。
- 冷色玻璃态和 SaaS 风卡片。
- 用“已选择”等系统文案替代兔子标记。

## 12. 当前唯一基线

后续继续扩展设计系统时，请优先参考：

- [`docs/castle-stage-pixel-design-system.zh-CN.md`](/Users/yaohermione/Desktop/rhythm%20game/docs/castle-stage-pixel-design-system.zh-CN.md)
- [`docs/ui-design-system-summary.zh-CN.md`](/Users/yaohermione/Desktop/rhythm%20game/docs/ui-design-system-summary.zh-CN.md)
- [`docs/ui-design-system-summary.png`](/Users/yaohermione/Desktop/rhythm%20game/docs/ui-design-system-summary.png)
- [`miniprogram/utils/start-theme.js`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/utils/start-theme.js)
- [`miniprogram/pages/start/start.wxss`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/pages/start/start.wxss)
- [`miniprogram/pages/result/result.wxss`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/pages/result/result.wxss)
- [`miniprogram/game/render/renderer.js`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/game/render/renderer.js)
