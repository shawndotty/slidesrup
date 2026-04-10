# Design Maker 支持手动模板文件改建方案

## Summary

当前 Design Maker 只会按 `DESIGN_PAGE_DEFINITIONS` 固定页面定义加载模板页。目标是扩展为：

- 保持固定页面（cover/toc/chapter/content/contentWithoutNav/blank/backCover）行为不变；
- 额外自动纳入设计文件夹下由用户手动创建的 `.md` 模板文件；
- 保存时仅写回“被编辑过”的页面，避免无差别覆盖；
- UI 列表、缩略图、源码编辑与重新解析流程都能处理这些附加页面。

## Current State Analysis

- 固定页面定义集中在 `src/services/design-maker-schema.ts`，并通过 `DesignPageType` 强类型约束。
- 加载流程在 `src/services/design-maker.ts`：
  - `loadDesignDraft` 仅遍历 `DESIGN_PAGE_DEFINITIONS` 构建 `draft.pages`；
  - `saveDesignDraft` 仅遍历 `DESIGN_PAGE_DEFINITIONS` 保存页面。
- 数据模型在 `src/types/design-maker.ts`：
  - `DesignPageType` 是固定联合类型；
  - `DesignDraft.pages` 是 `Record<DesignPageType, DesignPageDraft>`（不支持动态键）。
- 视图与组件在 `src/ui/views/design-maker-view.ts`、`src/ui/components/design-page-list.ts`、`src/ui/components/design-thumbnail-nav.ts`，页面迭代主要依赖 `Object.values(draft.pages)`，但 active 类型与回写索引仍基于 `DesignPageType`。

## Assumptions & Decisions

- 已确认产品偏好：
  - 仅纳入设计文件夹根目录下 `.md` 文件（不含其他后缀）；
  - 保存时仅写回被编辑页面（标准页与手动页一致策略）。
- 纳入规则：
  - 固定定义文件优先按既有逻辑加载；
  - 其余 `.md` 且不在固定定义文件名集合中的文件，作为“附加页面”加载；
  - 暂不递归子目录。
- 排序规则：
  - 固定页面保持既有顺序；
  - 附加页面按文件名稳定排序（localeCompare）追加在后，保证 UI 稳定。
- active 页面兜底：
  - 首选 `cover`（若存在）；
  - 否则选择第一页（避免仅有附加页面时空白）。
- 兼容性策略：
  - 避免破坏现有解析器与生成器；通过扩展类型与加载元信息实现最小侵入改造。

## Proposed Changes

### 1) 扩展页面与草稿数据模型

文件：`src/types/design-maker.ts`

- 将页面标识从“仅固定联合类型”扩展为可容纳动态键：
  - 引入 `DesignPageId = DesignPageType | string`；
  - `DesignPageDraft.type` 改为 `DesignPageId`；
  - `DesignDraft.pages` 改为 `Record<string, DesignPageDraft>`（或等价映射类型）；
  - 新增页面脏标记集合字段（如 `dirtyPageIds?: Record<string, true>` 或在 View 层维护 Set）。
- 理由：保证手动页面可入库、可编辑、可保存，同时尽量减少现有调用点改动。

### 2) 在 schema 层补充“附加页面”元信息能力

文件：`src/services/design-maker-schema.ts`

- 保留 `DESIGN_PAGE_DEFINITIONS` 不变（固定页面仍是核心）。
- 新增辅助方法（建议）：
  - `isDesignMarkdownFile(fileName: string): boolean`：仅匹配 `.md`；
  - `buildAdditionalPageDraftMeta(fileName: string, filePath: string)`：为附加页面生成 label/fileName/type（type 可采用 `extra:${fileName}` 形式保证唯一）。
- 理由：将“文件识别与展示命名”逻辑集中，避免 service/view 分散重复判断。

### 3) 重构加载逻辑：固定页面 + 附加页面双阶段加载

文件：`src/services/design-maker.ts`

- 新增私有方法（建议）：
  - `_collectAdditionalMarkdownFiles(designPath: string, reservedNames: Set<string>): TFile[]`
    - 读取 design folder children；
    - 过滤 `TFile` + `.md`；
    - 排除固定定义文件名集合；
    - 按文件名排序。
- 修改 `loadDesignDraft`：
  1. 先按当前逻辑加载固定页面；
  2. 再加载附加 `.md` 页面并 parse 成 `DesignPageDraft`；
  3. 合并为统一 `pages` map 返回。
- 修改 `saveDesignDraft`：
  - 改为按 `draft.pages` 实际条目保存；
  - 仅保存“脏页面”（由 view 传入或 draft 内标记），未变更页面跳过写入。
- `reparsePage` 参数类型改为 `DesignPageId`，保证附加页面可重解析。
- 理由：确保行为符合“自动纳入 + 仅保存已编辑”目标，同时不影响固定页默认内容回退机制。

### 4) 调整解析入口以支持动态页面标识

文件：`src/services/design-maker-parser.ts`

- `parseDesignPageDraft` 的 `pageType` 入参由固定类型扩展为 `DesignPageId`；
- 文件名显示逻辑保持 `getDesignPageDisplayName`，确保附加页面 label 来自文件名主干；
- 其余 block 解析与单位检测逻辑保持不变。
- 理由：解析过程与页面类型强耦合较低，适配成本小、风险低。

### 5) 视图层改造：active 页与脏页管理改为动态键

文件：`src/ui/views/design-maker-view.ts`

- `activePageType` 替换为 `activePageId`（string）；
- `_setActivePage`、`_getCurrentPage`、`_switchActivePage`、`_loadDraft` 相关索引逻辑改为通用键；
- 引入 `dirtyPageIds: Set<string>`（View 内）：
  - 在以下操作标记当前页 dirty：画布操作导致 blocks 变化、源码应用 `Apply Source Changes`、删除/复制/重排等；
  - 保存成功后清空 dirty 集合。
- 保存调用改为向 service 传递 dirty 页面集合（或先写入 draft 标记后调用）。
- 理由：把“仅保存被编辑页面”的责任边界放在最了解交互行为的 View 层，service 负责执行写入。

### 6) 组件层类型跟进（不改交互）

文件：

- `src/ui/components/design-page-list.ts`
- `src/ui/components/design-thumbnail-nav.ts`

- 将 `onSelect`、`activePageType` 等参数类型从 `DesignPageType` 放宽到 `DesignPageId/string`；
- 保持当前基于 `Object.values(draft.pages)` 的渲染顺序机制；
- 不新增 UI 控件，仅让现有列表/缩略图自然显示附加页面。
- 理由：最小改动达到“可见可切换可编辑”。

### 7) 边界处理与失败模式

文件：`src/services/design-maker.ts`（主），必要时补充到 view/parser。

- 当设计文件夹中仅有附加页面且无固定页面文件时：
  - 仍可加载并选择第一页；
- 文件读取失败时沿用 `_readFileIfExists` 防御逻辑；
- 对于语法不支持内容，继续通过 `raw` block 呈现，不阻断保存。

## Verification

### 静态与类型

- 执行 TypeScript 检查（项目现有方式）确认新增 `DesignPageId` 扩展后无类型断裂。

### 功能场景

1. **基础回归**
   - 仅含固定页面的设计：加载、切页、编辑、保存行为与当前一致。
2. **附加页面加载**
   - 在设计目录新增 `My-Custom-Layout.md`：
   - 重新打开 Design Maker 后可见该页面（列表 + 缩略图）。
3. **附加页面编辑保存**
   - 编辑附加页面后保存，文件内容回写；
   - 未编辑页面（含固定/附加）不发生写入。
4. **混合场景**
   - 同时包含固定与多个附加页面，顺序稳定（固定在前，附加按文件名）。
5. **异常内容容错**
   - 附加页面包含非 grid 内容时，仍可通过 raw block 打开并保存。

### 验收标准

- 用户手动新增的 `.md` 模板能自动被加载并在 Design Maker 中编辑；
- 保存仅影响被编辑页面；
- 固定页面既有行为、默认回退与主题保存机制不退化。
