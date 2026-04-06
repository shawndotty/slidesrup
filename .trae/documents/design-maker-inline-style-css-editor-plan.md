# Design Maker 区块内联样式 CSS Editor 改造计划

## Summary

目标是在 Design Maker 的区块属性面板中，把当前 `Inline Style` 的普通文本输入升级为可用的 CSS 编辑器（CodeMirror），并满足：

- 支持多行编辑与自动补全；
- 读取已有单行 style 时自动转为多行展示；
- 仅在**模板生成阶段**把样式转成单行；
- 生成规则为按声明清洗后使用 `; ` 连接；
- 不改变现有拖拽、保存与页面结构逻辑。

## Current State Analysis

### 1) Inspector 现状
- 文件：[design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts)
- 当前 `Inline Style` 使用普通 `createTextField`：
  - [design-inspector.ts:L847-L851](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts#L847-L851)
- 这意味着：
  - 不支持多行声明编辑体验；
  - 无 CSS 编辑器能力（补全/语法高亮）。

### 2) 项目内已有 CSS Editor 参考实现
- 文件：[settings-tab.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/settings-tab.ts)
- 已使用 CodeMirror 组合：
  - `EditorView`, `EditorState`, `basicSetup`, `css()`, `autocompletion()`, `oneDark`
  - 参考段落 [settings-tab.ts:L1469-L1539](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/settings-tab.ts#L1469-L1539)

### 3) 生成链路现状
- 文件：[design-maker-generator.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/services/design-maker-generator.ts)
- `style` 当前直接 `trim()` 后写入 `attrs.style`：
  - [design-maker-generator.ts:L39](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/services/design-maker-generator.ts#L39)
- 目前没有“多行 -> 标准单行”的规范化步骤。

## Assumptions & Decisions

基于你已确认的决策，本次按以下规则实现：

1. **存储策略**：`block.style` 在编辑中保留多行；仅生成模板时转单行。  
2. **输出规则**：按声明清洗并以 `; ` 拼接（规范单行 style）。  
3. **编辑器形态**：默认展开小型 CSS Editor（4~6 行高度）。  
4. **回显规则**：模板中已有单行 style 打开时自动转多行展示。  

## Proposed Changes

### A. Inspector：引入 Inline Style CSS Editor
- 文件：`src/ui/components/design-inspector.ts`
- 改动：
  1. 新增样式编辑器渲染函数（替代当前 `createTextField` 的 inline style 分支）；
  2. 引入 CodeMirror 依赖（与 settings-tab 保持一致）；
  3. 初始化时把单行样式转为多行声明格式；
  4. 编辑变化时写回 `nextBlock.style`（保留多行，不在此处压单行）。
- Why：
  - 直接解决“普通文本框不利于自定义样式”的体验问题；
  - 复用项目已验证的编辑器技术栈，降低风险。

### B. 生成器：新增 style 单行标准化
- 文件：`src/services/design-maker-generator.ts`
- 改动：
  1. 新增 `normalizeInlineStyleForTemplate(style: string): string`；
  2. 规则：
     - 按 `;` 切分声明；
     - 去掉空声明与多余空白；
     - 声明间以 `; ` 连接；
     - 尾部补 `;`（保持属性值语义稳定）。
  3. `serializeAttributes` 中 `style` 改为调用该规范化函数后再写入。
- Why：
  - 保证模板里 style 输出统一、紧凑且可读；
  - 满足“用户可多行写，模板单行存”的需求。

### C. Inspector 样式（编辑器容器）
- 文件：`styles.css`
- 改动：
  1. 增加区块属性中内联样式编辑器容器样式；
  2. 高度控制在小编辑器区间（例如 120~160px）；
  3. 与现有 Inspector 深色视觉风格保持一致。
- Why：
  - 避免 UI 突兀，确保编辑器在属性面板内可用且不挤压其他字段。

### D. 测试与回归
- 文件：`src/__tests__/test.ts`
- 新增测试：
  1. 单行 style -> 多行显示格式化函数测试；
  2. 多行 style -> 生成模板单行规则测试（`; ` 连接）；
  3. 空白声明/多余分号/换行场景清洗测试；
  4. 现有模板生成回归测试确保未破坏其他属性。
- Why：
  - 将格式化逻辑变成可回归的纯函数，避免 UI 测试脆弱性。

## Verification Steps

1. 构建验证  
   - `npm run build`

2. 测试验证  
   - `npx esbuild src/__tests__/test.ts --bundle --platform=node --format=cjs --external:obsidian --outfile=/tmp/slidesrup-test.cjs`  
   - `node -e "..."`（沿用项目当前 mock obsidian 执行方式）

3. 手工功能回归（Design Maker）  
   - 打开区块属性，Inline Style 显示 CodeMirror 编辑器；  
   - 输入多行 CSS 声明并自动补全可用；  
   - 加载已有单行 style 时自动多行回显；  
   - 保存设计后模板中的 `style="..."` 为单行且声明以 `; ` 分隔；  
   - 重新加载设计后编辑器内容可继续正确编辑。  

