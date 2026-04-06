# Design Maker 内联样式自动补全诊断与修复报告

## 1. 复现步骤

1. 打开 Design Maker，选中任意 Grid。
2. 在「区块属性 -> 内联样式」编辑器中输入：
   - `border-radius: 100%;`
   - 新起一行输入 `mar`
3. 观察补全候选出现异常词条（如与目标 CSS 属性不一致的项），且常见属性排序不稳定。

## 2. 根因分析

### 根因 A：补全数据源依赖默认 CSS 语言补全，未做内联样式语境约束
- 之前直接使用 `autocompletion()` + `css()`。
- 内联样式是“声明片段”，不是完整样式表，默认补全在片段语境下会给出泛化候选，可能出现与期望不一致的提示。

### 根因 B：缺少“标准属性白名单 + 非 CSS 键过滤”
- 未限定可提示属性集合，无法明确屏蔽 HTML 属性或非目标词条。

### 根因 C：缺少优先级分层
- 标准属性与实验/厂商前缀属性没有明确排序策略，导致核心属性不稳定置顶。

## 3. 修复方案与实现

### 3.1 数据源修复
- 新增内联样式专用补全数据源：
  - 标准 CSS 属性集合（CSS2.1/3 常见核心属性）
  - 厂商前缀属性集合（如 `-webkit-*`）并降低优先级
  - 值补全集合（`inherit`、`initial`、`unset`、`revert`、`var(--)`、`calc()`、`clamp()` 等）
- 通过 `autocompletion({ override: [...] })` 覆盖默认候选，保证仅返回受控合法候选。

### 3.2 语境判定修复
- 新增 `detectInlineStyleCompletionMode`：
  - 当前声明有 `:` -> 值补全
  - 当前声明无 `:` -> 属性补全
- 新增内联补全 source，基于光标前 token 精准过滤。

### 3.3 生成链路规范化
- 保持编辑器内可多行编辑；
- 模板生成时使用 `normalizeInlineStyleForTemplate` 输出单行声明（`; ` 连接）。

## 4. 代码改动清单

- Inspector 补全与编辑器：
  - `src/ui/components/design-inspector.ts`
- 生成器样式规范化：
  - `src/services/design-maker-generator.ts`
- 回归测试：
  - `src/__tests__/test.ts`

## 5. 单元测试覆盖

- 属性补全正确性：包含 `margin`，排除 `class` 等非 CSS 键。
- 优先级：标准属性优先于厂商前缀。
- 现代语法：值补全包含 `calc()`、`var(--)`、`clamp()`。
- 语境判定：属性模式/值模式切换正确。
- 生成规范：多行编辑内容在模板中正确单行化输出。

## 6. 环境信息

- 项目依赖（package.json）：
  - `obsidian: latest`
  - `@codemirror/basic-setup: ^0.20.0`
  - `@codemirror/lang-css: ^6.3.1`
  - `@codemirror/theme-one-dark: ^6.1.3`
- 测试执行方式：
  - `npx esbuild ... --external:obsidian`
  - Node 运行时 mock `obsidian` 模块

## 7. 最小可复现 Demo

```css
border-radius: 100%;
mar
```

预期：优先出现 `margin`、`margin-top`、`margin-right` 等标准属性；不出现 HTML 属性类词条。

## 8. 兼容性与后续建议

- 当前补全集合已覆盖常见 CSS2.1/3 与现代函数语法；
- 若后续要“完全追随最新规范”，建议引入可版本化的 CSS 属性元数据源（如 MDN 数据）并定期同步；
- 可追加值域级智能补全（按属性上下文提供专属值域）。
