# Design Maker Filter 属性输入与渲染增强方案

## 1. 目标与背景分析
用户指出当前在 Design Maker 中对 Grid 的 `filter` 属性配置不够正确：
- 当前 `filter` 的输入方式只是一个简单的下拉列表（Selector），里面列出了诸如 `blur`, `brightness`, `contrast` 等选项。
- 实际上，CSS 的 `filter` 需要**函数加参数**的格式才能生效，例如 `blur(10px)` 或 `brightness(150%)`。单纯填入 `blur` 会被浏览器判定为无效样式。
- 此外，Advanced Slides 支持的 `filter` 语法完全等同于 CSS 原生 `filter`。

**目标**：
1. 修改 `design-inspector.ts` 中 `Filter` 的输入控件：由单纯的 `createSelectField` 改回支持自由输入的 `createTextField`，或者保留 `createTextField` 的同时给用户输入格式提示（比如 Placeholder: `blur(5px) drop-shadow(...)`），因为 `filter` 常常是多个函数组合的。
2. 修改 `design-canvas.ts` 和 `design-preview.ts`，确保将 `block.filter` 的值正确注入到区块的 `style.filter` 中（类似于之前对 `rotate` 和 `opacity` 的处理）。

## 2. 具体修改方案

### 2.1 修复渲染引擎 (`design-canvas.ts` 和 `design-preview.ts`)
在渲染 `block` 时，将 `block.filter` 应用到元素的内联样式上。
- 在 `design-canvas.ts` 中：
  ```typescript
  if (block.filter && block.filter.trim()) {
      el.style.filter = block.filter.trim();
  }
  ```
- 在 `design-preview.ts` 中做同样的修改。
这样只要用户输入的 filter 值是合法的 CSS 函数（如 `blur(10px)`），画布和预览中就会立即生效。

### 2.2 修改属性面板控件 (`design-inspector.ts`)
由于 CSS 的 `filter` 属性非常灵活（支持多个函数叠加，参数单位包括 `px`, `%`, `deg` 等），使用下拉框不仅限制了参数的输入，也限制了多个滤镜组合的能力。

- 将原来用于 `Filter` 的 `createSelectField` 移除。
- 改回使用 `createTextField`。
- 在 `createTextField` 或面板中，可以考虑给 `Filter` 提供一个友好的示例作为指引（受限于 `createTextField` 的接口，也可以直接让用户输入）。这里我们将调用 `createTextField`，并信任用户会参考文档输入诸如 `blur(5px)` 的内容。

### 2.3 语言包清理 (`src/lang/locale/*.ts`)
之前为 Filter 选项增加了许多多余的翻译（如 "Blur": "模糊", "Bright": "高亮", "Contrast": "对比度" 等）。既然改为自由文本输入，这些下拉选项的翻译键就不再需要了，可以选择性地清理掉它们，保持语言文件整洁。

## 3. 验证步骤
1. 执行 `npm run build`。
2. 启动插件进入 Design Maker。
3. 选中某个 Grid Block，在右侧 Inspector 面板的 `Filter` 输入框中输入 `blur(10px)` 或者 `drop-shadow(4px 4px 10px blue)`。
4. 检查画布（Design）和预览（Preview）中的该区块是否正确呈现了模糊或阴影效果。
5. 检查保存的源码中是否正确写入了 `filter="blur(10px)"`。