# Design Maker Grid 属性全量支持及编辑面板扩展规划

## 1. 目标与背景分析
用户希望在 Design Maker 中，能够直接在右侧区块属性（Inspector）面板设置所有 Advanced Slides 所支持的 `<grid>` 属性，以方便进行更加灵活的页面设计与排版。

**根据 Advanced Slides Grid 的官方文档以及当前代码分析，Grid 标签主要支持的常用属性包括：**
- **drag** (对应现有的 `width`, `height`)
- **drop** (对应现有的 `x`, `y`，以及可使用预定义命名位置如 `center`, `topleft` 等。当前仅支持 x/y 坐标数字，本计划先维持 x/y 数字输入，后续若需扩展命名位置可再做重构)
- **flow** (布局流：`col` 或 `row`，目前在数据结构里有，但没在面板里渲染出来，应使用 **Selector**)
- **bg** (背景色，新增支持，应使用 **Text / Color Selector**)
- **pad** (内边距，已在数据结构和面板里存在，Text)
- **align** (对齐方式，已存在，应使用 **Selector**)
- **border** (边框，新增支持，Text)
- **animate** (动画效果，新增支持，应使用 **Selector**)
- **opacity** (透明度，新增支持，应使用 **Slider/Number 0.1~1**)
- **rotate** (旋转角度，新增支持，应使用 **Slider/Number 0~360**)
- **filter** (滤镜，已存在，应使用 **Selector**)
- **frag** (片段/动画顺位，新增支持，Text/Number)
- **style** (对应现有的 `style` 或 Inline Style)
- **class** (对应现有的 `className` 或 CSS Class)
- **justify-content** (对应 `justifyContent`，数据结构里有但未在面板中显示，应使用 **Selector**)

**当前状态**：
- `src/types/design-maker.ts` 的 `DesignGridBlock` 接口缺失 `bg`, `border`, `animate`, `opacity`, `rotate`, `frag` 等属性。
- `src/ui/components/design-inspector.ts` 的面板仅有 TextField 和 NumberField，缺乏 `createSelectField`、`createRangeField`（或复用 number）和 `createColorField` 等更适合特定属性的控件封装。
- 很多枚举值（如 flow 的 `col | row`，align 的 `left | right | center | ...`）目前只能让用户盲填。

## 2. 具体修改方案

### 2.1 扩展数据结构 (`src/types/design-maker.ts`)
在 `DesignGridBlock` 接口中，新增以下专门控制 Advanced Slides Grid 的一级属性：
- `bg: string;`
- `border: string;`
- `animate: string;`
- `opacity: string;`
- `rotate: string;`
- `frag: string;`

同时修改相应的初始模板工厂方法，将新属性赋初值为空字符串 `""`。

### 2.2 完善解析与序列化
**解析器 (`src/services/design-maker-parser.ts`)**
- 在 `createGridBlock` 函数中，从 `attrs` 中解析新增的属性：
  - `bg: attrs.bg || ""`
  - `border: attrs.border || ""`
  - `animate: attrs.animate || ""`
  - `opacity: attrs.opacity || ""`
  - `rotate: attrs.rotate || ""`
  - `frag: attrs.frag || ""`
- 将这几个新属性加入到 `extraAttributes` 的过滤白名单中，防止重复存储：
  `["drag", "drop", "class", "style", "pad", "align", "flow", "filter", "justify-content", "bg", "border", "animate", "opacity", "rotate", "frag"]`

**生成器 (`src/services/design-maker-generator.ts`)**
- 在 `serializeAttributes` 中，补充输出新增的一级属性（如果有值的话）：
  - `if (block.bg.trim()) attrs.bg = block.bg.trim();`
  - `if (block.border.trim()) attrs.border = block.border.trim();`
  - `if (block.animate.trim()) attrs.animate = block.animate.trim();`
  - `if (block.opacity.trim()) attrs.opacity = block.opacity.trim();`
  - `if (block.rotate.trim()) attrs.rotate = block.rotate.trim();`
  - `if (block.frag.trim()) attrs.frag = block.frag.trim();`

### 2.3 扩展右侧属性编辑面板控件封装 (`src/ui/components/design-inspector.ts`)
新增以下 UI 组件辅助方法：
1. **`createSelectField`**：
   用于创建 `<select>` 元素，传入一个 option 数组。
2. **`createRangeField`** 或直接扩展 `createNumberField` 支持 `min`/`max`/`step` 参数：
   用于 opacity (0~1, step 0.1) 和 rotate (0~360, step 1)。
3. **`createColorField`** (可选，若 bg 允许填 `red` 等文字，也可以使用包含一个 `<input type="color">` 和一个 `<input type="text">` 联动的复合组件，或直接用 `createTextField` 先简单实现，这里建议直接用 text 以支持 `rgba` 和 `hsl` 或者 `color name`，与官方文档保持一致)。

### 2.4 扩展右侧属性编辑面板具体字段 (`src/ui/components/design-inspector.ts`)
按照以下逻辑替换和增加表单控件：
- **Flow**: `createSelectField` (空值, `col`, `row`)
- **Align**: `createSelectField` (空值, `left`, `right`, `center`, `justify`, `block`, `top`, `bottom`, `topleft`, `topright`, `bottomleft`, `bottomright`, `stretch`)
- **Justify Content**: `createSelectField` (空值, `start`, `end`, `center`, `space-between`, `space-around`, `space-evenly`) 
- **Background (bg)**: `createTextField` (因为 Advanced Slides 允许颜色名或 rgb/hsl 等格式，原生 color input 只支持 hex)
- **Border**: `createTextField` 
- **Animation (animate)**: `createSelectField` (空值, `fadeIn`, `fadeOut`, `slideRightIn`, `slideLeftIn`, `slideUpIn`, `slideDownIn`, `slideRightOut`, `slideLeftOut`, `slideUpOut`, `slideDownOut`, `scaleUp`, `scaleUpOut`, `scaleDown`, `scaleDownOut`, `slower`, `faster`)
- **Opacity**: `createNumberField` (带 min=0, max=1, step=0.1)
- **Rotate**: `createNumberField` (带 min=0, max=360, step=1)
- **Filter**: `createSelectField` (空值, `blur`, `bright`, `contrast`, `grayscale`, `hue`, `invert`, `saturate`, `sepia`)
- **Frag**: `createTextField` (或 number，但 frag 可能包含其他格式，安全起见用 text)

### 2.5 语言包适配 (`src/lang/locale/*.ts`)
为新增的编辑字段增加对应的翻译键值对，例如：
- "Flow"
- "Justify Content"
- "Background"
- "Border"
- "Animation"
- "Opacity"
- "Rotate"
- "Filter"
- "Fragment"

## 3. 验证步骤
1. 执行 `npm run build`。
2. 启动插件进入 Design Maker。
3. 选中某个 Grid Block，检查右侧的 Block Inspector 是否出现了 Flow, Background, Border, Animation, Opacity 等所有属性输入框，并且 Flow, Align, Justify Content, Animation, Filter 为下拉选择框。
4. 在其中填入/选择测试值（如 Background: `orange`, Flow: `row`），检查画布/预览中是否生效。
5. 点击 "Save and Apply"，查看生成的 Markdown 源码中，`<grid>` 标签是否正确包含了这些新增属性。