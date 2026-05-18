# Bunnies Parkour Web

独立的 Web 跑酷版本，和 `web`、`miniprogram` 平级。它读取同一首 Ditto 谱面，但只在运行时派生三轨 Note，不会把 `lane` 写回原始 chart。

## 启动

```bash
cd web-parkour
npm install
npm run dev
```

默认本地地址：

```text
http://localhost:5174/
```

生产构建：

```bash
npm run build
```

## 玩法边界

- 只保留横向拖动兔子换轨。
- Note 到达兔子所在轨道时自动收集并播放命中音效。
- 漏吃只记 miss、断 combo、少拿分，不扣血、不失败、不播放受击音效。
- hold Note 是持续收集条，兔子保持在同轨即可自然吃完整段。
- 跑酷战斗页不加载旧战斗场景图，也不显示五个氛围组小女孩。

## 资源

`public/assets` 只放跑酷版必需资源：

- `audio/ditto.m4a`
- `audio/hit.wav`
- `fonts/bunnies-pixel-en.woff2`
- `fonts/bunnies-pixel-zh-ui.woff2`
- `images/characters/rabbit-back.png`
- `images/characters/rabbit-front.png`
- `images/song-covers/ditto.cover.pixel.png`
