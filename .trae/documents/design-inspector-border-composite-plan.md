# Design Inspector Border 组合设置改造方案

## Summary

将 Design Maker 区块属性中 `Border` 的单文本输入改造为结构化组合设置区，包含：
- `width`（px，整数步进，默认 `0`）
- `style`（CSS border-style 选项，默认 `solid`，含 i18n）
- `color`（Color picker + 文本输入，默认 `#ffffff`）

用户调整任一子项后，实时合并为单一 `border` 字符串写回（例如 `2px dashed #ff0000`）。  
当 `width = 0` 时，按你确认的规则写入 `0px solid #fff`（按当前 style/color 组合输出）。

## Current State Analysis

### 1) 当前 Border 仅文本输入
- 文件：[design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts)
- 现状：在 `renderDesignInspector` 中 `Border` 使用 `createTextField(...)`，用户需手写完整 CSS。

### 2) 现有可复用能力
- 同文件已有：
  - `createColorPickerField`（支持 Hex/RGB/HSL + 校验）
  - `createNumberField` / `createSelectField`
- 说明可直接复用现有 UI/交互模式，减少新组件复杂度。

### 3) i18n 选项映射机制
- 文件：[design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts)
- 已有 `INSPECTOR_SELECT_OPTION_I18N_KEYS` + `localizeInspectorSelectOptions`，新增边框样式标签时需补映射和语言包键值。

## Assumptions & Decisions

已确认决策：

1. **旧值兼容**：尽量解析并回填；无法识别部分回退默认值。  
2. **width 精度**：px 整数步进 `1`。  
3. **width=0 输出**：仍输出结构化值（`0px {style} {color}`），不压缩为 `none`/空。  

实现边框样式候选集合：`none | hidden | dotted | dashed | solid | double | groove | ridge | inset | outset`。

## Proposed Changes

### A. Border 解析/合并工具函数
- 文件：`src/ui/components/design-inspector.ts`
- 新增：
  - `parseBorderComposite(border: string)`：尽量提取 width/style/color
  - `composeBorderComposite(width, style, color)`：统一拼接为 `${width}px ${style} ${color}`
  - `clampBorderWidth(value)`：保证非负整数
- 规则：
  - 默认回退：`0 / solid / #ffffff`
  - 颜色支持现有 color 校验工具；无法转 hex 时仍保留原合法颜色字符串。

### B. 新增组合控件渲染函数并替换调用
- 文件：`src/ui/components/design-inspector.ts`
- 新增 `createBorderCompositeField(...)`：
  - width：number input（min=0, step=1）
  - style：select（通过 `createSelectField` 机制本地化）
  - color：复用 `createColorPickerField` 交互样式（或同等子控件）
  - 任一变化触发合并并 `onPatchBlock(nextBlock.border = composed)`
- 替换原 `createTextField(container, "Border", ...)` 为新组合控件调用。

### C. i18n 补齐（边框样式选项）
- 文件：
  - `src/ui/components/design-inspector.ts`（映射表）
  - `src/lang/locale/design-inspector/en-US.json`
  - `src/lang/locale/design-inspector/zh-CN.json`
- 新增键：
  - `designInspector.option.borderNone`
  - `designInspector.option.borderHidden`
  - `designInspector.option.borderDotted`
  - `designInspector.option.borderDashed`
  - `designInspector.option.borderSolid`
  - `designInspector.option.borderDouble`
  - `designInspector.option.borderGroove`
  - `designInspector.option.borderRidge`
  - `designInspector.option.borderInset`
  - `designInspector.option.borderOutset`

### D. 样式微调
- 文件：`styles.css`
- 新增/复用组合字段布局样式（宽度/样式/颜色三项在同一区块内排版一致），保持与当前 inspector 视觉统一。

### E. 单元测试
- 文件：`src/__tests__/test.ts`
- 新增测试：
  1. `parseBorderComposite`：标准值、复杂值、缺失项回退
  2. `composeBorderComposite`：输出格式正确（含 width=0）
  3. i18n 映射完整性（新增 border-style 选项不触发 missing key）
  4. 颜色合法性联动（复用现有 color helper）

### F. 文档更新
- 文件：`README.md`
- 在 Design Maker 说明补充 Border 现为组合配置（width/style/color）与自动合并行为。

## Verification Steps

1. 构建校验  
   - `npm run build`

2. 测试校验  
   - `npx esbuild src/__tests__/test.ts --bundle --platform=node --format=cjs --external:obsidian --outfile=/tmp/slidesrup-test-border-composite.cjs`
   - `node -e "...require('/tmp/slidesrup-test-border-composite.cjs')"`

3. 手工回归  
   - 在 Inspector 中调整 width/style/color，确认 `border` 实时写回并生效；
   - 输入已有复杂 border 时，确认“可解析部分回填、不可解析回退默认”；
   - 切换语言，style 下拉项文案正确本地化；
   - 深浅主题下控件可读性与布局正常。

