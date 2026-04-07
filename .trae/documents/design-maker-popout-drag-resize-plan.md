# Design Maker 弹出窗口中 Block 无法拖拽/缩放修复方案

## Summary

修复 Design Maker 被 Obsidian “移动到新窗口”后，画布内 Grid Block 无法拖动和调整大小的问题。  
核心方向是将事件绑定从全局 `document/window` 改为**当前视图所在窗口的 `ownerDocument/defaultView`**，确保鼠标与键盘事件在弹出窗口上下文中可被正确接收。

## Current State Analysis

### 1) 拖拽/缩放事件绑定存在跨窗口上下文问题
- 文件：[design-canvas.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-canvas.ts)
- 现状：
  - Block 拖拽与 resize 在 `mousedown` 后，将 `mousemove/mouseup` 绑定到全局 `document`；
  - 若 Design Maker 渲染在新窗口，事件实际发生在新窗口的 `document`，全局 `document` 可能仍是主窗口上下文，导致 move/up 回调不触发。
- 关键位置：
  - [design-canvas.ts:677-683](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-canvas.ts#L677-L683)
  - [design-canvas.ts:724-730](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-canvas.ts#L724-L730)
  - [design-canvas.ts:500-504](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-canvas.ts#L500-L504)

### 2) 空格平移快捷键也使用全局 window
- 文件：[design-maker-view.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/views/design-maker-view.ts)
- 现状：
  - `onOpen/onClose` 里通过全局 `window.addEventListener` 监听 `keydown/keyup`；
  - 在弹出窗口时可能无法正确追踪空格键状态（影响平移，但不影响基本拖拽缩放）。
- 关键位置：
  - [design-maker-view.ts:141-147](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/views/design-maker-view.ts#L141-L147)

## Assumptions & Decisions

1. 本次优先修复用户核心痛点：**Block 拖拽和缩放在弹出窗口恢复可用**。  
2. 同步修复空格平移键监听的窗口上下文，避免二次跨窗口输入问题。  
3. 不改变现有交互行为（拖拽逻辑、resize 逻辑、提交时机保持不变），仅修正事件宿主。  

## Proposed Changes

### A. 统一事件宿主解析（基于渲染容器）
- 文件：`src/ui/components/design-canvas.ts`
- 改动：
  - 在 `renderDesignCanvas` 内通过 `container.ownerDocument` 获取当前文档；
  - 用 `const hostDocument = container.ownerDocument || document`；
  - 用 `const hostWindow = hostDocument.defaultView || window`（如需要 window 事件）。
- Why：
  - 避免全局 document/window 与实际 UI 所在窗口不一致。

### B. 拖拽/缩放/平移事件绑定改到 hostDocument
- 文件：`src/ui/components/design-canvas.ts`
- 改动点：
  - 所有 `document.addEventListener/removeEventListener("mousemove"/"mouseup")` 改为 `hostDocument...`；
  - 保持原有回调与 patch 提交逻辑不变。
- 覆盖场景：
  - 画布空格平移中的 move/up；
  - Block 拖拽中的 move/up；
  - Block resize 中的 move/up。

### C. 视图键盘监听改到视图所属窗口
- 文件：`src/ui/views/design-maker-view.ts`
- 改动：
  - `onOpen/onClose` 里不再直接使用全局 `window`；
  - 使用 `this.containerEl.ownerDocument.defaultView`（或通过 workspace 容器拿到当前 view window）绑定 `keydown/keyup`；
  - 保存引用，确保 onClose 能对同一 window 正确解绑。

### D. 测试补充
- 文件：`src/__tests__/test.ts`
- 新增测试方向：
  1. 事件宿主选择逻辑测试（给定 mock container.ownerDocument 时应优先使用 ownerDocument）；
  2. 拖拽/缩放 listener 绑定目标测试（不落到全局 document）。
- 说明：
  - 若直接测试 DOM 绑定过重，可提取轻量函数（如 `resolveHostDocument(container)`）并做单测，降低脆弱性。

## Verification Steps

1. 构建与单测  
   - `npm run build`  
   - `npx esbuild src/__tests__/test.ts --bundle --platform=node --format=cjs --external:obsidian --outfile=/tmp/slidesrup-test-popout-drag.cjs`  
   - `node -e "...require('/tmp/slidesrup-test-popout-drag.cjs')"`

2. 手工回归（主窗口）  
   - 在主窗口打开 Design Maker，拖拽/缩放 block 正常；
   - 空格平移正常。

3. 手工回归（弹出窗口）  
   - 将 Design Maker 移动到新窗口；
   - 验证 block 可拖拽、可缩放；
   - 验证空格平移正常；
   - 验证不会出现鼠标松开后仍持续拖动的“粘住”问题（mouseup 解绑生效）。

