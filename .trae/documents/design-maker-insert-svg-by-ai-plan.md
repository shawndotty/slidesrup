# Plan：Design Maker 增加 Insert SVG By AI（含多语言）

## Summary
- 在 Design Maker 的 Block Content 区域，`Insert Unsplash image` 按钮后新增 `Insert SVG By AI` 按钮。
- 点击后复用现有 AI 模态窗口流程，让用户输入描述词，调用 AI 生成 **内联 `<svg>`** 并插入当前 Grid 的内容。
- 新增独立的 SVG 系统提示词配置（默认提示词明确：SVG 自适应 Grid 容器尺寸、继承 Grid 颜色）。
- 全流程补齐 i18n（en/zh-cn/zh-tw）文案键。

## Current State Analysis
- 按钮位置与 Block Content 入口：
  - [design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts#L2237-L2292) 已有 `insertImageButton` 与 `insertUnsplashButton`。
- AI 模态复用点：
  - [inline-style-ai-modal.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/modals/inline-style-ai-modal.ts#L4-L115) 提供通用输入-生成-应用流程。
  - [design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts#L1605-L1673)（Inline Style）与 [design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts#L1675-L1721)（Filter）已复用该模态。
- AI 服务现状：
  - [inline-style-ai-service.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/services/inline-style-ai-service.ts#L56-L156) 目前仅有 inline style / filter 两类生成。
  - 系统提示词配置来自 settings：`aiInlineStyleSystemPrompt`、`aiFilterSystemPrompt`（见 [types/index.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/types/index.ts#L177-L193) 与 [default-settings.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/models/default-settings.ts#L168-L186)）。
- Inspector 与 View 回调链路：
  - `renderDesignInspector` 入参里已有 `onGenerateInlineStyleAI`、`onGenerateFilterAI`（[design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts#L2137-L2166)）。
  - View 端在 [design-maker-view.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/views/design-maker-view.ts#L440-L483) 注入这些回调。
- i18n 入口与词典：
  - [helpers.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/lang/helpers.ts#L13-L90)
  - [en.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/lang/locale/en.ts)、[zh-cn.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/lang/locale/zh-cn.ts)、[zh-tw.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/lang/locale/zh-tw.ts)

## Assumptions & Decisions
- 已确认需求决策：
  - 插入格式：**内联 `<svg>`**（不走 Markdown 图片）。
  - 提示词管理：新增独立设置项 `AI SVG System Prompt`。
  - 生成窗口：复用现有 `InlineStyleAIModal`。
- 约束：
  - 不新增无关 UI，不改变现有 Inline Style / Filter 行为。
  - 按钮文案、模态文案、设置项文案都必须走 `t(...)`。

## Proposed Changes

### 1) 扩展设置模型与默认值（SVG 系统提示词）
**文件**
- [types/index.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/types/index.ts)
- [default-settings.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/models/default-settings.ts)

**修改**
- 在 `SlidesRupSettings` 增加 `aiSvgSystemPrompt: string`。
- 在 `DEFAULT_SETTINGS` 增加默认提示词（明确两条规则）：
  - `SVG must adapt to the Grid container size`（建议通过 `viewBox` + `width/height="100%"`）。
  - `SVG must inherit Grid color settings`（建议使用 `currentColor`，避免硬编码颜色）。

### 2) 扩展 AI 服务（SVG 生成 + 输出清洗）
**文件**
- [inline-style-ai-service.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/services/inline-style-ai-service.ts)

**修改**
- 新增 `buildSvgSystemPrompt()`：优先读 `settings.aiSvgSystemPrompt`，为空则回退默认提示词。
- 新增 `sanitizeSvgAiOutput(raw: string): string`：
  - 去除 markdown fence。
  - 仅接受以 `<svg ...>` 开头且含闭合 `</svg>` 的结果。
  - 拒绝 `<script>`、`on*=` 等显式危险片段。
  - 保持“只返回 SVG 字符串”。
- 新增 `generateSvg(prompt: string, currentContent: string): Promise<string>`：
  - 复用 `callModel`；
  - `userPrompt` 携带当前内容摘要与“希望生成图形”的描述；
  - 返回清洗后的 SVG 字符串。

### 3) 扩展 Inspector API 与按钮交互
**文件**
- [design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts)

**修改**
- 在 `renderDesignInspector` options 增加：
  - `onGenerateSvgAI?: (prompt: string, currentContent: string) => Promise<string>`
- 新增内容插入 helper（复用现有“内容追加换行”模式）：
  - `insertSvgIntoContent(content: string, svg: string): string`
- 在 Block Content action 区新增按钮 `Insert SVG By AI`：
  - 放在 `Insert Unsplash image` 后面；
  - 使用现有图标体系（例如 `sparkles` 或 `image-plus` 的 AI 语义组合）。
- 点击按钮后：
  - 复用 `InlineStyleAIModal`；
  - 调用 `onGenerateSvgAI(prompt, textarea.value)`；
  - 成功后把 `<svg>...</svg>` 插入 textarea，并触发与现有按钮一致的 `input` 更新链路。
- 兼容逻辑：
  - 当 `!app`、`!aiInlineStyleEnabled` 或 `!onGenerateSvgAI` 时按钮禁用。

### 4) 在 View 层接线 AI SVG 回调
**文件**
- [design-maker-view.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/views/design-maker-view.ts)

**修改**
- 在 `renderDesignInspector({...})` 参数中新增：
  - `onGenerateSvgAI: async (prompt, currentContent) => inlineStyleAiService.generateSvg(prompt, currentContent)`

### 5) 在高级设置页新增 SVG 提示词设置项
**文件**
- [settings-tab.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/settings-tab.ts#L1517-L1535)

**修改**
- 在 AI 相关设置区域新增：
  - `AI SVG System Prompt`
  - `Optional custom system prompt for AI SVG generation`
- 行为与现有两项系统提示词一致：修改即保存 `this.plugin.settings.aiSvgSystemPrompt`。

### 6) 多语言键补齐
**文件**
- [en.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/lang/locale/en.ts)
- [zh-cn.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/lang/locale/zh-cn.ts)
- [zh-tw.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/lang/locale/zh-tw.ts)

**新增键（示例）**
- `Insert SVG By AI`
- `Generate SVG with AI`
- `Describe desired SVG shape`
- `Use natural language to describe expected SVG`
- `Generated SVG`
- `Apply Generated SVG`
- `Generating SVG...`
- `AI SVG generated`
- `Failed to generate SVG`
- `AI SVG System Prompt`
- `Optional custom system prompt for AI SVG generation`

### 7) 测试补充
**文件**
- [src/__tests__/test.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/__tests__/test.ts)

**新增测试**
- `sanitizeSvgAiOutput`：
  - fenced svg 正常提取；
  - 非 svg 输出报错；
  - 包含 script/onload 的内容报错。
- `insertSvgIntoContent`：
  - 空内容插入；
  - 非空内容插入换行格式正确。
- i18n 完整性：
  - 把新增键加入现有 locale completeness 校验数组。

## Verification Steps
- 构建验证：
  - `npm run build` 必须通过。
- 行为验证（手动）：
  - 打开 Design Maker，选中 Grid，在 Block Content 动作区看到 `Insert SVG By AI`。
  - 点击后弹出 AI 模态，可输入描述并生成。
  - 应用后 `<svg>...</svg>` 被内联插入内容区并可保存。
  - 生成的默认提示词语义覆盖“自适应容器 + 继承颜色”。
  - 在设置页可编辑 `AI SVG System Prompt`，修改后生效。
  - 切换 en/zh-cn/zh-tw，新增按钮、模态、设置项文案均正确本地化。
- 回归验证：
  - `Insert local image`、`Insert Unsplash image`、Inline Style AI、Filter AI 现有功能不受影响。

