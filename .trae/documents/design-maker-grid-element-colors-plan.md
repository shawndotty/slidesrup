# Plan：Design Maker 右侧 Panel 增加「区块内元素颜色设置」

## Summary
- 目标：在 Design Maker 的 Block Inspector（右侧 panel）底部新增一个「区块内元素颜色设置」组件，为当前 Grid 的 `h1~h6/p/li/strong/em/a` 提供独立颜色配置。
- 行为：当任一元素设置颜色时，在当前 Grid 的 `content` 内自动维护一个 `<style id="<grid-id>-colors">...</style>`；若 Grid 无 `id`，自动生成 `grid-<timestamp>` 并写入 Grid 属性。
- 清理：每个元素带 reset；元素 reset 后删除对应 CSS 规则；全部为空时删除 `<style>`，但保留 Grid `id`。

## Current State Analysis
- Inspector 渲染入口在 [design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts#L1947-L2356) 的 `renderDesignInspector`，当前末尾字段是 `Fragment`、`CSS Class`、`Inline Style`，尚未包含“区块内元素颜色设置”。
- 现有颜色能力可复用：
  - 颜色合法性与归一化：`isValidInspectorColor`、`normalizeInspectorColorToHex`（同文件）。
  - 颜色控件样式：`styles.css` 里 `.slides-rup-design-maker-color-controls`、`.slides-rup-design-maker-color-input`、`.slides-rup-design-maker-input.is-invalid`。
- Grid 属性序列化/解析链路已支持通过 `extraAttributes` 透传非内建属性：
  - 解析：`parseAttributes` -> `createGridBlock`（`id` 会进入 `extraAttributes`）。
  - 生成：`serializeAttributes` 会把 `extraAttributes`（除 `rectUnit`）写回 `<grid ...>`，因此新增/写入 `id` 不需改 parser/generator 结构。
- 当前自动化测试文件 [test.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/__tests__/test.ts) 覆盖了 inspector 多个 helper，可按同模式补充纯函数测试。

## Proposed Changes

### 1) 在 inspector 中新增“元素颜色样式管理”纯函数
**文件**：`src/ui/components/design-inspector.ts`

- 新增常量：
  - `MANAGED_HTML_ELEMENTS = ["h1","h2","h3","h4","h5","h6","p","li","strong","em","a"]`
- 新增 `getHtmlElementColors(block)`：
  - 从 `block.extraAttributes.id` 定位目标 style 块：`<style id="${id}-colors">...</style>`
  - 解析每个元素当前 color 值，返回 `Record<string,string>`。
- 新增 `updateHtmlElementColors(block, colors)`：
  - 过滤空值，得到生效规则集。
  - 若有生效规则且 `id` 缺失：生成 `grid-${Date.now()}` 并写入 `block.extraAttributes.id`。
  - 生成作用域规则：`#<id> <tag> { color: <value>; }`，写入/替换 style 块。
  - 若全部为空：移除 style 块但保留 `id`。
- 规则：
  - 仅维护 `id="<grid-id>-colors"` 的专用 style，不影响用户手写其它 style。
  - style 块位置固定为 `block.content` 顶部（若不存在则 prepend）。

### 2) 新增「区块内元素颜色设置」UI 组件
**文件**：`src/ui/components/design-inspector.ts`

- 新增 `createElementColorCompositeField(container, label, block, onChange)`：
  - 在一个分组内渲染 11 行元素配置（每行：元素名 + 文本颜色输入 + `<input type="color">` + reset 按钮）。
  - 文本输入支持现有颜色格式校验；无效时沿用现有 `is-invalid` 表现。
  - reset 行为：清空该元素值并触发 `onChange`，删除对应规则。
  - 初始值来自 `getHtmlElementColors(block)`，确保重新选中 block 时回显。

### 3) 集成到右侧 panel 底部
**文件**：`src/ui/components/design-inspector.ts`

- 在 `renderDesignInspector` 末段（`Fragment` 后、`CSS Class`/`Inline Style` 前）插入：
  - `createElementColorCompositeField(..., (colors) => onPatchBlock(next => updateHtmlElementColors(next, colors)))`
- 放置位置遵循“最下方新增设置组件”的需求，同时不影响已有字段顺序与事件链路。

### 4) 补充样式（仅新增，不复用易冲突 utility）
**文件**：`styles.css`

- 新增命名空间样式（如）：
  - `.slides-rup-design-maker-element-colors-*`
  - 包含分组容器、行布局、元素标签、reset 按钮尺寸与间距、折叠态/滚动行为。
- 与已有 `slides-rup-design-maker-color-controls` 协同，确保在窄 panel 下不挤压错位。

### 5) 测试补充
**文件**：`src/__tests__/test.ts`

- 新增针对 helper 的单测：
  - `getHtmlElementColors`：无 style、存在 style、部分元素规则解析。
  - `updateHtmlElementColors`：自动生成 id、追加/替换规则、全部清空删除 style 且保留 id。
- 在 `runTests()` 中注册新用例，保持当前测试组织风格。

## Assumptions & Decisions
- 决策：Grid 唯一标识使用属性 `id`（存于 `extraAttributes.id`），不新建自定义属性名，便于模板可读性。
- 决策：style 作用域选择 `#<grid-id> <tag>`，优先级足够且可控，不引入 `!important`。
- 决策：清空所有元素时只移除专用 style 块，不移除已生成 `id`（符合需求）。
- 假设：用户可能在 `content` 中写入其它 style，本功能只管理 `id="<grid-id>-colors"` 的块。

## Verification Steps
- 构建验证：
  - 执行 `npm run build`，确保 TS 类型与构建通过。
- 功能验证（手动）：
  - 选中 Grid，在右侧底部看到“区块内元素颜色设置”。
  - 设置 `h1` 颜色后，`block.content` 顶部出现专用 `<style>`，且 Grid 自动带 `id`（原无 id 时）。
  - 连续设置多个元素，规则按元素追加/替换。
  - 点击单项 reset，只移除该元素规则。
  - 全部 reset 后，专用 `<style>` 被删除，Grid `id` 保留。
  - 切换 block 再切回，颜色回显正确。
- 回归验证：
  - 现有 `Background/Border/Inline Style/Filter` 等 inspector 字段行为不变。
