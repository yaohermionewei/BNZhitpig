# PLANS.md

本文件定义本仓库如何使用官方风格的 ExecPlan。

ExecPlan 是复杂任务的“活文档”执行计划。它适用于复杂功能、重大重构、多小时任务，或者任何可能跨阶段、跨对话、中途暂停后还要继续的工作。它不是普通 todo list，也不是项目状态白板。

一个好的 ExecPlan 应该自包含：即使执行者没有读过之前的聊天记录，只要读当前代码和这份计划，也能知道目标是什么、为什么要做、从哪里开始、怎么验证、当前进度到哪一步。

## 什么时候使用 ExecPlan

需要使用：

- 复杂功能或重大重构。
- 需要同时修改多个模块、多个目录或多个技术层的任务。
- 需要先研究现状，再设计方案，再分阶段实现的任务。
- 预计会持续较久，或者中途可能被打断后继续的任务。
- 需要记录关键发现、决策理由、验证结果和恢复方式的任务。

不需要使用：

- 简单问答。
- 很小的文案、样式或配置修改。
- 单文件小修。
- 当场可以完成，且没有后续上下文价值的任务。
- 临时探索步骤。

如果不确定是否需要 ExecPlan，先问用户。

## 具体 ExecPlan 放在哪里

具体任务计划放在：

```text
plans/
```

推荐命名：

```text
plans/YYYY-MM-DD-short-task-name.md
```

例如：

```text
plans/2026-05-27-example-web-readme-refresh.md
```

## ExecPlan 必须保持可执行

ExecPlan 不是写完就放着的计划。执行过程中要持续更新它，让它始终反映当前真实状态。

- 做完一个阶段后，更新 `Progress`。
- 发现重要事实或坑点后，更新 `Surprises and Discoveries`。
- 做出关键取舍后，更新 `Decision Log`。
- 验证完成后，更新 `Validation and Acceptance`。
- 任务结束后，更新 `Outcomes and Retrospective`。

## ExecPlan 推荐结构

每个具体 ExecPlan 建议使用以下结构：

```md
# <任务名称>

This ExecPlan is a living document. Keep it updated as work proceeds.

## Purpose / Big Picture

说明最终目标。完成后，用户能看到什么、做到什么，或者项目会获得什么能力。

## Progress

使用 checklist 记录真实进展。不要只写静态愿望。

- [ ] ...

## Surprises and Discoveries

记录执行过程中发现的重要事实、坑点、约束或验证结果。

- ...

## Decision Log

记录重要决定、原因和日期。

- YYYY-MM-DD: ...

## Outcomes and Retrospective

任务完成后记录最终结果、剩余风险和经验。

## Context and Orientation

说明相关文件、目录、模块、命令和当前实现状态。让没有聊天上下文的人也能接着做。

## Plan of Work

按阶段说明要怎么推进。

## Concrete Steps

写出具体命令、文件修改点、验证步骤或可继续执行的动作。

## Validation and Acceptance

说明如何确认任务完成，例如运行哪些命令、打开哪些页面、检查哪些行为。

## Idempotence and Recovery

说明中断后怎么恢复、哪些步骤可以重复执行、如何避免破坏已有改动。
```

## 本仓库约定

- `AGENTS.md` 是项目总规则和长期共识。
- `PLANS.md` 是 ExecPlan 规范，也就是本文件。
- `plans/*.md` 是具体复杂任务的执行计划。
- 不为普通小任务创建 ExecPlan。
- 如果用户明确要求“用官方 PLANS.md / ExecPlan 方式规划”，则创建具体 ExecPlan。
