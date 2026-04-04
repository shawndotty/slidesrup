# Design Maker 属性面板布局调整方案

## 1. 目标与背景分析
用户指出当前右侧的 Block Inspector（属性面板）的布局不够直观：目前是上下布局（label 在上，input 在下）。
用户希望：
1. **水平布局**：除了包含 `textarea` 的设置项保持原样（上下布局）之外，其他的属性项（Text、Number、Select、Range 等）都改为左右布局（label 在左，input 在右）。
2. **统一宽度**：所有在右侧的 `input` / `select` 控件都应该保持统一的固定宽度或比例，以使得面板看起来整齐划一。

**当前状态分析**：
- `design-inspector.ts` 中所有的字段组件（`createTextField`, `createNumberField`, `createSelectField`, `createRangeField`）都在最外层包裹了 `.slides-rup-design-maker-field`，里面包含一个 `<label>` 和一个 `.slides-rup-design-maker-input`。
- 而包含 `textarea` 的属性（Block Content）也使用了 `.slides-rup-design-maker-field`。
- `styles.css` 中 `.slides-rup-design-maker-field` 的定义是 `flex-direction: column;`。
- `styles.css` 中 `.slides-rup-design-maker-input` 和 `.slides-rup-design-maker-textarea` 都是 `width: 100%`。

## 2. 具体修改方案

### 2.1 CSS 样式修改 (`styles.css`)
为了实现左右布局，我们需要修改 `.slides-rup-design-maker-field` 的 `flex-direction` 为 `row`，并设置子元素的宽度分配。但为了不影响 `textarea` 所在的上下布局，我们可以给需要上下布局的字段容器单独加一个修饰类，比如 `.is-stacked`。

**修改内容**：
```css
/* 修改为左右布局的默认态 */
.slides-rup-design-maker-field {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 10px;
}

/* 如果包含 textarea 等需要上下布局的元素，使用 is-stacked */
.slides-rup-design-maker-field.is-stacked {
	flex-direction: column;
	align-items: flex-start;
	gap: 6px;
}

/* 统一 label 样式（可选，让文字稍微紧凑） */
.slides-rup-design-maker-field label {
	flex-shrink: 0;
	width: 110px; /* 固定 label 宽度，让右侧的 input 对齐更整齐 */
	font-size: 13px;
	color: var(--text-muted);
}

.slides-rup-design-maker-field.is-stacked label {
	width: auto;
}

/* 修改输入框，让它们在右侧占据相同的固定比例 */
.slides-rup-design-maker-input,
.slides-rup-design-maker-textarea {
	flex: 1;
	min-width: 0; /* 防止内容撑破 flex 容器 */
	width: 100%;
	padding: 6px 8px; /* 稍微减小 padding 让行高更紧凑 */
	border: 1px solid var(--background-modifier-border);
	border-radius: 8px;
	background: var(--background-primary);
	color: var(--text-normal);
}
```

### 2.2 TypeScript 逻辑修改 (`src/ui/components/design-inspector.ts`)
目前仅有 "Block Content" 是 `textarea`，需要在它的外层容器上加上 `.is-stacked` 类。

在 `renderDesignInspector` 底部：
```typescript
	const contentRow = container.createDiv("slides-rup-design-maker-field");
	contentRow.addClass("is-stacked"); // <--- 新增这行
	contentRow.createEl("label", { text: t("Block Content") });
	const textarea = contentRow.createEl("textarea", {
		text: block.content,
		cls: "slides-rup-design-maker-textarea",
	});
```
对于其他的 `createTextField`、`createSelectField`、`createNumberField`、`createRangeField`，保持不变，它们将继承 CSS 修改后的 `flex-direction: row` 布局。

### 2.3 设计主题面板 (`src/ui/components/design-theme-panel.ts`) 的兼容性检查
我们需要检查 `design-theme-panel.ts` 或其它可能复用了 `.slides-rup-design-maker-field` 的地方。
如果 `design-theme-panel.ts` 里也有 `createTextField` 或 `createColorField` 并且共用了同样的 CSS 类名，那么这一改动会自动应用到主题面板，这通常也是我们期望的。如果主题面板也有 textarea（例如 `Theme CSS` 源码区），则需要同步给它们加上 `.is-stacked`。
*（经检查，`Theme CSS` 源码区的 textarea 是在 `design-maker-view.ts` 里的单独逻辑，并不共用 `field` 类，因此不受影响）*。

## 3. 验证步骤
1. 修改完毕后，运行 `npm run build`。
2. 刷新并打开 Design Maker。
3. 选中某个 Grid Block，查看右侧 Block Inspector 属性面板：
   - X, Y, Width, Height, Flow, Padding 等所有常规属性是否变为了**左侧文字、右侧输入框**。
   - 所有的右侧输入框是否对齐且宽度一致。
   - 拖动拉条（Range）或下拉选择（Select）时显示是否正常。
   - 面板最下方的 **Block Content** (textarea) 是否依然保持了**上侧文字、下侧文本框**的正常布局。