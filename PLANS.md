# Phaser 迁移与 CDN 加速规划

## 背景

当前 Web 主线在 `web` 目录，技术形态是 React/Vite 外壳 + 自研 Canvas 游戏引擎。

现状关键文件：

- `web/src/App.jsx`：页面状态、懒加载、音频预热、开始/游戏/结算/支持页切换。
- `web/src/screens/GameScreen.jsx`：React 中挂载 `<canvas>`，创建和销毁 `GameRunner`。
- `web/src/game/GameRunner.js`：游戏生命周期、输入、音频、暂停、结算回调。
- `web/src/game/renderer.js`：自研 Canvas 渲染层，当前最大、最复杂的迁移对象。
- `web/src/game/engine.js`：节奏判定、计分和游戏状态更新。
- `web/src/game/AudioControllerWeb.js`：WebAudio、手机音频解锁、页面生命周期恢复。
- `shared/charts/ditto.editable.chart.json`：谱面 source-of-truth。

用户目标：

1. 最终将游戏主体完整迁移到 Phaser。
2. 同时优化 CDN 和浏览器缓存，让手机端打开速度明显变快。
3. 体验目标是“尽量 1 秒内看到首页”，游戏主体在点击开始后再加载。

## 总体判断

Phaser 适合这个项目的 2D Web 游戏方向，但它不是首屏加载慢的银弹。

迁移收益：

- 用 Phaser Scene 管理游戏阶段，替代当前手写的大型 `GameRunner + renderer` 组合。
- 用 Phaser Loader / Texture / Animation / Input / Scale 管理资源、纹理、动画和输入。
- 渲染逻辑更接近游戏工程，后续加歌曲、关卡、特效和低端机降级会更顺。

迁移风险：

- `renderer.js` 约 7000 行，视觉细节很多，完整迁移不是小修。
- 音游对音频时钟敏感，第一版不要直接切到 Phaser Sound，建议继续复用 `AudioControllerWeb`。
- Phaser 本身会增加一个游戏运行时 chunk，如果放进首屏，可能反而变慢。
- CDN / 资源体积 / 跨境链路仍然是手机慢加载的核心变量。

核心策略：

- 首页继续极轻量，Phaser 只在点击“开始”或空闲预加载时加载。
- `engine.js`、谱面数据、结果计算、现有 WebAudio 控制器先保留。
- 先做 Phaser spike 验证，再正式迁移，不一次性重写全部游戏。

## 目标体验

### P0 性能目标

- 首屏可见：CDN 命中时，主流手机 4G/5G 下尽量小于 1 秒看到首页画面。
- 首屏阻塞资源：只允许 HTML、关键 CSS、极少量首屏图片和必要字体。
- 首屏不加载 Phaser runtime。
- 首屏不加载完整游戏场景、谱面大资源、战斗背景、结果页导出库。
- `/assets/*` 使用长缓存和 immutable。
- `index.html` 不缓存或短缓存。

### P1 游戏目标

- 点击开始后进入 Phaser 游戏场景。
- 音频时钟和判定手感保持当前版本水平。
- 中端手机稳定接近 60 FPS。
- 低端手机允许自动降低 DPR / 特效密度，但不能明显糊到不可玩。
- 结果页、重玩、回首页、支持页继续正常。

### P2 产品目标

- 后续新增歌曲、角色动作、命中特效和场景时，不再继续扩大 `renderer.js`。
- 能通过 Phaser Scene 清晰拆分 Boot / Preload / Game / Hud / Pause / ResultBridge。
- 资源命名、缓存和 CDN 规则稳定，部署可重复。

## 目标架构

建议最终结构：

```text
web/src/
  App.jsx
  screens/
    StartScreen.jsx
    ResultScreen.jsx
    SupportScreen.jsx
    GameScreen.jsx              # React wrapper，只负责挂载 Phaser
  game/
    engine.js                   # 保留，节奏判定 source-of-truth
    result.js                   # 保留，结算计算
    AudioControllerWeb.js       # 保留，第一版继续作为音频 source-of-truth
    songs.js
  game-phaser/
    createPhaserGame.js
    phaserConfig.js
    assetManifest.js
    scenes/
      BootScene.js
      PreloadScene.js
      GameScene.js
      HudScene.js
      PauseScene.js
    systems/
      RhythmBridge.js           # Phaser update loop 与 engine/audio 的桥
      InputBridge.js
      LayoutSystem.js
      EffectsSystem.js
      SpriteFactory.js
```

React 仍然可以保留外层页面路由和结算分享能力。所谓“完整迁移到 Phaser”建议分两步理解：

1. 游戏主体完整迁移：战斗场景、HUD、输入、动画、暂停、结果触发全部由 Phaser 承担。
2. 如果后续仍想统一技术栈，再考虑把 StartScreen / ResultScreen 的展示也迁到 Phaser Scene。

## 分阶段计划

### Phase 0：CDN 与首屏急救

目标：在不等 Phaser 的情况下，先让手机打开速度明显变好。

任务：

- 绑定正式域名，例如 `bnzhitpig.wystudio.zone`。
- 接 Cloudflare Free 或其他境外 CDN。
- 配置缓存：
  - `/assets/*`：1 年，`public, immutable`。
  - `/index.html`：`no-cache` 或极短缓存。
  - 字体、WebP、音频、JS、CSS 都走 CDN 缓存。
- 开 gzip / Brotli。
- 保持 Vite hash 文件名，避免缓存错版本。
- 只在正式证书可用后开启 HSTS。
- 做一个极简首屏壳：
  - `index.html` 内可以先显示轻量启动画面。
  - React 加载后接管。
  - Phaser 和游戏 chunk 不进入首屏。

验收：

- 手机打开能在 1 秒左右看到首页壳或可用开始页。
- Network 中首屏不加载 Phaser。
- `curl -I` 检查缓存头符合预期。

### Phase 1：Phaser Spike

目标：用最小代码验证 Phaser 是否适合当前音游，不追求完整视觉。

新建分支：

```bash
git switch dev
git switch -c codex/phaser-spike
```

任务：

- 安装 Phaser。
- 新建 `game-phaser` 目录。
- `GameScreen.jsx` 增加实验入口，挂载 Phaser canvas。
- 做一个 `GameScene`：
  - 加载战斗背景。
  - 加载兔子/猪 sprite。
  - 读取当前 Ditto 谱面。
  - 让音符按时间下落。
  - 点击/触摸后调用现有 `engine.js` 判定。
- 继续使用 `AudioControllerWeb` 播放歌曲，不启用 Phaser Sound 作为主音频时钟。
- 构建并记录 Phaser chunk 体积。
- 手机上测试 FPS、输入延迟、音频同步。

验收：

- 能进入 Phaser 画布。
- 能播放歌曲并按谱面显示 note。
- 点击判定能得到 perfect/good/miss。
- 手机端没有明显输入延迟。
- Phaser chunk 没有进入首屏 HTML。

退出条件：

- 如果音频同步漂移明显，先停止全量迁移，回头只做 CDN 和当前 Canvas 优化。
- 如果 Phaser runtime 体积导致点击开始等待过长，必须继续保持点击前 idle preload 或更细的资源分包。

### Phase 2：游戏主体迁移

目标：用 Phaser 实现当前游戏的核心可玩闭环。

任务：

- 建立 Scene：
  - `BootScene`：极少量 loader UI 资源。
  - `PreloadScene`：战斗资源、sprite sheet、背景、HUD 图。
  - `GameScene`：主玩法。
  - `HudScene`：分数、combo、血量、暂停按钮。
  - `PauseScene`：暂停/继续/回首页。
- `RhythmBridge`：
  - 从 `AudioControllerWeb` 读取播放时间。
  - 每帧调用 `updateGameState`。
  - 将结果同步给 Phaser 显示层。
- `InputBridge`：
  - 映射 touch / pointer / keyboard。
  - 保留左右方向猪、hold note、暂停区域。
- 结果桥接：
  - 游戏结束后调用 React `onFinish(summary)`。
  - 继续进入现有 `ResultScreen`。

验收：

- 一局能从开始打到结算。
- 计分、combo、miss、hold、方向输入与当前版本一致。
- 暂停、回首页、重玩正常。
- 手机端游戏帧率不低于当前版本。

### Phase 3：视觉和体验追平

目标：逐步替换 `renderer.js` 的视觉细节，接近或超过当前版本。

任务：

- 战斗背景适配。
- 兔子攻击、受击、挥杖动画。
- 猪的正面/左右/飞出/受击状态。
- 音符轨道、hit flash、miss feedback。
- HUD 像素字体和数字显示。
- 魔法粒子、火光、星星、场景氛围。
- 低端机策略：
  - DPR 上限动态调整。
  - 特效密度动态降低。
  - 粒子数量可配置。
  - FPS 低于阈值时降级。

验收：

- 视觉不明显倒退。
- 低端安卓可玩。
- 游戏过程中没有明显掉帧尖峰。
- `renderer.js` 不再作为主渲染路径。

### Phase 4：页面统一与完整迁移判断

目标：决定是否把开始页和结果页也迁入 Phaser。

建议判断：

- 如果 React 开始页 + 结果页已经足够快，先不要迁。
- 如果希望整个游戏都成为单一 Phaser 应用，再迁：
  - `StartScene`
  - `SongSelectScene`
  - `SupportScene`
  - `ResultScene`

注意：

- 结果页当前有分享图导出、移动端保存、html-to-image 动态加载，这些 Web UI 能力用 React 更方便。
- 如果迁到 Phaser，分享图可能要改成 Phaser canvas 导出或保留隐藏 DOM 导出。

验收：

- 用户流程完整留在 Phaser 内。
- 分享图能力不倒退。
- 首屏速度不能因为全量 Phaser 化变慢。

### Phase 5：正式 CDN 与发布硬化

目标：让正式访问路径稳定、快、可回滚。

任务：

- 使用正式域名和有效 HTTPS 证书。
- CDN 缓存规则：
  - HTML：不缓存或短缓存。
  - Hash JS/CSS：1 年 immutable。
  - 图片/字体/音频：1 年 immutable。
  - API 或统计接口：按需 no-store。
- 开启 Brotli/gzip。
- 检查 HTTP/2 或 HTTP/3。
- 资源重编码：
  - BGM / 歌曲按移动端质量压缩。
  - 保留高质量版本用于桌面或后续设置项。
  - WebP/AVIF 优先，二维码保持 PNG 清晰度。
- 部署脚本固化：
  - 本地 build。
  - rsync 或平台自动部署。
  - Nginx 配置测试。
  - smoke test。

验收：

- 手机端正式域名可访问。
- 刷新任意路径不 404。
- CDN 命中后首屏明显快于直连源站。
- 新版本发布不会被旧 HTML 卡住。

## 性能预算

首屏预算：

- HTML：小于 10 KB。
- 首屏入口 JS：尽量小于 80 KB gzip。
- 首屏 CSS：尽量小于 20 KB gzip。
- 首屏图片：当前主题背景 + 兔/猪首帧，总量尽量小于 120 KB。
- 首屏不加载：
  - Phaser runtime。
  - GameScene。
  - 战斗背景。
  - 歌曲音频。
  - 结果页分享导出库。

游戏预算：

- Phaser/game chunk 只在点击开始前 idle preload 或点击后加载。
- 游戏冷启动资源要有可见 loading progress。
- `ditto.m4a` 约 2 MB，需要 CDN；后续建议移动端音频质量版本。
- 纹理尽量合并 atlas，减少请求数和解码抖动。

## 测试计划

每阶段至少执行：

```bash
cd web
npm run build
```

本地 smoke test：

- 首页首次打开。
- 切主题。
- 点击开始。
- 游戏能开始。
- 暂停/继续。
- 游戏结束进结果页。
- 再来一局。
- 回首页。
- 支持页打开/返回。
- 分享图生成/保存。

移动端测试：

- iPhone Safari。
- iPhone 微信内置浏览器。
- Android Chrome。
- Android 微信内置浏览器。
- 一台低端或老安卓。

网络测试：

```bash
curl -I -L https://bnzhitpig.wystudio.zone/
curl -I -L https://bnzhitpig.wystudio.zone/assets/index-xxx.js
curl -I -L https://bnzhitpig.wystudio.zone/assets/GameScreen-xxx.js
curl -I -L https://bnzhitpig.wystudio.zone/assets/audio/ditto.m4a
```

检查点：

- `index.html` 不被长期缓存。
- hash assets 是长期缓存。
- gzip/Brotli 生效。
- CDN 命中率正常。
- 首屏 Network 不出现 Phaser chunk。

## 分支和提交策略

- `dev`：开发集成分支。
- `codex/phaser-spike`：Phaser 技术验证。
- `codex/phaser-game-migration`：正式游戏主体迁移。
- `codex/cdn-performance-hardening`：CDN 和发布配置固化。

建议不要把 Phaser 迁移和 CDN 配置混在同一个大提交里。

提交顺序建议：

1. 文档和规划。
2. CDN 首屏优化。
3. Phaser spike。
4. Phaser 游戏主体迁移。
5. 视觉追平。
6. 删除旧渲染路径。
7. 正式发布配置。

## 回滚策略

- Phaser 迁移期间保留旧 `GameRunner + renderer` 路径。
- 新 Phaser 游戏入口可以先通过 feature flag 或 debug query 开启。
- Spike 和正式迁移未验收前，不删除旧 renderer。
- CDN 配置先小流量/本机验证，再正式切域名。
- Nginx / CDN 规则每次改动前留备份。

## 关键决策

- 第一版 Phaser 迁移继续复用 `AudioControllerWeb`。
- Phaser 不进入首屏。
- 首屏速度优先级高于完整技术统一。
- 结果页分享图能力不能倒退。
- 真机体验优先于桌面浏览器评分。

## 参考资料

- Phaser 官方介绍：`https://docs.phaser.io/phaser/getting-started/what-is-phaser`
- Phaser Scene 文档：`https://docs.phaser.io/phaser/concepts/scenes`
- Cloudflare Cache-Control 文档：`https://developers.cloudflare.com/cache/concepts/cache-control/`
- Cloudflare Cache Rules 文档：`https://developers.cloudflare.com/cache/how-to/cache-rules/`
