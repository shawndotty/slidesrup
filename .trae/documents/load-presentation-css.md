# 设计渲染引擎集成演示框架样式方案

## 1. 目标与背景分析
用户希望在 Design Maker 中渲染时，能够加载对应演示框架（Slides Extended 或 Advanced Slides）的内置 CSS（`main.css` 或 `main-dark.css`）。由于在 Grid 块属性中可能会写入依赖于这些演示框架内置的 class 类名，如果 Design Maker 不加载对应的 CSS，这些样式在可视化设计中就无法预览。

**当前状态**：
- 插件的设置项 `presentationPlugin` 决定了目标演示框架。
- 目标 CSS 文件路径位于 Obsidian 配置目录下的 `plugins/slides-extended/dist/Styles/` 或 `plugins/obsidian-advanced-slides/dist/Styles/`。
- 当前系统根据 `document.body.classList.contains("theme-dark")` 区分深浅色主题，分别对应 `main-dark.css` 与 `main.css`。
- Design Maker 当前通过 `themeRawCss` 加载主题样式，但未包含上述演示框架的基础样式。

## 2. 具体修改方案

### 2.1 修改视图层 (`src/ui/views/design-maker-view.ts`)
- **新增属性与方法**：
  - 增加私有属性 `private presentationCss: string = "";`
  - 增加私有异步方法 `_loadPresentationCss()`：
    1. 根据 `this.plugin.settings.presentationPlugin` 判断插件目录名。
    2. 根据 `document.body.classList.contains("theme-dark")` 判断使用 `main.css` 还是 `main-dark.css`。
    3. 拼接路径为 `${this.app.vault.configDir}/${pluginFolder}/dist/Styles/${cssFileName}`。
    4. 使用 `this.app.vault.adapter.exists` 和 `read` 读取样式内容到 `presentationCss`。
- **加载时机**：
  - 在 `_loadDraft()` 方法内，执行 `await this._loadPresentationCss();`（放在调用 `this._render()` 之前）。
- **传递参数**：
  - 在调用 `_renderCanvasOnly()` (进而调用 `renderDesignCanvas`) 和 `_renderPreviewOnly()` (进而调用 `renderDesignPreview`) 时，将 `presentationCss: this.presentationCss` 作为参数传入。
- **引入常量**：
  - 确保从 `src/constants.ts` 导入 `SLIDES_EXTENDED_PLUGIN_FOLDER` 和 `ADVANCED_SLIDES_PLUGIN_FOLDER`。

### 2.2 修改画布组件 (`src/ui/components/design-canvas.ts`)
- **扩展接口**：在 `renderDesignCanvas` 的入参选项中新增 `presentationCss?: string`。
- **注入样式**：
  - 在生成 `canvas` DOM 后，判断 `if (presentationCss.trim())`，如果存在，则创建一个 `<style>` 标签注入该 CSS 内容。
  - 注入顺序应在 `themeRawCss` 之前，以确保用户自定义的 Theme CSS 具有更高的覆盖优先级。

### 2.3 修改预览组件 (`src/ui/components/design-preview.ts`)
- **扩展接口**：在 `renderDesignPreview` 的入参选项中新增 `presentationCss?: string`。
- **注入样式**：
  - 在生成 `preview` DOM 后，判断 `if (presentationCss.trim())` 并创建对应的 `<style>` 标签。
  - 注入顺序同样在 `theme.rawCss` 之前。

## 3. 约束与假设
- 假设用户的对应插件目录中必定存在 `dist/Styles/main.css` 等文件，如果不存在则使用 `try...catch` 静默处理并将 `presentationCss` 设为空，不阻断正常渲染。
- 注入这些全局/框架级 CSS 时可能会对画布的默认布局产生轻微的副作用（例如影响边距或背景），由于 `<style>` 是直接放置于 `canvas`/`preview` 内，其样式作用域依赖于它自己的选择器，通常情况下这是预期的预览表现。

## 4. 验证步骤
1. 完成修改后执行 `npm run build`。
2. 启动 Obsidian，确保已安装对应目标演示框架并包含对应 CSS。
3. 在 Design Maker 的块属性中填入相关样式类，检查是否在画布和预览视图中正确呈现（例如字体、边距、背景色）。
4. 切换深浅主题后重载 Design Maker，确认是否正确调用了对应的 `main-dark.css`。