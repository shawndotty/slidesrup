# 设计页面 Block 列表及显示/隐藏（图层）控制功能规划

## 1. 目标与背景分析
用户希望在 Design Maker 左侧边栏的“设计页面（Design Pages）”列表中，针对当前选中的页面，在它的下方列出当前页面包含的所有 Grid Block（类似于 Photoshop 的图层面板）。
- **主要特性**：
  1. 显示页面下所有 Block 的列表（如果可以，尽量给出简短的摘要或类型）。
  2. 每个 Block 列表项右侧提供一个“眼睛”图标，用于临时控制该 Block 在“画布”和“预览”区域的**显示 / 隐藏**。这种隐藏状态只在 Design Maker 中生效，保存和最终输出时不影响原始 Markdown 代码。
  3. 支持列表项和画布区块的**联动选中**：在左侧列表中点击某个 Block，画布和预览区域该 Block 会同步高亮；在画布中点击某个 Block，左侧列表对应的项也应同步高亮。

**当前状态**：
- `DesignGridBlock` 和 `DesignRawBlock` 接口当前没有 `hiddenInDesign` 属性。
- `renderDesignPageList` 函数只渲染了页面按钮，没有展示页面下的 `blocks` 列表。
- 画布和预览区域当前仅响应 `result.hidden` （基于内容的内部解析结果），没有外部图层开关干预。

## 2. 具体修改方案

### 2.1 数据结构扩展 (`src/types/design-maker.ts`)
- 在 `DesignGridBlock` 和 `DesignRawBlock` 的接口定义中新增可选属性 `hiddenInDesign?: boolean;`。
- 因为这个属性只是视图层的临时状态，在生成/保存 Markdown 的序列化过程（`generatePageMarkdown`）中无需做任何特殊处理。

### 2.2 左侧边栏渲染扩展 (`src/ui/components/design-page-list.ts`)
- **扩展入参**：
  在 `renderDesignPageList` 选项中加入：
  - `selectedBlockId: string | null`
  - `onSelectBlock: (blockId: string | null) => void`
  - `onToggleBlockVisibility: (blockId: string, hidden: boolean) => void`
- **渲染逻辑修改**：
  在遍历 `draft.pages` 时，当遍历到的页面 `page.type === activePageType` 时（也就是当前激活的页面），在其下方额外渲染一个该页面的 Block 列表。
  - 创建一个包含所有 blocks 的容器 `ul` 或 `div`。
  - 遍历该页面的 `blocks`。对每个 block，创建一个列表项：
    - 显示文本（取 `block.role` 或 `block.content` 的前 10 个字符作为摘要）。
    - 右侧添加一个图标按钮（使用 Obsidian 内置图标，比如 `lucide-eye` 或 `lucide-eye-off`），通过 `setIcon` 渲染。
    - 点击列表项文本区域时，触发 `onSelectBlock(block.id)`。
    - 若 `block.id === selectedBlockId`，给列表项增加 `.is-selected` 样式。
    - 点击眼睛图标时，触发 `onToggleBlockVisibility(block.id, !block.hiddenInDesign)`，并阻止事件冒泡。

### 2.3 视图控制器适配 (`src/ui/views/design-maker-view.ts`)
- 在 `_render` 方法调用 `renderDesignPageList` 时：
  - 传入当前的 `this.selectedBlockId`。
  - 传入 `onSelectBlock`：更新 `this.selectedBlockId`，同步执行视觉更新及调用 `this._renderRightPanel()` 等。
  - 传入 `onToggleBlockVisibility`：找到对应的 block 并修改其 `hiddenInDesign` 属性，然后调用 `this._renderCanvasAndPreview()` 与 `this._render()` 以重绘界面和列表。

### 2.4 画布与预览渲染适配 (`src/ui/components/design-canvas.ts` 和 `design-preview.ts`)
- 在遍历渲染 blocks 时（`page.blocks.forEach`），检查 `if (block.hiddenInDesign) { return; }`，或者不 `return` 而是为对应的 DOM 节点添加 `display: none` / `opacity: 0` 样式（推荐直接 `return` 跳过渲染，或是隐藏 DOM，为了不干扰 resize，直接跳过渲染更为彻底）。

## 3. CSS 样式支持 (`styles.css`)
- 需要增加针对左侧 Block 列表（图层列表）的样式：
  - 缩进页面按钮下方的列表，展示层级感。
  - 列表项的 flex 布局（左侧摘要文本，右侧眼睛图标）。
  - 列表项的 hover 态和 selected 态高亮效果。

## 4. 验证步骤
1. 完成所有修改后执行 `npm run build`。
2. 打开 Design Maker，查看左侧“设计页面”下是否显示了当前页面的 Block 列表。
3. 测试**点击左侧列表项**，中间画布对应的 Block 是否被选中。
4. 测试**点击中间画布的 Block**，左侧对应的列表项是否同步被选中。
5. 测试**点击眼睛图标**，画布和预览区域的对应 Block 是否成功隐藏/显示。
6. 测试隐藏某个 Block 后，保存并应用，检查生成的 Markdown 是否仍然保留了该 Block 的内容（证明隐藏仅为视图级控制）。