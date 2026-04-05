# Design Maker 嵌套 Grid 支持实现计划

## 1. 当前状态分析 (Current State Analysis)
- `DesignGridBlock` 是扁平结构，没有子节点属性。
- `design-maker-parser.ts` 中的 `parseDesignPageDraft` 会遍历所有层级的 `<grid>` 并将它们拍平存入 `page.blocks`，同时 `stripNestedGridMarkup` 会从外层 Grid 的内容中剔除内层 Grid 的标记，导致嵌套结构丢失。
- 画布渲染 (`design-canvas.ts`) 和预览渲染 (`design-preview.ts`) 都是遍历一维的 `page.blocks`，直接在根容器中渲染所有的 Grid，导致布局扁平化和绝对定位失效。
- 工具栏只能通过点击按钮在固定坐标 (10, 10) 插入新 Grid。

## 2. 提议的变更 (Proposed Changes)

### 2.1 数据结构与解析/序列化 (Data Structure & Parsing/Serialization)
- **`src/types/design-maker.ts`**: 
  - 在 `DesignGridBlock` 接口中添加 `children?: DesignCanvasBlock[]` 属性，使其支持树状结构。
- **`src/services/design-maker-parser.ts`**:
  - 重构解析逻辑：在解析出顶级 Grid（`topLevelRanges`）后，递归地对每个 Grid 的 `segment.content` 进行解析，将其中的嵌套 Grid 提取并存入 `children` 数组中。
  - 保留 `stripNestedGridMarkup`，用于提取当前 Grid 的纯文本内容（存储到 `content` 属性中），以保持文本与子 Grid 在数据层面的分离，方便 Inspector 中的文本域编辑。
- **`src/services/design-maker-generator.ts`**:
  - 修改 `generateGridBlock` 函数，递归地调用自身来序列化 `children`。在拼接 Markdown 时，将子 Grid 的序列化结果追加到 `block.content` 之后，闭合于 `</grid>` 之前。

### 2.2 图层面板增强 (Layer Panel Enhancement)
- **`src/ui/components/design-page-list.ts`**:
  - 重构图层列表的渲染逻辑，使用递归函数 `renderLayerItem(block, depth)`。
  - 为每个项目设置 `padding-left: ${depth * 16}px`。
  - 对于包含 `children` 的 Grid，添加一个折叠/展开的 Toggle 按钮（默认展开）。

### 2.3 画布与预览渲染 (Canvas & Preview Rendering)
- **`src/ui/components/design-canvas.ts` & `src/ui/components/design-preview.ts`**:
  - 将当前扁平的 `page.blocks.forEach` 替换为递归渲染。
  - 渲染 Grid 时，如果有 `children`，则将子 Grid 的 DOM 元素 append 到当前 Grid 的 DOM 元素中。这样内层 Grid 的 `left`/`top`（基于 `%`）自然就是相对于父 Grid 的，并且在拖拽父 Grid 时子 Grid 会自动跟随移动。

### 2.4 画布端交互 (Canvas Interaction)
- **工具栏拖拽新建 (Toolbar Drag-to-Create)**:
  - 在 `design-canvas.ts` 的 `renderDesignToolbar` 中，将添加 Grid 的按钮设为 `draggable=true`。
  - 监听画板的 `drop` 事件，根据鼠标释放的位置计算出坐标，若落在某个已存在的 Grid 元素上，则将新 Grid 添加为该 Grid 的 `children`，并将其坐标转换为相对父 Grid 的百分比坐标。
- **拖出父级自动解除嵌套 (Auto-Unparent on Drag Out)**:
  - 在 `design-canvas.ts` 中 Grid 的 `onMove` 逻辑里，实时计算拖拽的全局边界。
  - 如果发现当前拖拽的 Grid 的中心点（或边界）超出了其父 Grid 的全局边界，则触发重新挂载逻辑（Reparenting）：将其从父 Grid 的 `children` 中移除，提升到上一级或根节点，并自动转换 `rect` 为新的相对坐标。
- **视觉反馈 (Visual Feedback)**:
  - 在选中某个 block 时，向上遍历找到其父 Grid，并为其父 Grid 的 DOM 元素添加特定的 CSS 类名（如 `is-parent-highlighted`）。
  - 在样式中定义 `.is-parent-highlighted { outline: 2px dashed var(--sr-dm-primary); }`。

### 2.5 属性面板增强 (Inspector Enhancement)
- **`src/ui/components/design-inspector.ts`**:
  - 在 `X` 和 `Y` 输入框旁边（或上方）添加一个 "Global / Relative" 的切换开关（Toggle）。
  - 需要在 `renderDesignInspector` 中传入一个辅助函数 `getGlobalRect(blockId)`。
  - 切换为 Global 时，显示全局计算的坐标，修改时将其转换回相对坐标保存；切换为 Relative 时，直接显示和修改 `block.rect` 的值。

## 3. 假设与决策 (Assumptions & Decisions)
- **子节点文本顺序**：因为 Advanced Slides 中的 `<grid>` 是绝对定位，DOM 中子 Grid 与文本的先后顺序不影响最终视觉效果。因此，序列化时统一将 `children` 放在 `content` 之后是安全的，这能保持数据结构和编辑体验的简洁。
- **性能**：DOM 渲染本身性能开销较小，但在拖拽时计算全局边界（用于自动解除嵌套）可能需要频繁调用 `getBoundingClientRect`。为了保证 ≥30fps，可以仅在拖拽结束（`mouseUp`）或使用限流（Throttle）的 `mouseMove` 中检查是否越界。

## 4. 验证步骤 (Verification Steps)
1. **单元测试 (Unit Tests)**：由于当前仓库没有测试框架，将引入 `vitest`，并在 `src/__tests__` 中编写针对序列化、反序列化、坐标转换的测试用例，确保 100% 覆盖并按要求通过。
2. **序列化/反序列化**：创建一个包含深度为 3 的嵌套 Grid 的模板，保存后再重新加载，验证结构是否100%保持不变。
3. **图层面板**：检查图层面板是否正确缩进（16px 递增），且支持折叠。
4. **拖拽与脱离**：从工具栏拖拽 Grid 到画布中的现有 Grid 上，检查是否成为子节点；将其拖出父 Grid 边界，检查是否自动解除父子关系并保持坐标正确。
5. **属性面板**：在嵌套 Grid 中切换 Global/Relative 坐标，验证数值是否正确转换并生效。
6. **视觉反馈**：选中内层 Grid，验证父 Grid 是否出现虚线高亮。
7. **自动化构建**：运行 `npm run build` 进行类型和 lint 检查。