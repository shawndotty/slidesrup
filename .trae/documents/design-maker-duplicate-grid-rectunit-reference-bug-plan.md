# Plan：修复复制网格后切换 px/% 影响其他网格的引用共享 Bug

## Summary
- 目标：修复 Design Maker 中“复制创建的网格在切换 px/% 时会影响另一个网格 rect 计算”的问题。
- 结论：这是复制逻辑的对象浅拷贝导致 `extraAttributes` 共享引用，进而共享 `rectUnit` 状态。
- 策略：在复制时为 `extraAttributes` 做独立拷贝，确保每个网格单位状态互不干扰，并补充回归测试。

## Current State Analysis
- 复制入口统一走 [design-maker-view.ts:_duplicateGridBlock](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/views/design-maker-view.ts#L1609-L1646)。
- 当前复制代码：
  - 使用 `...target` 浅拷贝目标块；
  - `rect` 有单独克隆；
  - `children` 被重置为空数组；
  - 但 `extraAttributes` 未克隆，保留了与原块相同引用。
- px/% 开关依赖 `block.extraAttributes.rectUnit`：
  - 判定在 `_getEffectiveRectUnit`；
  - 修改在 `_toggleSelectedBlockRectUnit`（设置/删除 `rectUnit`）。
- 由于共享引用，切换 A 的 `rectUnit` 会同步改变 B，导致 B 的坐标单位解释错误，出现“另一个网格 rect 异常”。

## Proposed Changes

### 1) 修复复制时的引用共享
**文件**
- [design-maker-view.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/views/design-maker-view.ts)

**修改**
- 在 `_duplicateGridBlock` 中创建 `nextBlock` 时，显式克隆 `extraAttributes`：
  - `extraAttributes: { ...target.extraAttributes }`
- 这样复制后两个网格拥有独立属性对象，`rectUnit` 切换不会串扰。

### 2) 增加回归保护（测试）
**文件**
- [src/__tests__/test.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/__tests__/test.ts)

**修改**
- 补充“复制后属性隔离”的回归测试，至少覆盖：
  - 复制对象后 `extraAttributes` 非同一引用；
  - 改变复制体 `rectUnit` 不影响原对象；
  - 改变原对象 `rectUnit` 不影响复制体。
- 若直接测试私有方法成本过高，则提取一个最小可测复制 helper（仅模型层）并在 `_duplicateGridBlock` 复用，保证行为一致且可测。

### 3) 最小化变更边界
**约束**
- 不改现有接口签名与 UI 行为；
- 不改 px/% 换算公式；
- 仅修正复制对象的引用隔离问题，避免引入额外副作用。

## Assumptions & Decisions
- 决策：本次只处理 `extraAttributes` 引用共享这一已确认根因，不扩大到 `children` 深拷贝策略重构。
- 决策：保持现有 `children = []` 语义不变，避免影响“复制时不复制子树”的既有产品行为。
- 假设：问题复现路径主要来自“复制网格后切换单位”；新建网格不受影响，符合“引用共享仅发生在复制路径”。

## Verification Steps
- 构建验证：
  - `npm run build` 通过。
- 自动化验证：
  - 新增回归测试通过，且现有测试全量通过。
- 手动验证：
  - 新建一个网格 A，复制得到 B；
  - 选中 A 切换 `% -> px -> %`，确认 B 的坐标显示/计算不变化；
  - 选中 B 重复切换，确认 A 不变化；
  - 对比“两个都由添加按钮创建”的场景，行为一致。

