# 城堡舞台像素设计系统摘要

## 1. 当前主系统是什么

当前微信小游戏的 UI 已经不是旧的“深蓝金边弹窗系统”，也不再只是单一暖金主题。

当前真正的主系统是：

- **Light / Dark 双主题的城堡舞台像素系统**
- `dark`: 夜晚蓝灰、深蓝面板、冷色传送门魔法
- `light`: 夕阳暖纸、深棕边框、橙金 CTA
- 首页、战斗页、结果页、加载态和暂停按钮都通过 `startTheme` 串联
- 兔子、方猪、城堡背景、羊皮纸结算和像素反馈共同构成同一个游戏世界

一句话总结：它更像一场可以在“夜晚蓝灰”和“夕阳暖纸”之间切换的像素城堡舞台演出，而不是一个套在游戏上的通用 UI 皮肤。

## 2. 主题事实

| 主题 | 真实含义 | 关键色 | 当前用途 |
| --- | --- | --- | --- |
| `dark` | 夜晚蓝灰主题 | `#6f86aa` / `#17233d` / `#4f668a` / `#325389` | 夜晚首页、深蓝曲目条、蓝灰 CTA、dark 战斗背景、冷色传送门星光、dark 暂停按钮 |
| `light` | 夕阳暖纸主题 | `#e8c08c` / `#582f28` / `#6b3418` / `#ee8d4a` / `#fff0d7` | 夕阳首页、暖纸曲目条、橙金 CTA、light 战斗背景、暖色加载和按钮 |

默认主题是 `dark`。旧别名映射：

- `night` -> `dark`
- `sunset` -> `light`

`startTheme` 是跨页面主题契约，必须贯穿：

```text
start -> game -> result -> start
```

## 3. 三层结构

### 世界观资产层

- 夜晚 / 夕阳首页背景
- 夜晚 / 夕阳战斗背景
- 像素云层、城堡、火把、余烬、传送门星光
- 兔子、方猪和观众角色

### UI 组件层

- 主题切换按钮
- 首页标题、曲目条、开始 CTA
- 加载 spinner 和像素字幕图
- Canvas 暂停按钮
- 羊皮纸结果页、状态标题、统计行、主 / 次按钮

### 玩法表现层

- HUD、生命心形、SCORE / COMBO 数字 sprite
- 猪猪音符、长按猪尾
- Perfect / Good / Miss 判定爆点
- 伤害红晕与 Game Over

## 4. 核心颜色

### Dark / 夜晚蓝灰

| 名称 | 色值 | 角色 |
| --- | --- | --- |
| 夜晚页面底 | `#6f86aa` | 页面底色、dark loading、暂停按钮面 |
| 夜晚深蓝 | `#17233d` | 深蓝面板、spinner、云层阴影、dark 暂停图标 |
| 蓝灰框线 | `#4f668a` | dark 曲目条外框、CTA 外框、云层主体 |
| 深蓝 CTA | `#325389` | dark 首页开始按钮 |
| 夜晚标题 | `#e8c08c` | dark 首页标题 |
| 夜晚亮字 | `#fff0d7` | dark 选中曲目和按钮文字 |
| 冷色星光 | `#f3fbff` / `#9fe4ff` / `#4db7ff` | dark 战斗页传送门魔法 |

### Light / 夕阳暖纸

| 名称 | 色值 | 角色 |
| --- | --- | --- |
| 暖纸底色 | `#e8c08c` | light 页面底色、loading、曲目条面 |
| 深棕框线 | `#582f28` | light 主边框、文字、图标 |
| CTA 深框 | `#6b3418` | light 主按钮外框 |
| CTA 橙面 | `#ee8d4a` | light 开始、结果页主行动 |
| 浅奶油金 | `#ecd2a6` | light 暂停按钮面 |
| 亮米白字 | `#fff0c7` / `#fff0d7` | 标题、按钮、高亮文案 |
| 暖色星光 | `#fff2b8` / `#ffd56f` / `#ffb24b` | light 战斗页传送门与余烬 |

### 结果页共享色

| 名称 | 色值 | 角色 |
| --- | --- | --- |
| 羊皮纸基底 | `#c59247` | 结果页背景 |
| 结果金框 | `#ddbc6c` | 结果主面板外框 |
| 结果奶油面 | `#fbeec2` | 结果主面板内面 |
| 状态金字 | `#ffcd2f` | COMPLETED / FULL COMBO / ALL PERFECT |
| 失败状态 | `#f77e67` | Faild |
| 次按钮面 | `#fff0d7` | 回到首页 |
| 主按钮面 | `#ee8d4a` | 再来一遍 |

说明：结果页主体是共享羊皮纸结算系统；`dark` 会叠加 `rgba(79, 102, 138, 0.15)` 蓝色 overlay，让夜晚主题轻微回流。

### 玩法反馈色

| 名称 | 色值 | 角色 |
| --- | --- | --- |
| Perfect | `#6EDE7D` / `#AEFAB8` | 强正反馈 |
| Good | `#8BDDFF` / `#68B8FF` / `#B7E1FF` | 次正反馈 |
| Miss | `#FF7F90` / `#ff8b98` | 失败反馈 |
| Damage | `rgba(255, 74, 98, 1)` | 伤害暗角 |

这些颜色服务玩法识别，不用于定义页面主基调。

## 5. 组件语法

### 首页 Title Screen

- 结构：主题背景 + 像素云层 + 主题切换按钮 + 兔猪角色 + 标题 + 曲目条 + 开始按钮
- `dark` 使用夜晚背景、深蓝曲目条、蓝灰 CTA
- `light` 使用夕阳背景、暖纸曲目条、橙金 CTA
- 标题应该像像素招牌或游戏封面字，不是冷色 logo badge

### 曲目条

- `dark`: 蓝灰外框 + 深蓝面 + 选中亮字
- `light`: 深棕外框 + 暖纸面 + 深棕字
- 选中态用兔子标记，不用 `已选择` 文案
- 比主 CTA 更轻，不和开始按钮抢重量

### 主 CTA

- `dark`: `#4f668a` 外框 + `#325389` 主面 + `#fff0d7` 字
- `light`: `#6b3418` 外框 + `#ee8d4a` 主面 + `#fff0d7` 字
- 质感像“舞台上的机关按钮”
- 文案短促明确，例如 `开始`

### 加载态

- `dark`: 背景 `#6f86aa`，spinner `#17233d`
- `light`: 背景 `#e8c08c`，spinner `#d6a461`
- 字幕图按主题选择：进入 / 回到魔法世界
- start / game / result 的 loading 必须保持同一套颜色逻辑

### 战斗页

- 背景按主题切换：`战斗场景dark.runtime.jpg` / `战斗场景light.runtime.jpg`
- 传送门星光按主题切换冷色或暖色
- HUD 保持低存在感：心形生命、金色标签、亮米白数字
- Perfect / Good / Miss 继续使用高识别反馈色

### 暂停与控制按钮

- `dark`: 深蓝外框 `#17233d` + 蓝灰面 `#6f86aa` + 深蓝 icon
- `light`: 深棕外框 `#582f28` + 浅奶油面 `#ecd2a6` + 深棕 icon
- Home / Replay / Play 保持统一 icon 语言
- 暂停遮罩使用 `rgba(10, 9, 15, 0.64)`

### 结果页

- 主体是羊皮纸庆典结算，不是深蓝结果弹窗
- 状态标题使用金色像素大字，失败态使用珊瑚红
- 面板是金框 + 奶油纸面
- 统计区当前是统计行，不是多色卡片墙
- 主按钮橙金，次按钮亮米白

## 6. 风格原则

- 背景和角色先建立世界，UI 再嵌入世界
- `dark` 是正式夜晚主题，不再被误判为历史残留
- `light` 是正式夕阳暖纸主题，不是唯一主系统
- 像素感要来自真实切角、块状云、sprite、像素字和离散星光
- 蓝灰 / 深蓝只能在夜晚主题与战斗语境中使用，不要扩展成通用 SaaS 面板
- 暖纸 / 橙金用于夕阳主题和主行动，不要滥用到所有控件
- 反馈色只服务玩法识别，不定义页面主色

## 7. 明确废弃

- 旧 Blue-Gold 文档作为新 UI 基线
- 首页中心 modal 式结构
- 通用深蓝结果弹窗
- 冷色玻璃态、SaaS 面板、霓虹科幻 glow
- 用系统文案替代角色标记的选择态

## 8. 当前唯一基线

后续如果要继续扩设计系统，请优先参考：

- [`docs/castle-stage-pixel-design-system.zh-CN.md`](/Users/yaohermione/Desktop/rhythm%20game/docs/castle-stage-pixel-design-system.zh-CN.md)
- [`docs/ui-design-system-summary.png`](/Users/yaohermione/Desktop/rhythm%20game/docs/ui-design-system-summary.png)
- [`miniprogram/utils/start-theme.js`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/utils/start-theme.js)
- [`miniprogram/pages/start/start.wxss`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/pages/start/start.wxss)
- [`miniprogram/pages/result/result.wxss`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/pages/result/result.wxss)
- [`miniprogram/game/render/renderer.js`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/game/render/renderer.js)
