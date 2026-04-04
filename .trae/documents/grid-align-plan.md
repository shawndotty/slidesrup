# Design Maker Grid 布局与对齐属性支持计划

## 1. 目标与背景分析
用户反馈：在 Design Maker 的 Grid 中输入文字后，如果去设置它的对齐方式（align 等），在设计和预览视图中是不起作用的。
我们需要支持 Advanced Slides 中关于 Grid 对齐（`align`）的特性，直接在 Design Maker 中渲染出来。

**Advanced Slides 中 Grid 的排版行为**：
当给 `<grid>` 设置 `align` 或者 `flow` / `justify-content` 时，实质上是应用了 flexbox 相关的 CSS 样式。

为了在 `design-canvas.ts` 和 `design-preview.ts` 中实现所见即所得，我们需要做以下样式映射：
由于我们的 Grid 本质是一个绝对定位的容器，要在内部实现对齐，我们应该将其设置为 flex 容器，并根据属性值设置对应的 flex 属性。

## 2. 映射规则

### 2.1 Flow (布局流向)
- `col` -> `flex-direction: column`
- `row` -> `flex-direction: row`
- *默认*: `column`（通常 Grid 的默认流是列，或者至少要指定一个默认的 flex 才能使对齐生效）。

### 2.2 Align (主要对齐)
`align` 在 Advanced Slides 中常常既影响文本对齐（`text-align`）又影响交叉轴/主轴对齐。我们可以使用以下规则模拟（以 flex 布局为基础）：

将 `display` 强制设置为 `flex`。
如果设置了 `align`：
- `left` / `topleft` / `bottomleft` -> `align-items: flex-start`, `text-align: left`
- `right` / `topright` / `bottomright` -> `align-items: flex-end`, `text-align: right`
- `center` -> `align-items: center`, `text-align: center`
- `justify` -> `text-align: justify`
- `stretch` -> `align-items: stretch`
- `top` / `topleft` / `topright` -> `justify-content: flex-start` (针对 col 流向)
- `bottom` / `bottomleft` / `bottomright` -> `justify-content: flex-end` (针对 col 流向)

*注：为了不过度复杂化，我们可以提取一个工具函数 `applyGridFlexStyles(el, block)` 来集中处理 `align`, `flow`, `justifyContent`，因为它们是相互关联的。*

### 2.3 Pad (内边距)
`block.pad` 的值应该直接赋给 `el.style.padding`，这样内边距也能实时生效。

## 3. 具体修改方案

### 3.1 提取辅助函数
在 `src/ui/components/design-canvas.ts`（或者单独的 util 里，考虑到 `design-preview.ts` 也要用，最好写一个独立的函数，或者直接在两者中复制这小段逻辑）：
```typescript
function applyGridFlexStyles(el: HTMLElement, block: DesignGridBlock) {
	el.style.display = "flex";
	
	// Flow
	const flow = block.flow.trim().toLowerCase();
	el.style.flexDirection = flow === "row" ? "row" : "column";
	
	// Pad
	if (block.pad && block.pad.trim()) {
		el.style.padding = block.pad.trim();
	}
	
	// Justify Content (Explicit override)
	if (block.justifyContent && block.justifyContent.trim()) {
		el.style.justifyContent = block.justifyContent.trim();
	} else {
		// Default justify-content based on flow if not overridden by align later
		el.style.justifyContent = "center"; // default center
	}

	// Default align-items
	el.style.alignItems = "center"; // default center

	// Align
	if (block.align && block.align.trim()) {
		const align = block.align.trim().toLowerCase();
		
		if (align.includes("left")) {
			el.style.alignItems = "flex-start";
			el.style.textAlign = "left";
		} else if (align.includes("right")) {
			el.style.alignItems = "flex-end";
			el.style.textAlign = "right";
		} else if (align === "center") {
			el.style.alignItems = "center";
			el.style.textAlign = "center";
		} else if (align === "stretch") {
			el.style.alignItems = "stretch";
		} else if (align === "justify") {
			el.style.textAlign = "justify";
		}
		
		// Handle vertical alignment if justify-content wasn't explicitly set
		if (!block.justifyContent || !block.justifyContent.trim()) {
			if (align.includes("top")) {
				el.style.justifyContent = "flex-start";
			} else if (align.includes("bottom")) {
				el.style.justifyContent = "flex-end";
			}
		}
	}
}
```

### 3.2 应用到 `design-canvas.ts` 和 `design-preview.ts`
在这两个文件的渲染块循环中，加入对 `applyGridFlexStyles` 的调用（紧接在应用 `bg`, `opacity` 等样式的后面）。

## 4. 验证步骤
1. 执行 `npm run build`。
2. 启动插件进入 Design Maker。
3. 选中某个带文字的 Grid Block。
4. 修改 Flow 为 Row/Column，观察内容排布变化。
5. 修改 Align 为 Top Left, Bottom Right 等，观察文字是否正确靠左/右上/右下对齐。
6. 检查画布与预览区域表现是否一致。