# Design Maker Page List 图层拖拽改造计划

## Summary

目标是在 Design Maker 的 Page List 图层面板中实现可用且可保存的拖拽编排能力：

- 支持 Grid 图层**同级重排**（默认交互）；
- 支持通过“缩进区投放”把 Grid 改为其他 Grid 的子级；
- 支持拖到空白区回到根层，并按“最上层”插入；
- 拖拽后立即同步页面源码，保存设计时模板结构与顺序一致；
- 图层显示顺序保持“倒序渲染”（与 Advanced Slides 视觉叠放一致）。

## Current State Analysis

### 1) 图层渲染顺序（已倒序）
- 文件：[design-page-list.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-page-list.ts)
- 当前通过 `getLayerRenderOrder(...).reverse()` 对根层与子层都做了倒序显示，已与视觉层级对齐。

### 2) 拖拽能力现状
- 当前仅支持“拖到条目上 => 设为其子级”及“拖到列表空白 => 回根层”；
- 不支持同级前后重排，不支持插入索引控制；
- `drop` 处理只传 `sourceId + targetParentId`，无 before/after 位置信息。

### 3) 数据与保存链路
- 视图层 `design-maker-view.ts` 现有 `_reparentBlock(blockId, targetParentId)`；
- 源码生成器 [design-maker-generator.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/services/design-maker-generator.ts) 按 `page.blocks`/`children` 数组顺序生成模板；
- 因此只要正确更新数组顺序与父子结构，保存模板会自然反映用户拖拽结果。

### 4) 已确认的产品决策
- 默认拖到条目：**同级重排**；
- 拖到空白区：根层插入**最上层**；
- 同步时机：**立即同步**；
- 改父子触发：拖到目标条目的**缩进区**；
- 设为子级时插入：目标子列表**顶部**。

## Proposed Changes

### A. Page List 交互层改造
- 文件：`src/ui/components/design-page-list.ts`
- 变更：
  1. 新增拖拽意图解析：`before | after | as-child | to-root-top`；
  2. 为每个条目计算命中区域：
     - 左侧缩进区（固定宽度）= `as-child`；
     - 其余区域根据纵向中线判定 `before/after`；
  3. 增加可视化 drop indicator（前插线/后插线/子级高亮）；
  4. 扩展拖拽回调参数，传递“目标父级 + 插入锚点/索引意图”；
  5. 保持现有隐藏显示、折叠、选择交互不回退。
- Why：
  - 满足“同级重排默认、改父子可控触发”的需求，避免误嵌套。
- How：
  - 在 `dragover` 中实时更新 drop hint class；
  - 在 `drop` 中解析 payload + hint，调用新的结构化回调。

### B. 视图数据层改造（核心）
- 文件：`src/ui/views/design-maker-view.ts`
- 变更：
  1. 新增 `_moveBlock(...)` 统一处理：
     - 同级 before/after 重排；
     - as-child（插入子列表顶部）；
     - to-root-top（插入根层“最上层”对应的数组末尾）；
  2. 保留并复用循环依赖校验（禁止把父拖进后代）；
  3. 拖拽后调用坐标更新逻辑（沿用 `_updateBlockCoordinates`）；
  4. drop 完成后立即 `_syncPageSource()` + `_render()`。
- Why：
  - 现有 `_reparentBlock` 只能“改父”不能“定序”，需要统一成可排序移动。
- How：
  - 先从原容器移除 source，再根据目标容器与锚点插入；
  - 当目标命中为 before/after 时插入到目标所在容器相邻索引；
  - 当 as-child 时插入 `target.children.unshift(source)`。

### C. 类型与接口扩展
- 文件：`src/types/design-maker.ts`（如需新增类型）、
  `src/ui/components/design-page-list.ts`（回调签名）
- 变更：
  - 新增拖拽动作类型（如 `LayerDropIntent`、`LayerMoveRequest`）；
  - `onReparentBlock` 升级为 `onMoveBlock(request)`（或并存过渡）。
- Why：
  - 明确表达“父子关系 + 顺序”的组合语义，减少隐式分支。

### D. 样式与反馈
- 文件：`styles.css`
- 变更：
  - 新增 drop 前后插入线样式；
  - 新增缩进区命中高亮样式；
  - 保留当前 layer item hover/selected 风格的一致性。
- Why：
  - 让用户知道“将前插/后插/设子级”的结果，降低误操作。

### E. 自动化测试
- 文件：`src/__tests__/test.ts`
- 新增测试集：
  1. 同级重排：A/B/C 拖拽后顺序正确；
  2. 设为子级：拖到缩进区后父子关系正确，且插入子列表顶部；
  3. 多层嵌套重排：跨层移动索引正确；
  4. 拖到空白区：回根层最上层；
  5. 回归：倒序渲染 + 拖拽 payload 解析不冲突；
  6. 回归：生成 markdown 顺序与新结构一致（保存一致性）。

## Assumptions & Decisions

- 仅 Grid 可拖拽；Raw block 不参与层级拖拽；
- 根层“最上层”按当前倒序显示语义映射为数组末尾插入；
- 立即同步源码，不增加配置项；
- 本次先保证桌面端拖拽体验，触摸端后续迭代。

## Verification Steps

1. 构建检查：
   - `npm run build`
2. 单元测试：
   - `npx esbuild src/__tests__/test.ts --bundle --platform=node --format=cjs --external:obsidian --outfile=/tmp/slidesrup-test.cjs`
   - `node -e "..."`（与项目现有 mock 方式一致）
3. 手工回归（Design Maker）：
   - 同级前后重排是否与列表提示一致；
   - 缩进区投放是否变为子级且在子列表顶部；
   - 拖到空白区是否回根层最上；
   - 保存设计后模板中 Grid 顺序/嵌套是否与面板一致；
   - 重新加载设计后顺序保持一致。

