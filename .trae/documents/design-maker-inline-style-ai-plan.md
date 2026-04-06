# Design Maker 内联样式 AI 生成功能实施方案

## Summary

目标是在 Design Maker 的「区块属性 -> 内联样式」区域新增 AI 生成入口（魔法图标），用户可通过自然语言描述样式意图，调用大模型生成**仅内联声明**的 CSS，并在确认后一键应用到编辑器。

本方案采用：
- **OpenAI 兼容接口**（baseURL + model + apiKey）；
- 默认模型 `gpt-4.1-mini`；
- 结果交互为「预览 + 一键应用」；
- API Key 管理为「优先钥匙串，失败回退设置项并提示风险」；
- 设置页新增独立「AI Assistant」分组（通用可复用）。

## Current State Analysis

### 1) 内联样式编辑器现状
- 文件：[design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts)
- 已有 CodeMirror CSS 编辑器（`createCssEditorField`），并支持自动补全；当前无 AI 入口、无对话框、无生成/应用流程。

### 2) 样式生成链路
- 文件：[design-maker-generator.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/services/design-maker-generator.ts)
- 已有 `normalizeInlineStyleForTemplate`，可将多行声明在生成模板时转为单行（`; ` 连接）。该能力可直接复用，避免重复格式化逻辑。

### 3) 设置页与服务架构
- 文件：
  - [settings-tab.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/settings-tab.ts)
  - [main.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/main.ts)
  - [services/index.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/services/index.ts)
  - [types/index.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/types/index.ts)
- 当前设置页有完整的分组渲染与保存机制，服务层可按依赖注入新增 AI Service；`SlidesRupSettings` 需扩展 AI 配置字段。

### 4) i18n 现状
- 文件：[helpers.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/lang/helpers.ts)
- 已支持 `t()` 国际化映射，可新增 AI 相关文案键并复用现有多语言体系。

## Assumptions & Decisions

- 首版只支持 **OpenAI 兼容**调用协议，不内置 Anthropic/Ollama 专用协议。
- 生成结果必须是「内联声明列表」（如 `color: ...;`），禁止选择器、`@media`、`@keyframes`、HTML/JS 注入片段。
- AI 返回内容先展示在对话框预览，用户点击“应用”后才写入当前 block 的 style。
- API Key 优先通过 Obsidian 钥匙串接口读写；若运行环境不可用则回退至设置项存储，并显示风险提示文案。
- 默认模型：`gpt-4.1-mini`（用户可在设置覆盖）。

## Proposed Changes

### A. 新增 AI 生成服务（核心）
- 新文件：`src/services/inline-style-ai-service.ts`
- 主要职责：
  1. 组装 OpenAI 兼容请求（baseURL、model、apiKey、prompt）；
  2. 对返回文本执行**内联声明白名单校验/清洗**；
  3. 输出结构化结果：`{ cssText, warnings, rawResponse }`；
  4. 提供错误分类（鉴权失败、网络超时、输出非法、配置信息缺失）。
- Why：
  - 将模型调用与 UI 解耦，便于后续复用到其他编辑场景。

### B. Key 管理服务（钥匙串优先）
- 新文件：`src/services/secret-store-service.ts`
- 主要职责：
  1. `getApiKey(providerId)` / `setApiKey(providerId, key)`；
  2. 运行时能力探测：钥匙串可用则走安全存储，不可用则回退 settings；
  3. 回退时提供 `isFallback` 标识供 UI 警示。
- Why：
  - 满足“保护 API Key”目标，并兼容不同 Obsidian/平台能力差异。

### C. 扩展设置模型与默认值
- 文件：
  - `src/types/index.ts`
  - `src/models/default-settings.ts`
- 新增字段（建议）：
  - `aiInlineStyleEnabled: boolean`
  - `aiProviderType: "openai-compatible"`
  - `aiProviderBaseUrl: string`
  - `aiProviderModel: string`（默认 `gpt-4.1-mini`）
  - `aiProviderApiKeyFallback: string`（仅回退存储用）
  - `aiInlineStyleSystemPrompt: string`（可选扩展）

### D. 设置页新增「AI Assistant」分组
- 文件：`src/ui/settings-tab.ts`
- 改动：
  1. 新增分组标题与描述；
  2. 新增开关/下拉/文本输入：启用、Base URL、Model；
  3. 新增 API Key 输入（掩码 + 测试连接）并调用 Secret Store；
  4. 显示钥匙串能力状态与回退风险提示。
- Why：
  - 与用户要求一致，形成统一 AI 配置入口。

### E. Inspector 增加魔法图标与 AI 对话框
- 文件：`src/ui/components/design-inspector.ts`
- 改动：
  1. 在「Inline Style」label 右侧新增魔法图标按钮；
  2. 点击后打开弹窗（textarea 输入自然语言 + 生成按钮 + 结果预览 + 应用按钮）；
  3. 应用时将 AI 结果写入 CodeMirror 编辑器内容并触发 `onPatchBlock`；
  4. 对非法返回（含选择器/@规则）进行阻断并提示。
- Why：
  - 保持用户编辑主流程不变，仅新增“辅助生成”能力。

### F. 服务注入与调用链接入
- 文件：
  - `src/services/index.ts`
  - `src/main.ts`
  - `src/ui/views/design-maker-view.ts`（必要时透传 service 到 inspector）
- 改动：
  - 将 `inlineStyleAiService` 与 `secretStoreService` 接入插件服务容器；
  - inspector 通过 view 传参与 service 调用，不直接依赖 plugin 全局。

### G. i18n 文案补齐
- 文件：
  - `src/lang/locale/en.ts`
  - `src/lang/locale/zh-cn.ts`
  - `src/lang/locale/zh-tw.ts`
- 新增文案：
  - AI 按钮 tooltip、对话框标题、输入占位、生成中、应用、错误提示、钥匙串回退警告等。

### H. 测试与质量保障
- 文件：`src/__tests__/test.ts`（新增纯函数与服务层测试）
- 覆盖点：
  1. AI 输出清洗：剔除非声明内容；
  2. 仅声明语法校验（CSS2.1/3 常见属性、`var()`、`calc()`）；
  3. 生成失败/超时/401 等错误分支；
  4. secret store 钥匙串可用/不可用回退行为；
  5. 应用前预览逻辑不覆盖现有 style，应用后才写入。

## Verification Steps

1. 构建与类型检查
   - `npm run build`
2. 单元测试
   - `npx esbuild src/__tests__/test.ts --bundle --platform=node --format=cjs --external:obsidian --outfile=/tmp/slidesrup-test-ai-inline-style.cjs`
   - `node -e "...require('/tmp/slidesrup-test-ai-inline-style.cjs')"`
3. 手工回归（关键）
   - 在 Design Maker 中点击内联样式魔法图标，输入自然语言并生成；
   - 预览结果可见，点击“应用”后写入编辑器；
   - 保存设计后模板中 style 仍按单行规则输出；
   - 切换设置页模型/URL 后生成行为可即时生效；
   - 钥匙串不可用场景下提示回退存储风险且功能仍可用。

