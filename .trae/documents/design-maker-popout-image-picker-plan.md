# Design Maker 弹出窗口下图片选择器不显示修复方案

## Summary

修复 Design Maker 被移动到 Obsidian 新窗口后，“插入本地图片”和“插入 Unsplash 图片”弹出窗口不显示的问题。  
核心是将图片选择器的 DOM 挂载、事件监听、视口尺寸计算从全局 `document/window` 改为 **trigger 所在窗口的 `ownerDocument/defaultView`**，确保弹窗渲染在正确窗口上下文中。

## Current State Analysis

### 1) 两类图片选择器都挂载到全局 document.body
- 文件：[design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts)
- 现状：
  - Unsplash picker：`document.body.createDiv(...)`
  - Local picker：`document.body.createDiv(...)`
- 风险：
  - 当 Design Maker 在弹出窗口时，trigger 在新窗口，但弹窗被插入主窗口 `document.body`，用户在新窗口看不到。

### 2) 事件监听绑定到全局 document/window
- 现状：
  - `document.addEventListener(...)` 监听 mousedown/keydown/pointermove/pointerup；
  - `window.addEventListener("resize", ...)`；
  - `window.innerWidth/innerHeight` 用于弹窗定位。
- 风险：
  - 弹出窗口内交互事件可能不在主窗口 document 上触发，导致关闭、拖拽、键盘导航和重定位异常。

### 3) 已有跨窗口问题修复经验可复用
- 同仓库近期已在 `design-canvas.ts` 通过 `ownerDocument` 修复拖拽缩放跨窗口事件宿主问题。
- 说明本问题可用同一策略处理，且符合现有代码方向。

## Assumptions & Decisions

1. 本次范围聚焦图片选择器显示与交互，不变更业务能力（搜索、筛选、插入逻辑）。  
2. 事件宿主以 `triggerEl.ownerDocument` 为准：  
   - `hostDocument = triggerEl.ownerDocument || document`  
   - `hostWindow = hostDocument.defaultView || window`
3. 所有与弹窗生命周期相关的 listener 必须注册/解绑到同一个 host 宿主，避免泄漏和“解绑不到”的问题。  

## Proposed Changes

### A. Unsplash 图片选择器跨窗口宿主修复
- 文件：`src/ui/components/design-inspector.ts`
- 改动：
  1. 在 `openUnsplashImagePicker` 内解析 `hostDocument/hostWindow`；
  2. `pickerEl` 改为挂载到 `hostDocument.body`；
  3. 所有 `document.add/removeEventListener` 改为 `hostDocument`；
  4. `window.setTimeout/innerWidth/innerHeight` 改为 `hostWindow`；
  5. `document.activeElement` 判断改为 `hostDocument.activeElement`。

### B. 本地图片选择器跨窗口宿主修复
- 文件：`src/ui/components/design-inspector.ts`
- 改动：
  1. 在 `openLocalImagePicker` 内同样解析 `hostDocument/hostWindow`；
  2. `pickerEl` 挂载改为 `hostDocument.body`；
  3. pointer/mouse/keyboard listener 改到 `hostDocument`；
  4. resize listener 与视口尺寸改到 `hostWindow`；
  5. close 阶段按对应 host 正确解绑。

### C. 提取轻量工具函数（可测试）
- 文件：`src/ui/components/design-inspector.ts`
- 建议新增：
  - `resolvePickerHost(triggerEl: HTMLElement)` 返回 `{ hostDocument, hostWindow }`
- 作用：
  - 复用到 local/unsplash 两个 picker；
  - 提供单测入口，降低集成测试复杂度。

### D. 自动化测试
- 文件：`src/__tests__/test.ts`
- 新增测试点：
  1. `resolvePickerHost` 优先返回 `triggerEl.ownerDocument`；
  2. 在无 ownerDocument 场景回退到全局 `document/window`；
  3. 保障跨窗口情况下宿主选择与设计预期一致。

## Verification Steps

1. 构建与单测  
   - `npm run build`  
   - `npx esbuild src/__tests__/test.ts --bundle --platform=node --format=cjs --external:obsidian --outfile=/tmp/slidesrup-test-popout-image-picker.cjs`  
   - `node -e "...require('/tmp/slidesrup-test-popout-image-picker.cjs')"`

2. 手工回归（主窗口）  
   - 打开 Design Maker，点击“插入本地图片/Unsplash 图片”均可显示；
   - 本地筛选、Unsplash 搜索、键盘 Enter/Esc、关闭行为正常。

3. 手工回归（弹出窗口）  
   - 将 Design Maker 移动到新窗口；
   - 点击本地图片按钮：弹窗在新窗口显示，列表可选并可插入；
   - 点击 Unsplash 按钮：弹窗在新窗口显示，搜索与选择可插入；
   - 验证拖动（本地 picker 置顶拖动）与窗口 resize 重定位正常；
   - 验证关闭后无残留监听（再次打开交互正常，无重复触发）。

