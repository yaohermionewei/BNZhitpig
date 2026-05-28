# Web 正式发布清单

## 目标

把 `BNZ Hit Pig` 准备到可以公开发布的状态，正式访问地址是：

```text
https://bnzhitpig.wystudio.zone
```

## 范围

- 当前发布目标只看 `web` 项目。
- 托管平台：Netlify。
- 正式域名：`https://bnzhitpig.wystudio.zone`。
- 当前正式游戏名：`BNZ Hit Pig`。
- 本轮发布不要混入 `web-parkour`、调试预览页、生成出来的预览图片目录、本地测试结果或其他临时产物，除非后续任务明确要求。

## 正式文案

- 正式游戏名：`BNZ Hit Pig`
- 短名称：`BNZ Hit Pig`
- 一句话描述：`爆锤方猪，守护NJZ。BNZ专属音游。`
- 分享标题：`BNZ Hit Pig`
- 分享描述：`爆锤方猪，守护NJZ。准备输出你今天的锤猪战报。`

## 建议执行顺序

1. 准备正式 metadata 和图标。
2. 迭代期优先通过 Cloudflare 体验最新 GitHub 版本。
3. 做最终谱面调校。
4. 测低端安卓机和关键移动浏览器。
5. 发布前最后把血量从 10 改成 20，并确认 HUD 血条显示仍然清楚。
6. 本地跑一次构建。
7. 发布前重新启用 Netlify 构建。
8. 通过 GitHub -> Netlify 自动部署。
9. 用正式域名做 smoke test。
10. 做最终发布判断。

## Netlify 构建策略

- 当前迭代期为了节省 Netlify 免费额度，可以保持 Netlify 的 `Build status` 为 `Stopped`。
- 这样 push 到 GitHub 后，Cloudflare 可以继续自动部署用于体验，Netlify 不会自动 build，也不会因为每次小改动消耗 production deploy credits。
- 准备正式发布时，到 Netlify 项目设置里重新打开：
  - 路径：`Project configuration` -> `Build & deploy` -> `Continuous deployment` -> `Build settings` -> `Configure`。
  - 把 `Build status` 从 `Stopped builds` 改回 `Active builds`。
  - 点击 `Save`。
- 重新打开后，再 push 一次正式发布 commit，或者在 Netlify 的 Deploys 页面手动 `Trigger deploy`。
- 发布前检查 Netlify 构建设置仍然是：
  - Base directory：`web`
  - Build command：`npm run build`
  - Publish directory：`web/dist`

## P0：发布前必须完成

- [x] 制作 favicon 和 App 图标。
  - 图标源图由用户设计。
  - 推荐源文件尺寸：1024x1024 PNG 或 SVG。
  - Favicon：`web/public/favicon.ico`，包含 16x16、32x32、48x48。
  - PNG favicon 兜底：`web/public/favicon-32x32.png`，32x32。
  - iPhone 添加到桌面图标：`web/public/apple-touch-icon.png`，180x180。
  - Web App 图标：`web/public/icons/icon-192.png` 和 `web/public/icons/icon-512.png`。
  - Maskable 图标：`web/public/icons/icon-maskable-512.png`，512x512。
  - Maskable 图标要把重要主体放在中间安全区，避免文字或关键轮廓贴边。
- [x] 添加正式 metadata。
  - 标题：`BNZ Hit Pig`。
  - 页面描述：`爆锤方猪，守护NJZ。BNZ专属音游。`
  - 分享描述：`爆锤方猪，守护NJZ。准备输出你今天的锤猪战报。`
  - Open Graph 标题 / 描述 / 图片 / URL。
  - Twitter card metadata。
  - Web App manifest。
  - 相关文件：`web/index.html`。
  - 相关文件：`web/public/manifest.webmanifest`。
- [ ] 发布前最后再把血量从 10 改成 20。
  - 平时迭代期先保持 10 点生命值，方便更快进入结算页测试。
  - 发布前修改 `web/src/game/engine.js` 里的 `DEFAULT_MAX_LIVES`。
  - HUD 血条按 `lives / maxLives` 显示比例，会随 20 点生命值自动适配。
  - 血量归零时仍然会失败。
- [ ] 做最终谱面调校。
  - 按听感检查 timing。
  - 调整 note 密度和手感。
  - 在适合的位置增加更多左 / 右方向猪。
  - 谱面调整后确认分数和评级表现合理。
- [ ] 测低端安卓设备。
  - Chrome。
  - 微信内置浏览器。
  - 一到两个常见国产 Android 浏览器。
- [ ] 测 iPhone Safari 和 iPhone 微信内置浏览器。
- [ ] Netlify 部署后，用正式域名做 smoke test。
  - 首页能打开。
  - 点击后音频能解锁并播放。
  - 游戏能开始并正常结束。
  - 结果页能正常渲染。
  - 结果页战报图能正常导出。
  - 刷新页面不会 404。

## P1：强烈建议完成

- [ ] 在手机上验收结果页分享图。
  - 正式域名显示为 `bnzhitpig.wystudio.zone`。
  - 评级、分数、爆锤次数、中文文案都不溢出。
  - iOS 和 Android 导出的图片都清晰。
- [ ] 验收“添加到桌面”效果。
  - iPhone Safari 使用正确的 Apple touch icon。
  - Android Chrome 使用正确的 manifest 图标。
  - 桌面图标名称显示为 `BNZ Hit Pig`。
- [ ] 检查所有公开文案是否统一。
  - `BNZ Hit Pig`
  - `爆锤方猪`
  - `bnzhitpig.wystudio.zone`
  - 发布前搜索旧词：`Bunnies Rhythm Web`、`bunnies-rhythm-web`、`bnzhitpig.pages.dev`、`暴击方猪`。
- [ ] 检查结果页语音播放。
  - 7 条语音都能播放。
  - 洗牌袋随机不会在一组内重复。
  - BGM 和语音音量平衡舒服。
- [ ] 检查首屏加载性能。
  - 主 JS / CSS 体积。
  - 首屏图片体积。
  - 字体 preload 表现。
  - 低端 Android 帧率。

## P2：上线后可以慢慢做

- [ ] 访问统计。
- [ ] 错误监控。
- [ ] 排行榜产品设计。
- [ ] 排行榜数据库 / 服务商选择。
- [ ] 确认正式域名是否需要展示 ICP 备案号，以及具体展示方式。

## 谱面和计分备注

- 当前评级是按百分比算的，不是写死某个绝对分数。
- 代码会根据当前谱面的 notes 自动计算理论满分，所以 timing 微调、增加 note、删除 note 后，满分和评级百分比会自动适配。
- 左 / 右方向猪和长按 note 当前权重是普通 tap note 的 1.5 倍。
- 当前评级阈值：
  - SSS：大于等于 90%
  - SS：大于等于 75%
  - S：大于等于 60%
  - A：大于等于 45%
  - B：大于等于 30%
  - C：低于 30%
- 增加左 / 右方向猪会改变理论满分，因为它们权重更高；但评级阈值仍然会按百分比自动适配。

## 验证命令

除非特别说明，命令都从仓库根目录运行。

```bash
cd web
npm run build
```

Netlify 部署后，建议检查正式域名和关键资源：

```bash
curl -I -L https://bnzhitpig.wystudio.zone
curl -I -L https://bnzhitpig.wystudio.zone/manifest.webmanifest
curl -I -L https://bnzhitpig.wystudio.zone/favicon.ico
curl -I -L https://bnzhitpig.wystudio.zone/apple-touch-icon.png
```

## 提交策略

- 发布清单更新和具体实现改动尽量分开提交。
- Web 正式发布期间，不要把 `web-parkour` 的工作混进来。
- 不要提交 debug preview 页面、预览图片目录、`test-results/` 或临时审阅产物，除非用户明确要求。
- 考虑 Netlify 构建 / 部署额度，小的正式发布改动可以按主题合并成一次提交。

## 备注

- 图标源图由用户设计；除非用户明确要求，Codex 不生成最终图标创意稿。
- 用户提供图标源图后，Codex 负责生成需要的尺寸，并接入 `web/index.html` 和 `web/public/manifest.webmanifest`。
