# NJZ Carpet Perspective

这是一个给 Figma Development Plugins 使用的本地开发插件。

它的目标不是做完整 3D，而是把你选中的一段文本、图片或图形节点，快速压成适合地毯左右边条的长条梯形透视，然后直接插回当前画布。

## 目录结构

- `manifest.json`: Figma 插件清单
- `code.js`: Figma 主线程逻辑，负责读取选区与插回结果
- `ui.html`
- `ui.js`
- `styles.css`

## 导入方式

1. 打开 Figma Desktop。
2. 进入 `Plugins > Development > Import plugin from manifest...`
3. 选择这个文件：

```text
/Users/yaohermione/Desktop/rhythm game/tools/figma-perspective-plugin/manifest.json
```

4. 导入后，在 `Plugins > Development` 里就能看到 `NJZ Carpet Perspective`。

## 使用方式

1. 在 Figma 里选中 1 个节点。
   - 推荐直接选一整条重复的 `NJZNJZ...` 文本
   - 也支持图片、编组、形状和组件实例
2. 运行插件。
3. 如果方向不对，点击：
   - `向左旋转 90°`
   - `向右旋转 90°`
   - `水平镜像`
4. 先点击：
   - `左边条预设`
   - 或 `右边条预设`
5. 再拖动画布里的四个角点微调透视。
6. 点 `插回 Figma`。

插件会把结果作为一张透明 PNG 插回当前文件，默认放在原选区右侧。

## 适合的场景

- 地毯边条
- 长条边框文字
- logo 或文字的单次透视压缩
- 需要在 Figma 内部闭环完成的轻量透视贴图

## 当前限制

- 当前版本更偏向“长条梯形透视”，不是完整自由 3D 网格编辑器
- 输出结果会栅格化成 PNG，不会保留可编辑文字
- 更适合你这次 NJZ 地毯边条这种用法
