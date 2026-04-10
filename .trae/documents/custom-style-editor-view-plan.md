# Custom Style Editor 功能实现计划

## Summary
- 新增一个独立的 Obsidian `ItemView`（名称：`Custom Style Editor`），可通过命令面板打开为专属 Tab。
- 该 View 内提供与高级设置页一致的 `customCss` CodeMirror 编辑器，编辑后沿用现有保存链路（写入 `plugin.settings.customCss`、`saveSettings()`、`modifyStyleSection("userStyle")`）。
- 设置页与新 View 之间实现双向实时同步：任一处修改 `customCss` 后，另一处已打开编辑器自动更新内容。
- 重复执行命令时复用已有 `Custom Style Editor` Tab（若存在则直接聚焦，不重复新建）。

## Current State Analysis
- 当前仅在高级设置中提供 `customCss` 编辑器，位置见 [settings-tab.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/settings-tab.ts#L1673-L1718)。
- 现有保存逻辑为防抖后写入 `this.plugin.settings.customCss` 并调用 `this.plugin.services.slidesRupStyleService.modifyStyleSection("userStyle")`，与需求目标完全一致，可复用。
- 插件已有 `ItemView` 注册与命令打开模式（Design Maker）：
  - 注册： [main.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/main.ts#L35-L38)
  - 命令： [command-service.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/services/command-service.ts#L404-L414)
  - `setViewState` 打开 leaf： [design-maker.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/services/design-maker.ts#L156-L177)
- 样式上已有 `.slides-rup-css-editor` 可复用，见 [styles.css](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/styles.css#L316-L321)。

## Proposed Changes

### 1) 新增 Custom Style Editor View 类型常量与状态类型
- 文件：`src/types/custom-style-editor.ts`（新建）
- 变更：
  - 新增 `CUSTOM_STYLE_EDITOR_VIEW_TYPE = "slides-rup-custom-style-editor"`。
  - 定义最小 `CustomStyleEditorViewState`（可为空对象或仅保留占位字段）。
- 原因：
  - 与 `Design Maker` 的类型组织方式保持一致，便于主插件注册与后续扩展。

### 2) 新增 Custom Style Editor ItemView 实现
- 文件：`src/ui/views/custom-style-editor-view.ts`（新建）
- 变更：
  - `class CustomStyleEditorView extends ItemView`，实现：
    - `getViewType()` 返回新常量；
    - `getDisplayText()` 返回 `Custom Style Editor`；
    - `getIcon()` 返回合适图标（优先复用 Obsidian 内置可用图标）；
    - `onOpen()` 构建 UI：标题说明 + `slides-rup-css-editor` 容器 + CodeMirror 编辑器；
    - `onClose()` 清理事件与编辑器引用。
  - 编辑器扩展与设置页对齐：
    - `basicSetup`、`css()`、`autocompletion()`、暗色主题 `oneDark`。
  - 保存逻辑对齐设置页：
    - 防抖保存函数：更新 `plugin.settings.customCss`，调用 `await plugin.saveSettings()`，再调用 `modifyStyleSection("userStyle")`。
  - 双向同步机制：
    - 监听 workspace 的全局事件（优先使用 `vault` 的 `modify` 或 workspace 的布局事件作为触发）并比较 `plugin.settings.customCss` 与当前编辑器文档；
    - 当外部值变化且与当前编辑器不一致时，用事务更新编辑器文档；
    - 使用“内部更新标记”避免程序化 setDoc 触发回写导致循环。
- 原因：
  - 满足“命令打开独立Tab + 与设置同源同值同步”的核心需求。

### 3) 在主插件中注册新 View
- 文件：`src/main.ts`
- 变更：
  - 引入新 view type 常量与 `CustomStyleEditorView`；
  - 在 `onload()` 中调用 `registerView(CUSTOM_STYLE_EDITOR_VIEW_TYPE, ...)`。
- 原因：
  - 使 Obsidian 能识别并实例化新 View。

### 4) 新增“打开 Custom Style Editor”命令并实现复用已有 Tab
- 文件：`src/services/command-service.ts`
- 变更：
  - 新增命令：
    - `id`: `slides-rup:open-custom-style-editor`
    - `name`: `Custom Style Editor`
  - 命令回调逻辑：
    - 先遍历 `workspace.getLeavesOfType(CUSTOM_STYLE_EDITOR_VIEW_TYPE)`；
    - 若已有 leaf：直接 `revealLeaf(leaf)` 并激活；
    - 若没有：`getLeaf("tab")` 后 `setViewState({ type: CUSTOM_STYLE_EDITOR_VIEW_TYPE, active: true })`，再 `revealLeaf`。
- 原因：
  - 满足“仅命令入口 + 重复执行复用已有 Tab”的产品决策。

### 5) 抽取并复用 customCss 保存逻辑（避免设置页与新View漂移）
- 文件：`src/services/css-services.ts`（或新增轻量 helper 文件）
- 变更（推荐最小抽取）：
  - 新增统一方法（如 `saveUserCustomCss(newCss: string)`）封装：
    - 写 `settings.customCss`
    - `plugin.saveSettings()`
    - `modifyStyleSection("userStyle")`
  - 设置页 `saveCssSetting` 与新 View 的防抖保存均调用该统一方法。
- 原因：
  - 两个入口共享同一业务路径，降低未来修改时不一致风险。

### 6) 更新样式（仅补齐新 View 外层布局）
- 文件：`styles.css`
- 变更：
  - 新增 `Custom Style Editor` View 容器类（如 `.slides-rup-custom-style-editor-view`）；
  - 复用 `.slides-rup-css-editor` 边框样式，必要时补充高度（例如最小高度）以改善编辑体验。
- 原因：
  - 确保新 View 在 Tab 中具备可读可编辑布局，不影响现有设置页样式。

## Assumptions & Decisions
- 已确认决策：
  - 同步策略：设置页与新 View 双向实时同步。
  - 编辑器范围：仅 `customCss`，不包含 `customMarpCss`。
  - 入口：仅命令面板，不新增 Ribbon，不新增设置按钮。
  - 重复打开命令：复用已有 Tab。
  - 文案：标题与命令名使用英文 `Custom Style Editor`。
- 实施假设：
  - `customCss` 仍然是唯一数据源（`plugin.settings.customCss`），不引入额外存储层。
  - 现有 `slidesRupStyleService.modifyStyleSection("userStyle")` 即为预览刷新链路，不新增新样式分段。

## Verification Steps
- 类型与构建检查：
  - 运行项目现有 TypeScript 检查/构建命令，确认无类型错误与导入错误。
- 功能验证（手动）：
  - 在命令面板执行 `Custom Style Editor`：应打开专属 Tab；
  - 再次执行同命令：应聚焦已存在 Tab，而非新建；
  - 在新 View 输入 CSS：检查 `customCss` 被保存，并触发样式更新；
  - 打开设置页高级设置，在两边交替编辑：
    - 任一侧变更后，另一侧应自动同步显示新文本；
    - 不应出现内容抖动、死循环保存、光标异常跳转（可接受最小光标重置）。
- 回归验证：
  - 确认 `customMarpCss` 编辑器行为未被影响；
  - 确认 Design Maker 的 View 注册与命令不受影响。
