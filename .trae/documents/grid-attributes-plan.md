# Design Maker Grid 属性全量支持及编辑面板扩展规划

## 1. 目标与背景分析
用户希望在 Design Maker 中，能够直接在右侧区块属性（Inspector）面板设置所有 Advanced Slides 所支持的 `<grid>` 属性，以方便进行更加灵活的页面设计与排版。

**根据 Advanced Slides Grid 的官方文档以及当前代码分析，Grid 标签主要支持的常用属性包括：**
- **drag** (对应现有的 `width`, `height`)
- **drop** (对应现有的 `x`, `y`，以及可使用预定义命名位置如 `center`, `topleft` 等)
- **class** (对应现有的 `className` 或 CSS Class)
- **style** (对应现有的 `style` 或 Inline Style)
- **bg** (背景色，新增支持)
- **border** (边框，新增支持)
- **animate** (动画效果，如 `fadeIn`, `slideRightIn` 等，新增支持)
- **opacity** (透明度，新增支持)
- **flow** (布局流：`col` 或 `row`，目前在数据结构里有，但没在面板里渲染出来)
- **pad** (内边距，已在数据结构和面板里存在，但可强化描述)
- **align** (对齐方式，已存在)
- **filter** (滤镜，已存在)
- **justify-content** (对应 `justifyContent`，数据结构里有但未在面板中显示)

**当前状态**：
- `src/types/design-maker.ts` 的 `DesignGridBlock` 接口已包含：`rect` (`x`, `y`, `width`, `height`), `className`, `style`, `pad`, `align`, `flow`, `filter`, `justifyContent`，以及兜底的 `extraAttributes`。
- 但 `src/ui/components/design-inspector.ts` 的面板中只渲染了：X, Y, Width, Height, CSS Class, Padding, Align, Inline Style，缺失了 Flow, Filter, Justify Content，也未支持 Bg, Border, Animate, Opacity 的快速编辑。
- 解析和序列化侧 (`design-maker-parser.ts` 和 `design-maker-generator.ts`)，虽然能够通过 `extraAttributes` 保留未知属性，但将新增的关键属性直接提拔为一级属性或者确保它们在 `extraAttributes` 中被正确编辑，会极大提升用户体验。

## 2. 具体修改方案

### 2.1 扩展数据结构 (`src/types/design-maker.ts`)
在 `DesignGridBlock` 接口中，新增以下专门控制 Advanced Slides Grid 的一级属性：
- `bg: string;`
- `border: string;`
- `animate: string;`
- `opacity: string;`

同时，修改创建新 Block（比如在 `design-canvas.ts` 的 `createTemplateBlock` 及 `design-maker-parser.ts` 的各种 factory 中）的代码，初始化这些新增属性为空字符串 `""`。

### 2.2 完善解析与序列化
**解析器 (`src/services/design-maker-parser.ts`)**
- 在 `createGridBlock` 函数中，从 `attrs` 中解析新增的属性：
  - `bg: attrs.bg || ""`
  - `border: attrs.border || ""`
  - `animate: attrs.animate || ""`
  - `opacity: attrs.opacity || ""`
- 将这四个新属性加入到 `extraAttributes` 的过滤白名单中，防止重复存储：
  `["drag", "drop", "class", "style", "pad", "align", "flow", "filter", "justify-content", "bg", "border", "animate", "opacity"]`

**生成器 (`src/services/design-maker-generator.ts`)**
- 在 `serializeAttributes` 中，补充输出新增的一级属性（如果有值的话）：
  - `if (block.bg.trim()) attrs.bg = block.bg.trim();`
  - `if (block.border.trim()) attrs.border = block.border.trim();`
  - `if (block.animate.trim()) attrs.animate = block.animate.trim();`
  - `if (block.opacity.trim()) attrs.opacity = block.opacity.trim();`

### 2.3 扩展右侧属性编辑面板 (`src/ui/components/design-inspector.ts`)
在原有的属性输入框下方，依次添加新的输入字段（TextField）：
1. **Flow** (`block.flow`)
2. **Justify Content** (`block.justifyContent`)
3. **Background** (`block.bg`)
4. **Border** (`block.border`)
5. **Animation** (`block.animate`)
6. **Opacity** (`block.opacity`)
7. **Filter** (`block.filter`)

由于面板属性逐渐增多，可考虑使用 `createTextField` 直接创建，保证用户能够随时修改。

### 2.4 语言包适配 (`src/lang/locale/*.ts`)
为新增的编辑字段增加对应的翻译键值对，例如：
- "Flow"
- "Justify Content"
- "Background"
- "Border"
- "Animation"
- "Opacity"
- "Filter"

## 3. 约束与假设
- 对于属性值的合法性校验（比如 opacity 是不是 0-1 的数字，animate 是不是合法的动画类型），为了保持灵活性，暂不在输入框做强制校验，允许用户自由输入。
- 考虑到 Drop 支持预定义名称（如 `topleft`），当前 `x, y` 作为坐标输入，可能覆盖不了命名位置，但这是更深层次的重构，本次改动聚焦于补齐缺失的属性编辑能力。

## 4. 验证步骤
1. 执行 `npm run build`。
2. 启动插件进入 Design Maker。
3. 选中某个 Grid Block，检查右侧的 Block Inspector 是否出现了 Flow, Background, Border, Animation, Opacity 等所有属性输入框。
4. 在其中填入测试值（如 Background: `orange`），检查画布/预览中是否生效。
5. 点击 "Save and Apply"，查看生成的 Markdown 源码中，`<grid>` 标签是否正确包含了这些新增属性。