# Design Maker 区块内容接入 Unsplash 图片插入功能实施方案

## Summary

在 Design Maker 的「区块属性 -> 区块内容」区域，保留现有“插入本地图片”按钮，并在其右侧新增“插入 Unsplash 图片”按钮。  
点击后弹出搜索面板，用户输入关键词后：

- 若已配置 Unsplash Access Key：调用 Unsplash Search API 返回候选列表，用户选中后插入；
- 若未配置 Access Key：回退到随机单图模式（source URL），直接插入一张相关图片。

插入格式统一为 Markdown 远程图语法（`![](https://...)`），不自动附加署名。

## Current State Analysis

### 1) 当前区块内容图片插入实现
- 文件：[design-inspector.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-inspector.ts)
- 现有能力：
  - 区块内容头部已有“插入本地图片”按钮；
  - `openLocalImagePicker` 已实现搜索、键盘操作、置顶、拖拽、动画等交互；
  - 选图后通过 `insertImageEmbedIntoContent` 写入内容并触发 `input`。

### 2) 渲染器对远程图兼容情况
- 文件：[design-block-renderer.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/components/design-block-renderer.ts)
- `extractImageUrl` 支持 `![](...)`，`resolveObsidianImageUrl` 允许 `https://...` 直链。  
=> 远程 Markdown 图片可直接渲染，无需额外改动渲染层。

### 3) 当前设置与密钥基础设施
- 文件：
  - [settings-tab.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/ui/settings-tab.ts)
  - [secret-store-service.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/services/secret-store-service.ts)
  - [types/index.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/types/index.ts)
  - [models/default-settings.ts](file:///Users/johnny/Documents/Sync/IOTO-Plugins/.obsidian/plugins/slidesrup/src/models/default-settings.ts)
- 已有“钥匙串优先 + fallback settings”的密钥读写模式，可复用给 Unsplash Access Key。

## Assumptions & Decisions

基于你确认的偏好，本次采用：

1. 插入语法：`![](URL)`（Markdown 远程图）。  
2. 不自动附加 Unsplash 署名文本。  
3. 默认尺寸字段：`regular`。  
4. 搜索策略：**混合模式**  
   - 有 Access Key -> 列表可选；
   - 无 Access Key -> 随机单图直接插入。  

## Proposed Changes

### A. 新增 Unsplash 服务层（统一接口）
- 新文件：`src/services/unsplash-image-service.ts`
- 提供方法（建议）：
  - `searchImages(keyword: string): Promise<Array<{id,url,thumb,alt,author}>>`
  - `getRandomImageUrl(keyword: string): string`
  - `insertMarkdownImage(url: string): string`
- 行为：
  - 若存在 Access Key：调用 Unsplash Search API（`/search/photos`）；
  - 若不存在：返回 source URL 单图（随机）。

### B. 扩展 SecretStoreService 支持 Unsplash Key
- 文件：`src/services/secret-store-service.ts`
- 增加：
  - `getUnsplashAccessKey()`
  - `setUnsplashAccessKey()`
- 复用现有 keychain/fallback 策略，避免重复安全逻辑。

### C. 扩展设置模型与默认值
- 文件：
  - `src/types/index.ts`
  - `src/models/default-settings.ts`
- 新增配置项（建议）：
  - `unsplashEnabled: boolean`
  - `unsplashUseRandomFallbackWithoutKey: boolean`（默认 true）
  - `unsplashApiBaseUrl: string`（默认 `https://api.unsplash.com`）
  - `unsplashAccessKeyFallback: string`

### D. 设置页新增 Unsplash 配置块（放在 AI Assistant 附近）
- 文件：`src/ui/settings-tab.ts`
- 内容：
  - 开关：启用 Unsplash 插图；
  - Access Key 输入（password）；
  - 可选开关：未配置 key 时允许随机单图回退；
  - 说明文案：已配置 key 才有列表选择能力。

### E. Inspector 增加 Unsplash 按钮与交互
- 文件：`src/ui/components/design-inspector.ts`
- 改动：
  1. 在本地图片按钮右侧新增 Unsplash 按钮；
  2. 新增 `openUnsplashPicker`：
     - 有 key：输入关键词 -> 返回候选列表 -> 选择插入；
     - 无 key：输入关键词后插入单张随机图并提示回退模式；
  3. 插入时写入 `![](url)` 并沿用现有 `textarea.dispatchEvent(new Event("input"))`。
- 交互复用：
  - 尽量复用现有 image-picker 结构（搜索框、列表、键盘 Enter/Esc、选中态）。

### F. 服务注入
- 文件：
  - `src/services/index.ts`
  - `src/main.ts`（若需要类型透传）
  - `src/ui/views/design-maker-view.ts`（必要时透传）
- 新增 `unsplashImageService` 到 plugin services，Inspector 点击按钮时可直接调用。

### G. i18n 文案补齐
- 文件：
  - `src/lang/locale/en.ts`
  - `src/lang/locale/zh-cn.ts`
  - `src/lang/locale/zh-tw.ts`
- 新增文案（示例）：
  - `Insert Unsplash image`
  - `Search Unsplash images`
  - `Unsplash random mode (no access key)`
  - `No Unsplash results found`
  - `Unsplash Access Key`

### H. 测试计划
- 文件：`src/__tests__/test.ts`
- 覆盖：
  1. `insertMarkdownImage` 输出格式；
  2. 有 key/无 key 分支选择逻辑；
  3. 随机 URL 生成包含关键词；
  4. i18n key 完整性回归；
  5. 原本地图片插入流程无回归。

## Verification Steps

1. 构建与类型检查
   - `npm run build`
2. 单元测试
   - `npx esbuild src/__tests__/test.ts --bundle --platform=node --format=cjs --external:obsidian --outfile=/tmp/slidesrup-test-unsplash.cjs`
   - `node -e "...require('/tmp/slidesrup-test-unsplash.cjs')"`
3. 手工回归（Design Maker）
   - 本地图片按钮功能保持可用；
   - Unsplash 按钮可见并可点击；
   - 有 key 时：关键词检索可出候选并选择插入；
   - 无 key 时：关键词后可插入随机单图；
   - 插入后预览可正常显示远程图片。

