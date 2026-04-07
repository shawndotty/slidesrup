# Design Inspector Padding 组合设置改造方案

## Summary

将区块属性里的 `Padding` 从单文本输入改为四向组合输入：
- `padding-top`
- `padding-right`
- `padding-bottom`
- `padding-left`

每项均为整数输入，最小值 `0`，默认值 `0`。  
写回时合并为四值形式，并按已确认规则统一输出 `px` 单位：`toppx rightpx bottompx leftpx`。  
同时支持对现有 `pad` 字符串按 CSS shorthand 规则解析并回填四个输入框；生成模板时始终写入四值。

## Current State Analysis

### 1) Inspector 当前实现
- 文件：[design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts)
- 现状：
  - 当前 `Padding` 使用 `createTextField(container, "Padding", block.pad, ...)`（单输入）。
  - 已有 `Border` 组合控件与 `Background` color picker，可复用交互风格和校验模式。

### 2) 数据链路现状
- 文件：
  - [design-maker-parser.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/services/design-maker-parser.ts)
  - [design-maker-generator.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/services/design-maker-generator.ts)
- 现状：
  - parser 读取 `attrs.pad` 到 `block.pad`（字符串直存）。
  - generator 在 `serializeAttributes` 中直接输出 `attrs.pad = block.pad.trim()`。
  - 未做四向结构化解析和规范化输出。

### 3) 运行时消费
- 文件：[design-canvas.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-canvas.ts)
- 现状：
  - 运行时直接 `el.style.padding = block.pad.trim()`，只要是合法 CSS padding 字符串即可生效。

## Assumptions & Decisions

已确认：

1. 四个输入仅允许整数，最小值 0。  
2. 合并输出统一使用 `px` 单位。  
3. 解析已有 `pad` 时遵循 CSS shorthand 规则：  
   - 1 值：`a` -> `a a a a`
   - 2 值：`a b` -> `a b a b`
   - 3 值：`a b c` -> `a b c b`
   - 4 值：`a b c d` -> `a b c d`
4. 生成模板时始终写成四值形式（`pad="Tpx Rpx Bpx Lpx"`）。

## Proposed Changes

### A. Padding 解析/合并工具函数
- 文件：`src/ui/components/design-inspector.ts`
- 新增函数：
  - `parsePaddingComposite(pad: string): { top,right,bottom,left }`
  - `composePaddingComposite({top,right,bottom,left}): string`
  - `clampPaddingValue(value: number): number`
- 解析策略：
  - 从 `pad` 拆分 token，解析 `px` 或纯数字（其它单位/非法回退 0）；
  - 按 shorthand 规则扩展到四值；
  - 最终回填为整数且不小于 0。

### B. Inspector 组合控件替换
- 文件：`src/ui/components/design-inspector.ts`
- 新增 `createPaddingCompositeField(...)`：
  - 四个 number input（Top/Right/Bottom/Left）；
  - 每项 `min=0`、`step=1`；
  - 任意变更后合并并回写 `nextBlock.pad`。
- 替换原调用：
  - `createTextField(container, "Padding", block.pad, ...)` -> `createPaddingCompositeField(...)`。

### C. 样式
- 文件：`styles.css`
- 新增组合布局样式（四列输入），与现有 inspector 视觉一致：
  - 示例类：`.slides-rup-design-maker-padding-controls`。

### D. 生成阶段规范化（确保模板四值输出）
- 文件：`src/services/design-maker-generator.ts`
- 在 `serializeAttributes` 处理 `pad` 时：
  - 调用统一的 padding 规范化逻辑，将任意输入规整为四值 `px`；
  - 确保写出 `pad="Tpx Rpx Bpx Lpx"`。

### E. 解析阶段兼容（从模板回填 Inspector）
- 文件：`src/services/design-maker-parser.ts`（必要时）
- 若当前仅透传 `attrs.pad`，可保持透传；Inspector 侧解析已可正确回填。
- 若存在统一工具复用需求，可将 padding 解析函数抽到 parser/service 公共位置，避免重复逻辑。

### F. 测试
- 文件：`src/__tests__/test.ts`
- 新增测试点：
  1. `parsePaddingComposite`：1/2/3/4 值扩展规则；
  2. 非法与负值回退（最小 0）；
  3. `composePaddingComposite` 恒为四值 `px`；
  4. generator 对 `pad` 输出四值格式。

### G. 文档
- 文件：`README.md`
- 更新 Design Maker 说明，标注 Padding 已改为四向组合输入并自动合并输出。

## Verification Steps

1. 构建检查  
   - `npm run build`

2. 测试检查  
   - `npx esbuild src/__tests__/test.ts --bundle --platform=node --format=cjs --external:obsidian --outfile=/tmp/slidesrup-test-padding-composite.cjs`
   - `node -e "...require('/tmp/slidesrup-test-padding-composite.cjs')"`

3. 手工回归  
   - 在 Inspector 修改四个方向值，确认 `pad` 实时更新；
   - 读取历史模板中 `pad="40px"` / `pad="40px 60px"` / `pad="40px 60px 20px"` 均能正确回填四输入；
   - 保存后模板中 `pad` 一律为四值 `px`；
   - 深浅主题下布局与可读性正常。

