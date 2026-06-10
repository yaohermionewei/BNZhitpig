# 示例 ExecPlan：更新 README 到 Web 主线

This ExecPlan is a living document. Keep it updated as work proceeds.

这是一个示例计划，用来展示具体 ExecPlan 文件长什么样。它不代表已经开始执行 README 更新任务。

## Purpose / Big Picture

当前 `README.md` 仍然主要描述微信小程序版本，但项目真实主线已经转向 `web`。本计划的目标是把 README 更新成 Web 优先的项目说明，让第一次打开仓库的人知道应该运行、构建和部署 `web` 目录，而不是继续围绕 `miniprogram` 工作。

完成后，用户应该能通过 README 清楚知道：

- 当前主线是 `web`。
- `miniprogram` 是历史遗留参考。
- `web-parkour` 是旁线项目。
- 如何启动、构建和部署 Web 版。
- 谱面、音频、结果页等关键文件大概在哪里。

## Progress

- [ ] 阅读当前 `README.md`。
- [ ] 阅读 `AGENTS.md`，确认项目主线和目录优先级。
- [ ] 检查 `web/package.json`、`web/vite.config.js` 和 `web/src` 入口文件。
- [ ] 重写 README 为 Web 优先说明。
- [ ] 保留小程序作为历史背景，而不是当前主线。
- [ ] 验证 README 中的命令和路径存在。

## Surprises and Discoveries

- 暂无。本文件只是示例 ExecPlan。

## Decision Log

- 2026-05-27: 将此文件作为示例 ExecPlan 创建，帮助用户理解 `PLANS.md` 和具体 ExecPlan 的区别。

## Outcomes and Retrospective

任务尚未执行。完成后在这里记录最终改动、验证结果和剩余风险。

## Context and Orientation

相关文件：

- `README.md`：当前项目对外说明，仍偏向旧的小程序路线。
- `AGENTS.md`：已经记录当前默认主线是 `web`。
- `web/package.json`：Web 版运行和构建命令。
- `web/src/App.jsx`：Web 版应用入口之一。
- `web/src/game/ditto.editable.chart.js`：当前 Web 主线谱面文件。
- `miniprogram`：历史遗留小程序版本，一般不主动维护。
- `web-parkour`：旁线跑酷原型。

当前已知背景：

- 项目最早计划发布到微信小程序。
- 用户后来决定放弃小程序发布路线，转向 Web 发布。
- 默认所有新功能、视觉调整、玩法迭代、资源接入和发布准备都围绕 `web`。

## Plan of Work

1. 对比 `README.md` 和 `AGENTS.md` 的项目方向。
2. 收集 `web` 版真实运行、构建、部署命令。
3. 设计 README 新结构：项目简介、当前主线、目录说明、启动 Web、构建部署、历史小程序说明、旁线项目说明。
4. 修改 README。
5. 检查所有路径、命令和链接是否准确。

## Concrete Steps

可执行步骤示例：

```bash
sed -n '1,220p' README.md
sed -n '1,220p' AGENTS.md
sed -n '1,160p' web/package.json
find web -maxdepth 2 -type f \( -name 'package.json' -o -name 'vite.config.*' -o -name 'index.html' \) | sort
```

修改时应优先用 `apply_patch`，并避免改动无关文件。

## Validation and Acceptance

验收标准：

- README 第一屏明确说明当前主线是 Web。
- README 不再把微信小程序描述为当前主要发布目标。
- Web 启动命令、构建命令和部署说明准确。
- `miniprogram` 被描述为历史遗留参考。
- `web-parkour` 被描述为旁线项目。
- 所有重要路径都存在。

可选验证：

```bash
cd web
npm run build
```

## Idempotence and Recovery

- README 修改可以重复执行，但应先读取当前文件，避免覆盖用户新增说明。
- 如果中途中断，下一位 agent 应先阅读本 ExecPlan 的 `Progress` 和 `Context and Orientation`，再继续。
- 如果用户决定保留更详细的小程序历史说明，README 应改成“Web 主线 + 小程序历史背景”，而不是完全删除小程序信息。
