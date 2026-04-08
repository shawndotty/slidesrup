# Plan：在 Coordinates 标题后增加「像素模式」开关（仅当前 Block，双向转换）

## Summary
- 目标：在 Design Maker 的 Inspector 坐标区域（Coordinates 标题后）增加一个“切换到像素”开关。
- 行为：
  - 打开：将当前选中 Block 的 `x/y/width/height` 从百分比转换为 `px`，并进入 `px` 单位编辑模式。
  - 关闭：将当前选中 Block 的 `x/y/width/height` 从 `px` 转回百分比，并回到百分比编辑模式。
- 范围：仅作用于**当前选中 Block**，不影响页面其它 Block。

## Current State Analysis
- 坐标 UI 在 [design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts#L2351-L2433)：
  - 已有 `Coordinates` 标题与 `Rel/Glob` 切换；
  - `X/Y/Width/Height` 由 `createRectField` 渲染。
- 单位展示/输入解析：
  - 展示：`formatRectInputValue`；
  - 解析：`parseRectInputValue`；
  - 位置在 [design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts#L1735-L1758)。
- 当前单位来源：`block.extraAttributes.rectUnit === "px" ? "px" : "percent"`（Inspector 与 Canvas 同样判定）。
- View 层有现成坐标换算能力：
  - 块查找：[_findBlockById](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/views/design-maker-view.ts#L1135-L1153)
  - 按单位更新逻辑参考：[_updateBlockCoordinates](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/views/design-maker-view.ts#L1263-L1305)
  - 基准尺寸：[_getSlideBaseWidth/_getSlideBaseHeight](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/views/design-maker-view.ts#L1008-L1020)

## Assumptions & Decisions
- 已确认：
  - 开关语义：**双向切换**（on: %→px，off: px→%）。
  - 作用范围：**仅当前选中 Block**。
- 决策：
  - 单位状态仅写入当前 Block 的 `extraAttributes.rectUnit`，不改 page 级 `rectUnit`。
  - 转换比例基于“当前 Block 的父容器基准尺寸”：
    - 顶层 Block：使用 slide base 尺寸（`designMakerSlideBaseWidth/Height`）。
    - 嵌套 Block：使用父 Block 当前矩形尺寸（若父为百分比，先换算到 px 再计算）。

## Proposed Changes

### 1) Inspector 增加像素开关与回调参数
**文件**
- [design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts)

**修改**
- 在 `renderDesignInspector` 入参加入：
  - `isPxCoords?: boolean`
  - `onTogglePxCoords?: (enabled: boolean) => void`
- 在 Coordinates 标题行（`coordsHeader`）后新增 UI 开关按钮（与现有 Rel/Glob 风格一致）：
  - 文案：`PX` / `Pct`（通过 i18n key）
  - 点击后触发 `onTogglePxCoords(!isPxCoords)`。
- `rectUnit` 的展示来源改为该开关状态优先（true→px, false→percent），确保切换后输入框立即显示目标单位格式。

### 2) View 层实现“当前 Block 双向单位转换”
**文件**
- [design-maker-view.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/views/design-maker-view.ts)

**新增私有方法**
- `_getBlockParentBaseSizePx(blockId): { width: number; height: number } | null`
  - 通过 `_findBlockById` 找父块；
  - 顶层返回 slide base 尺寸；
  - 嵌套时递归计算父块的 px 尺寸（父块若为 percent，则按其父基准尺寸换算）。
- `_toggleSelectedBlockRectUnit(toPx: boolean): void`
  - 仅处理当前选中 grid；
  - 读取当前 `rectUnit` 与基准尺寸；
  - 执行 `%↔px` 四项转换：
    - `% -> px`: `round(value/100 * base)`
    - `px -> %`: `round(value/base * 100)`
  - 写回 `block.rect` 与 `block.extraAttributes.rectUnit`（toPx 时设 `"px"`，toPercent 时移除/清空该键）。
  - 调用 `_syncPageSource()` + `_render()`。

**接线**
- 在 `renderDesignInspector({...})` 调用处新增：
  - `isPxCoords: selectedBlock.extraAttributes.rectUnit === "px"`
  - `onTogglePxCoords: (enabled) => this._toggleSelectedBlockRectUnit(enabled)`

### 3) 多语言键补充
**文件**
- [en.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/lang/locale/en.ts)
- [zh-cn.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/lang/locale/zh-cn.ts)
- [zh-tw.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/lang/locale/zh-tw.ts)

**新增键**
- `Pixel Coordinates`
- `Percent Coordinates`
- `PX`
- `Pct`

### 4) 测试补充
**文件**
- [src/__tests__/test.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/__tests__/test.ts)

**新增内容**
- i18n 完整性测试中加入上述新增 key。
- 增加纯函数级换算测试（可在 test 中以局部 helper 形式验证 `%↔px` 四项转换公式与 round 行为）。

## Verification Steps
- 构建验证：
  - 运行 `npm run build`，确保类型与打包通过。
- 功能验证（手动）：
  - 选中一个 `%` 模式 Block，打开 PX 开关，四个字段转为 px 数值并带 `px` 显示；
  - 编辑 x/y/width/height 后画布表现正常；
  - 关闭开关，四个字段转回百分比；
  - 嵌套 Block 也能按其父容器尺寸正确换算；
  - Rel/Glob 原有切换不受影响。
- 回归验证：
  - 拖拽移动/缩放实时同步与源码同步行为不回归；
  - 保存后模板 `drag/drop` 单位与当前 block 设定一致。

