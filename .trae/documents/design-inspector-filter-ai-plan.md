# Design Inspector Filter AI 生成功能实施方案

## Summary

在 Design Maker 的区块属性中，为 `Filter` 字段增加与 `Inline Style` 同款的 AI 魔法按钮。  
用户点击后可输入自然语言描述，AI 只返回 **filter 值**（支持单个或组合，如 `blur(6px) saturate(120%)`），并默认**直接替换**当前 Filter 值。

同时新增独立配置项 `aiFilterSystemPrompt`，用于精细控制 filter 生成规则，避免污染内联样式提示词。

## Current State Analysis

### 1) Filter 当前是纯文本输入
- 文件：[design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts)
- 现状：
  - `Filter` 采用 `createTextField(container, "Filter", block.filter, ...)`。
  - 对不熟悉 CSS filter 的用户门槛高，无辅助生成能力。

### 2) 现有 AI 能力可复用
- 文件：
  - [design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts)
  - [inline-style-ai-modal.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/modals/inline-style-ai-modal.ts)
  - [inline-style-ai-service.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/services/inline-style-ai-service.ts)
- 现状：
  - Inline Style 已有魔法按钮 + 弹窗 + 生成后写入流程。
  - 服务层已有 OpenAI 兼容调用和配置读取能力。

### 3) AI 设置页已有分组
- 文件：[settings-tab.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/settings-tab.ts)
- 现状：
  - 已有 AI Assistant 分组与 `aiInlineStyleSystemPrompt`。
  - 适合补充 `aiFilterSystemPrompt`，保持配置集中。

## Assumptions & Decisions

已锁定产品决策：

1. **写入策略**：生成结果默认“直接替换” Filter 字段。  
2. **入口形态**：与 Inline Style 一致，Filter label 右侧使用魔法按钮。  
3. **Prompt 策略**：新增独立 `aiFilterSystemPrompt`（不复用内联样式 prompt）。  

技术约束：

- AI 输出必须是 filter value（不能是 `filter:` 声明、不能包含选择器/括号块/Markdown）。
- 支持组合值，如：`contrast(110%) brightness(95%)`。

## Proposed Changes

### A. 服务层：新增 Filter 专用生成与校验
- 文件：`src/services/inline-style-ai-service.ts`
- 改动：
  1. 新增 `sanitizeFilterAiOutput(raw: string): string`：
     - 去掉代码块围栏；
     - 拒绝 `filter:` 前缀、`;`、`{}`、`@`、换行噪音；
     - 允许常见 filter 函数组合（`blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia`）。
  2. 新增 `generateFilterValue(prompt: string, currentFilter: string): Promise<string>`：
     - 复用同一 API 调用链；
     - 使用 `aiFilterSystemPrompt`（若为空则使用内置默认 prompt）。
- Why：
  - 保证输出严格为 filter 值，降低错误写入风险。

### B. 设置模型与默认值扩展
- 文件：
  - `src/types/index.ts`
  - `src/models/default-settings.ts`
- 改动：
  - 新增字段 `aiFilterSystemPrompt: string`。
  - 默认值提供内置约束提示词（仅输出 filter value）。

### C. 设置页：新增 Filter Prompt 配置
- 文件：`src/ui/settings-tab.ts`
- 改动：
  - 在 AI Assistant 分组新增 `AI Filter System Prompt` 文本域；
  - 文案说明该 prompt 仅作用于 Filter 生成。

### D. Inspector：Filter 字段增加 AI 按钮（同款体验）
- 文件：`src/ui/components/design-inspector.ts`
- 改动：
  1. 新增 `createFilterField`（结构参考 `createCssEditorField`）：
     - label + 魔法按钮；
     - text input 保留手输；
     - 点击魔法按钮打开 `InlineStyleAIModal`（可复用弹窗 UI）。
  2. 弹窗确认后将结果直接写回输入框，并触发 `onPatchBlock(nextBlock.filter = value)`。
  3. 无 AI 配置时按钮禁用并保持与 Inline Style 一致状态样式。
- Why：
  - 统一交互习惯，降低学习成本。

### E. View 层透传 Filter AI 回调
- 文件：`src/ui/views/design-maker-view.ts`
- 改动：
  - `renderDesignInspector` 参数中新增 `onGenerateFilterAI`（及可选开关）；
  - 回调调用 `inlineStyleAiService.generateFilterValue(prompt, currentFilter)`。

### F. i18n 文案补齐
- 文件：
  - `src/lang/locale/en.ts`
  - `src/lang/locale/zh-cn.ts`
  - `src/lang/locale/zh-tw.ts`
- 新增键（示例）：
  - `Generate Filter with AI`
  - `AI Filter System Prompt`
  - `Return filter value only`
  - `Failed to generate filter value`

### G. 测试与文档
- 文件：
  - `src/__tests__/test.ts`
  - `README.md`
- 新增测试：
  1. `sanitizeFilterAiOutput`：合法单值/组合值通过；
  2. 非法输出（含 `filter:`、`{}`、`;`、markdown）被拒绝；
  3. 生成结果替换写入逻辑正确。
- 文档：
  - 补充 Design Inspector 中 Filter 现支持 AI 辅助生成说明。

## Verification Steps

1. 构建与类型检查  
   - `npm run build`

2. 单测  
   - `npx esbuild src/__tests__/test.ts --bundle --platform=node --format=cjs --external:obsidian --outfile=/tmp/slidesrup-test-filter-ai.cjs`
   - `node -e "...require('/tmp/slidesrup-test-filter-ai.cjs')"`

3. 手工回归  
   - 打开 Design Maker -> Block Inspector -> Filter；
   - 点击魔法按钮，输入“轻微模糊并提高饱和度”；
   - 生成结果应为如 `blur(2px) saturate(120%)`；
   - 点击应用后，Filter 文本框与画布效果同步更新；
   - AI 未配置时按钮禁用且不报错；
   - 语言切换后按钮文案正常国际化。

