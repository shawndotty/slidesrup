# Design Maker 功能规划

## Summary

为 SlidesRup 新增一个面向小白用户的 `Design Maker`，让用户无需手写符合 Advanced Slides 规范的模板 Markdown，也能在 Obsidian 内通过拖拽式、所见即所得的独立工作区视图创建和编辑自己的演示设计。

首个版本采用以下产品决策：

- 入口形态：独立工作区视图
- 编辑范围：布局 + 样式全链路
- 编辑粒度：槽位化布局编辑
- 预览模式：设计器内建实时预览
- 设计起点：从现有设计克隆后编辑
- 落地产物：直接生成标准 `MyDesigns/Design-*` 模板文件与 `MarpThemes/sr-design-*.css`
- 兼容策略：完全兼容现有 `SlidesMaker`
- 权限策略：沿用现有设计命令的权限校验
- 保存策略：显式“保存并应用”

## Current State Analysis

### 现有设计体系

- 现有设计样例位于 `src/designs/Design-A` 到 `src/designs/Design-H`，每套设计都由多个模板 Markdown 文件组成，如封面、目录、章节、内容、无导航内容、空白页、封底。
- 运行时真正消费的是用户框架目录下的标准结构，而不是 `src/designs` 本身。关键目录约定由 `src/constants.ts` 中的 `REVEAL_USER_DESIGN_FOLDER`、`MARP_THEMES_FOLDER` 等常量定义。
- `src/services/slides-maker.ts` 已形成稳定的消费链路：它会按设计名读取标准模板文件、替换占位符、生成 TOC / BaseLayout / 内容页，并最终生成可用于 Advanced Slides / Reveal.js 的演示。
- `src/constants.ts` 中的 `{{TOC}}`、`{{LOGO_OR_TAGLINE}}`、`{{SLOGAN}}`、`{{BASE_LAYOUT}}` 等占位符，是模板兼容现有生成链路的核心契约。

### 现有 Design Maker 能力

- `src/services/design-maker.ts` 目前只支持两类能力：
  - 从空白目录创建一套设计文件
  - 从当前设计克隆并重命名文件与主题 CSS
- 该服务已经掌握：
  - 用户设计目录命名规范
  - 标准模板文件命名规范
  - Marp 主题 CSS 复制与注册逻辑
  - 设计完成后在文件浏览器中定位设计目录
- 这意味着首个版本不应该新建平行的设计产物体系，而应该扩展该服务，让它从“目录脚手架生成器”升级为“可视化设计产物写入器”。

### 现有 UI / 技术条件

- 插件当前没有工作区视图类，只有简单模态框和设置页，因此 Design Maker 需要新增独立视图体系。
- 代码库已经使用 CodeMirror 作为设置页内的 CSS / Markdown 编辑器，因此可以复用现有依赖做“源码回显 / 高级编辑”面板，不需要引入新前端框架。
- 当前项目是原生 Obsidian 插件结构，没有 React / Vue 依赖，因此首版 UI 应继续使用 Obsidian View + 原生 DOM 构建，避免引入额外框架和构建复杂度。

### 与 Advanced Slides 规范的关系

- Advanced Slides 支持 Reveal.js 风格的 Markdown 演示，并支持 grid、图片、嵌入、footnote、前置样式、frontmatter 等能力。
- SlidesRup 当前的设计模板本质上是“约束化的 Advanced Slides 片段集合”。
- 因此 Design Maker 首版的目标不是覆盖 Advanced Slides 的全部语法，而是为 SlidesRup 当前已经稳定消费的模板结构建立一个可视化编辑层。

## Proposed Changes

### 1. 新增工作区视图与入口

#### 文件

- `src/ui/views/design-maker-view.ts`
- `src/ui/views/design-maker-view-state.ts`
- `src/services/command-service.ts`
- `src/main.ts`
- `styles.css`

#### 变更内容

- 新增一个专用工作区视图 `DesignMakerView`，在 Obsidian 中以独立叶子页签打开。
- 在命令系统中新增例如 `Open Design Maker` 的命令，位置与现有 `Create New Design` 命令相邻，并继续复用现有权限校验。
- 视图采用三栏结构：
  - 左栏：设计元信息与页面槽位导航
  - 中栏：拖拽画布
  - 右栏：属性面板 + CSS/源码高级编辑区 + 实时预览
- 在 `main.ts` 中注册该视图类型，并在插件卸载时释放视图资源。
- 在 `styles.css` 中增加 Design Maker 专属样式，包括画布网格、选中态、拖拽手柄、预览容器、属性面板布局。

#### 设计原因

- 用户已经明确偏好独立工作区视图；拖拽、属性编辑、实时预览三者同时存在时，设置页和模态框都不够用。
- 工作区视图也是 Obsidian 插件里最适合持续编辑的大型交互容器。

### 2. 定义可视化编辑的内部数据模型

#### 文件

- `src/types/design-maker.ts`
- `src/services/design-maker-schema.ts`

#### 变更内容

- 新增一组仅在编辑器内使用的结构化模型，用于表示“标准模板文件”在内存中的可编辑形态。
- 数据模型至少包含：
  - `DesignDraft`
  - `DesignPageType`：cover / toc / chapter / content / contentWithoutNav / blank / backCover
  - `DesignCanvasBlock`
  - `GridBlock`
  - `TextBlock`
  - `ImageBlock`
  - `PlaceholderToken`
  - `ThemeStyleDraft`
- 页面模型采用“槽位化布局编辑”：
  - 每个页面对应一块画布
  - 画布由多个可拖拽块组成
  - 块支持位置、宽高、内边距、对齐、class、style、内容类型等属性
- 主题模型独立承载颜色、字体、字号、背景、边框圆角、对比模式、主题类映射等样式设置。

#### 设计原因

- 现有设计文件是纯 Markdown/HTML 片段，不适合直接做拖拽编辑。
- 先在内存里维护结构化模型，再双向转换为标准模板文件，既能保留 WYSIWYG 体验，又能继续兼容 `SlidesMaker`。

### 3. 新增“标准模板文件 ↔ 可视化草稿”双向转换层

#### 文件

- `src/services/design-maker-parser.ts`
- `src/services/design-maker-generator.ts`
- `src/services/design-maker.ts`

#### 变更内容

- 把现有 `DesignMaker` 服务扩展为三类职责：
  - 设计来源准备：克隆默认设计或用户设计
  - 设计解析：将标准模板 Markdown/CSS 解析为 `DesignDraft`
  - 设计保存：将 `DesignDraft` 重新生成为标准模板文件与主题 CSS
- 解析层首版只支持 SlidesRup 当前设计中真实使用的稳定子集：
  - `<grid ...>` 块
  - 内嵌 `<% content %>`、`<%? author %>` 等 Templater 片段
  - `{{TOC}}`、`{{LOGO_OR_TAGLINE}}` 等占位符
  - 图片块
  - 常用 `class`、`style`、`pad`、`drag`、`drop`、`align`
- 对无法结构化解析的复杂内容，保留“高级源码编辑”兜底区，避免首版因语法覆盖不全而阻塞使用。
- 保存时继续按现有命名规范写出：
  - `Cover-{name}.md`
  - `TOC-{name}.md`
  - `Chapter-{name}.md`
  - `ContentPage-{name}.md`
  - `ContentPage-WithoutNav-{name}.md`
  - `BlankPage-{name}.md`
  - `BackCover-{name}.md`
  - `sr-design-{name}.css`
- 如果当前项目的实际运行目录仍使用本地化命名，则生成器需要以现有 `t(...)` 命名行为为准，并把“展示名称”和“落地文件名”逻辑封装进同一处，避免继续把命名规则散落在多个服务中。

#### 设计原因

- 这是整个功能的兼容核心；只要最终产物保持不变，`SlidesMaker` 就无需大改。
- 双向转换层还能让 Design Maker 从“视觉编辑器”退化回“高级编辑器”，减少首版失败面。

### 4. 构建设计器画布与属性面板

#### 文件

- `src/ui/views/design-maker-view.ts`
- `src/ui/components/design-canvas.ts`
- `src/ui/components/design-inspector.ts`
- `src/ui/components/design-preview.ts`
- `src/ui/components/design-page-list.ts`

#### 变更内容

- 中央画布按页面类型切换，支持：
  - 选择块
  - 拖拽位置
  - 调整宽高
  - 修改层级顺序
  - 删除 / 复制块
  - 从组件库插入新块
- 首版组件库限制为可稳定生成现有设计所需的最小集合：
  - Grid 容器
  - 文本块
  - 图片块
  - 占位符块
  - 内容占位块
- 右侧属性面板支持编辑：
  - 块尺寸与位置
  - padding / align / class / style
  - 文本内容或占位符类型
  - 图片链接
  - 页面级背景与主题引用
- 预览区根据当前草稿直接渲染一个近实时、近结构等价的模板预览，不调用外部插件预览链路。

#### 设计原因

- 用户要求拖拽式实时所见即所得编辑，但首版不能直接承担全部 Advanced Slides 语法。
- 通过限制块类型与属性范围，可以在保证新手可用的同时维持代码复杂度可控。

### 5. 新增主题样式编辑器

#### 文件

- `src/ui/components/design-theme-panel.ts`
- `src/services/design-theme-generator.ts`
- `styles.css`

#### 变更内容

- 增加样式面板，覆盖首版最关键的主题能力：
  - 主色 / 辅助色 / 背景色 / 文本色
  - 标题字体 / 正文字体
  - 标题字号层级
  - 圆角、边距、阴影等基础视觉变量
  - 明 / 暗风格切换
- 保留一个基于 CodeMirror 的 CSS 高级编辑区，用于处理首版属性面板暂未覆盖的细节。
- `design-theme-generator.ts` 负责把可视化样式设置与高级 CSS 合并成最终 `sr-design-*.css`。

#### 设计原因

- 用户明确要求“布局 + 样式全链路”。
- 只做布局但不做主题，会让用户仍需自己写 CSS，无法真正降低门槛。

### 6. 设计创建与保存流程重构

#### 文件

- `src/services/design-maker.ts`
- `src/services/vscode-service.ts`
- `src/utils/index.ts`

#### 变更内容

- 保留现有“从空白创建”“从当前设计创建”底层能力，但把它们改造为 Design Maker 的前置准备步骤。
- 新流程：
  1. 用户执行 `Open Design Maker`
  2. 选择一个默认设计或用户设计作为基础
  3. Design Maker 克隆出目标设计副本
  4. 读取副本并解析成 `DesignDraft`
  5. 用户在视图中编辑
  6. 点击“保存并应用”后写回标准模板文件与 CSS
  7. 调用现有 VS Code 主题注册逻辑，确保外部工具链继续可用
- `utils/index.ts` 中关于设计选项、用户设计发现、命名规则的辅助逻辑需要整理，统一默认设计与用户设计的返回格式，避免视图层额外做兼容分支。

#### 设计原因

- 用户明确偏好“从现有设计克隆后编辑”。
- 显式保存可以避免设计器在拖拽过程中持续覆盖模板文件，降低风险。

### 7. 设置项与实验开关

#### 文件

- `src/types/index.ts`
- `src/models/default-settings.ts`
- `src/ui/settings-tab.ts`

#### 变更内容

- 增加一组与 Design Maker 相关的设置：
  - 是否启用 Design Maker
  - 默认打开的基础设计
  - 是否在保存时自动同步 VS Code 主题
  - 是否显示高级源码编辑区
  - 设计器预览缩放比例
- 在设置页的 `Design and Templates` 区域增加 `Design Maker` 小节。
- 首版如果希望控制风险，可同时加入一个“实验功能”提示文案，但不改变已确认的权限策略。

#### 设计原因

- 设计器是高复杂度功能，需要让高级用户调整使用方式，同时为未来迭代预留开关。

### 8. 本地化与文案

#### 文件

- `src/lang/locale/en.ts`
- `src/lang/locale/zh-cn.ts`
- `src/lang/locale/zh-tw.ts`

#### 变更内容

- 为命令名、按钮、字段、预览提示、保存成功/失败、解析降级提示等新增完整本地化文案。
- 首版特别需要清晰表达两类状态：
  - 当前内容可视化可编辑
  - 当前内容仅能在源码模式编辑

#### 设计原因

- 设计器的目标用户是小白用户，文案引导质量会直接影响功能可用性。

## Implementation Sequence

1. 建立 `DesignDraft` 数据模型与命名规范适配层。
2. 扩展 `design-maker.ts`，先完成“克隆设计 → 解析草稿 → 生成文件”的服务闭环。
3. 新增工作区视图骨架与命令入口，先能加载一个设计并显示页面列表。
4. 实现画布、块选择、属性面板、基础块增删改拖拽。
5. 接入样式面板和 CSS 生成器。
6. 加入实时预览与源码兜底编辑。
7. 接入设置页开关与本地化文案。
8. 完成兼容性测试和回归验证。

## Assumptions & Decisions

- 首版不会试图完整覆盖 Advanced Slides 全部语法，只覆盖当前 SlidesRup 设计模板中的稳定高频子集。
- 首版不改写 `SlidesMaker` 的主转换流程，只保证它能无感消费 Design Maker 生成的标准设计文件。
- 首版以“页面模板编辑器”而不是“最终演示页面编辑器”为核心，编辑对象始终是设计模板。
- 首版默认通过克隆现有设计进入编辑器，以降低空白起步的复杂度；空白新建仍保留为后续增强项。
- 首版保存策略采用显式保存，不做自动写盘。
- 对无法安全解析的模板内容，首版允许局部降级为源码编辑，而不是阻断保存。
- 继续沿用现有设计命令权限校验，避免在此次功能中顺带重构授权体系。

## Risks And Mitigations

### 风险 1：模板语法过于自由，难以完全双向解析

- 缓解：首版只支持稳定子集；其余内容降级到源码编辑区。

### 风险 2：画布预览与真实 Advanced Slides 渲染不完全一致

- 缓解：预览以结构接近为目标；最终保存产物仍是标准模板文件，真实渲染交给现有链路。

### 风险 3：不同语言环境导致模板文件命名不一致

- 缓解：把文件命名规则集中封装，禁止视图层自行拼接文件名。

### 风险 4：视图交互复杂度过高，首版范围失控

- 缓解：限制块类型、限制属性面、限制嵌套深度，只做槽位化布局编辑。

## Verification

### 功能验证

- 能从一个默认设计克隆进入 Design Maker。
- 能读取并展示 cover / toc / chapter / content / contentWithoutNav / blank / backCover 七类页面。
- 能对至少一个页面完成块拖拽、属性修改、主题修改，并在预览区即时反映。
- 点击“保存并应用”后，能正确写回用户设计目录下的标准模板文件与主题 CSS。
- 保存后，现有 `Create Slides` / `Convert to Slide` 流程能够继续消费该设计并生成演示。

### 兼容验证

- 现有“从空白创建设计”“从当前设计创建设计”命令仍可正常工作。
- 用户设计下拉列表仍能发现并列出新设计。
- VS Code Marp 主题注册仍正常更新。

### 回归验证

- 设置页正常打开，不影响现有 CSS / Frontmatter 编辑器。
- 未开启或未使用 Design Maker 时，插件其他核心功能行为不变。
