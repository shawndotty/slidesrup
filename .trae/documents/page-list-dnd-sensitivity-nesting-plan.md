# Design Maker Page List 拖拽灵敏度与入子级修复计划

## Summary

本次目标是修复 Page List 图层拖拽“误移出父级、入子级不稳定”的问题，并提升反馈清晰度：

- 取消“列表任意空白即回根层”的高敏感行为；
- 改为“仅底部专用根层投放区”可将节点移出父级；
- 入子级采用“左缩进区 + 150ms 停留确认”机制；
- 入子级后插入目标父级子列表顶部；
- 保持现有同级前后重排、循环依赖保护、即时源码同步与保存一致性。

## Current State Analysis

### 1) 当前拖拽意图判定（过于敏感）
- 文件：[design-page-list.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-page-list.ts)
- 现状：
  - 条目区域通过 `resolveLayerDropIntent` 判定 `before/after/as-child`；
  - 列表容器空白区 `drop` 直接触发 `to-root-top`；
  - 结果：在父级内部重排时，指针稍微离开条目就容易触发根层投放。

### 2) 当前视图移动算法
- 文件：[design-maker-view.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/views/design-maker-view.ts)
- `_moveBlock(request)` 已支持：
  - before / after / as-child / to-root-top；
  - 循环依赖校验 `_isDescendantBlock`；
  - 父变更时坐标重算；
  - `_syncPageSource()` + `_render()` 即时同步。

### 3) 现有测试基础
- 文件：[test.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/__tests__/test.ts)
- 已有顺序、payload、intent、markdown 顺序回归测试，可在此基础上补“专用根层投放区”和“停留确认”逻辑测试。

## Assumptions & Decisions

- 已确认产品决策：
  1. 根层投放策略：**仅底部专用根区**；
  2. 入子级策略：**左缩进区 + 停留 150ms**；
  3. 入子级插入位：**子列表顶部**。
- 本次不改 drag payload 协议字段（仍用 `action + blockId`），只增强 UI 命中与触发条件。
- 继续保持图层倒序渲染（与视觉叠放一致）。

## Proposed Changes

### A. Page List 交互层：根层投放区专用化 + 入子级停留确认
- 文件：`src/ui/components/design-page-list.ts`
- 变更：
  1. 将根层投放从“整个 layer-list 空白”改为“底部专用 drop zone 元素”；
  2. 在每个条目中引入入子级候选状态：
     - 仅当指针进入左缩进区后，开始 150ms 计时；
     - 计时到期才将意图升级为 `as-child` 并显示明确高亮；
     - 未到期或离开区域则回退为 before/after；
  3. 为 drop zone 与条目高亮增加更明确类名与清理逻辑（dragleave/drop/dragend）。
- Why：
  - 大幅降低误移出父级概率；
  - 让“放入父级”成为可预期、可观察的操作。
- How：
  - 新增内部状态（如 `pendingChildTargetId`, `childIntentTimer`）；
  - 将 root `drop` 监听绑定到专用区，而不是 `blockListContainer`；
  - `resolveLayerDropIntent` 增加“初判 + 停留确认后生效”的组合判定流程。

### B. View 层：保持现有算法，仅微调 as-child 插入位与兼容
- 文件：`src/ui/views/design-maker-view.ts`
- 变更：
  1. `_moveBlock` 中 `as-child` 插入位改为子列表顶部（`insertIndex = 0`）；
  2. 保持 `to-root-top`、before/after 映射与即时同步逻辑不变；
  3. 保持循环依赖校验与坐标重算策略。
- Why：
  - 当前核心算法已可用，问题主要在触发层；仅按新决策修正插入位。

### C. 样式反馈：新增专用根层投放区与子级确认态
- 文件：`styles.css`
- 变更：
  1. 新增 `.slides-rup-design-maker-layer-root-dropzone` 样式（默认弱化、dragover 强提示）；
  2. 新增“子级停留确认中”与“已确认子级”两段视觉态（例如虚线边框+进度强调）；
  3. 保持 before/after 插入线样式并提升与子级态的区分度。
- Why：
  - 反馈越明确，误操作越少，学习成本更低。

### D. 单元测试与回归
- 文件：`src/__tests__/test.ts`
- 新增测试：
  1. 根层仅专用区触发：普通空白不产生 `to-root-top`；
  2. 入子级停留判定：150ms 前后意图差异；
  3. as-child 插入顶部：移动后目标父级 children[0] 为新节点；
  4. 现有顺序/payload/markdown 回归继续通过。
- 说明：
  - 对时间相关逻辑使用可注入时间源或可测函数拆分（避免真实计时器导致 flaky）。

## Verification Steps

1. 构建验证
   - `npm run build`
2. 测试验证
   - `npx esbuild src/__tests__/test.ts --bundle --platform=node --format=cjs --external:obsidian --outfile=/tmp/slidesrup-test.cjs`
   - `node -e "..."`（沿用现有 mock 方案）
3. 手工交互回归（重点）
   - 在父级 children 内连续重排，不应再误触移出父级；
   - 仅拖到底部专用根区时才移出父级；
   - 左缩进区停留约 150ms 后，出现入子级高亮，松手入子级；
   - 入子级后位于子列表顶部；
   - 保存设计后模板结构（顺序/嵌套）与当前图层一致。

