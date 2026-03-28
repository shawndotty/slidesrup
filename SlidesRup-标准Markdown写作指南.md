# SlidesRup：标准 Markdown 写作指南（面向 Advanced Slides）

这份指南根据 SlidesRup 的核心转换逻辑反推而来：当你在一个“标准 Markdown”笔记里写内容后，SlidesRup 会把它转换成 Advanced Slides（Reveal.js）能理解的复杂格式（例如 `<!-- slide ... -->`、`<!-- element: ... -->` 等控制标记）。

目标：你只需要按本文的规范写 Markdown，就能得到结构化、有目录、有章节/页面/子页面、带动效和布局能力的幻灯片。

---

## 1. 最重要的规则：标题结构决定“幻灯片结构”

SlidesRup 会读取你的标题（heading）层级来生成章节、页面与子页面，并自动插入分页符（`---` 或 `***`）以及 slide 注释。

### 1.1 推荐的标准结构（最常用）

- H1：整套幻灯片标题（只写 1 个）
- H2：章节（Chapter）
- H3：页面（Page / 内容页）
- H4–H6：子页面（Sub-page / 竖向或横向的分步页）

示例：

```md
# 我的分享标题

## 第一章：背景

### 为什么做这个
这里写内容……

#### 关键点 1 %%bg=assets/bg.png%%
这里写内容……

## 第二章：方案

### 架构设计
这里写内容……
```

### 1.2 文档必须包含至少一个 H1

如果文档里没有 H1（`# 标题`），转换会直接报错（格式无效）。

### 1.3 只有一个 H1 且没有任何 H2–H6：极简模式

当文档结构满足：

- H1 只有 1 个
- H2–H6 全部为 0

SlidesRup 会启用“极简模式”：

- 只生成封面页（cover）+ 尾页（back cover）
- 你的全部正文内容会留在封面页里（不会生成目录/章节/内容页拆分）

适合“只有一页”的海报式内容或短公告。

### 1.4 如果你的文档里有多个 H1

SlidesRup 会自动“规整标题结构”：

- 在最开头额外插入一个新的 H1（文件名或别名）
- 你原来的标题层级整体 +1（H1→H2，H2→H3…）
- 原来的 H6 会被改写为粗体强调文本（形如 `___文本___`）

因此：为了可控和可预期，建议手动保持“只用一个 H1”。

---

## 2. 自动生成的页面与默认内容

转换后会自动出现以下页面（顺序由转换流程决定）：

- 封面页：`id="home"`，使用 `[[Cover-{design}]]` 模板
- 目录页（可选）：`id="toc"`，使用 `[[TOC-{design}]]` 模板
- 章节页：`id="c{n}"`，从你的 H2 生成
- 内容页：`id="c{chapter}p{page}"`，从你的 H3 生成
- 子页面：`id="c{chapter}p{page}s{sub}"`，从你的 H4–H6（带控制标记）或 `%%---%%` 生成
- 尾页：使用 `[[BackCover-{design}]]` 模板

另外，SlidesRup 会自动把你的“作者”和“日期”插入到合适位置（封面页附近，或极简模式下附加到内容后）。

---

## 3. 你可以在标题行里写的“控制标记”（核心能力）

SlidesRup 用一套 `%%...%%` 控制标记，让你在“标准 Markdown”里精细控制每一页的模板、CSS class、背景、隐藏、目录显示名称等。

这些标记通常写在 H2/H3/H4–H6 的标题行末尾；也可以用于“空白页”的控制行（见第 4 节）。

### 3.1 给页面追加 class：`%%class-a class-b%%`

用途：在生成的 `<!-- slide ... class="..." -->` 上追加 class，便于套用自定义样式。

示例：

```md
## 第一章：背景 %%big-title%%

### 架构概览 %%two-columns%%
```

结果：该章节页/内容页会在默认 class 之外追加 `big-title` / `two-columns`。

### 3.2 覆盖（替换）class：`%%!class-a class-b%%`

用途：完全覆盖默认 class（而不是追加）。适合你想彻底接管某页样式时使用。

示例：

```md
### 特殊页面 %%!no-nav full-bleed%%
```

### 3.3 指定模板：`%%[[模板名]]%%`

用途：为当前页指定 Advanced Slides 的 `template="[[...]]"`。

示例：

```md
## 章节封面 %%[[Chapter-H]]%%
```

### 3.4 切换为“无导航模板”：`%%[[WithoutNav]]%%`

用途：对内容页（H3）或子页面（H4–H6 / `%%---%%`）显式使用“无导航”的基础布局。

示例：

```md
### 大图页面 %%[[WithoutNav]]%%
![[hero.png]]
```

### 3.5 设置背景：`%%bg=...%%`

用途：生成 slide 注释的 `bg="..."` 属性。

示例：

```md
### 有背景的页面 %%bg=assets/bg.jpg%%
```

注意：`bg=` 后面允许写任意字符串（路径/URL/表达式），会原样写入 `bg="..."`。

### 3.6 隐藏页面（不在演示中显示）：`%%?%%`

用途：对内容页（H3）或子页面（H4–H6 / `%%---%%`）添加 `data-visibility="hidden"`。

示例：

```md
### 备用页 %%?%%
这里是备份内容，演示时默认不可见
```

### 3.7 不要让某个标题触发“分页/目录/章节逻辑”：`%%@%%`

用途：把某个 H1/H2/H3 标题当作“普通标题”使用，而不触发：

- 自动分页符插入
- 章节/页面 slide 注释生成
- TOC/Nav 条目生成

示例（在某一页里你想用一个 H3 作为小节标题，但不想它变成新的一页）：

```md
### 本页小节标题 %%@%%
这一段仍属于上一页
```

### 3.8 控制目录/导航里显示的文字：`%%|显示名%%`

用途：当某个章节标题过长时，可以给它设置“TOC/Nav 显示名”。该显示名只影响目录与导航列表，不影响标题在页面中的显示（页面标题仍会去掉标记后显示原始标题）。

示例：

```md
## 这是一个很长很长的章节标题 %%|短标题%%
```

---

## 4. 手动插入“空白页”（Blank Page）

如果你在原始 Markdown 里手动写一个分页符行：

- `---`（至少 3 个 `-`）
- 或 `***`（至少 3 个 `*`）

SlidesRup 会把它识别为“插入一个空白页”，并在该分页符之后自动插入一段空白页的 `<!-- slide ... -->` 注释，默认使用 `[[BlankPage-{design}]]` 模板与空白页的默认 class。

### 4.1 自定义空白页的模板/class/bg

做法：在分页符的下一行写一行“注释控制行”（只要它包含 `%%...%%` 或 `<!-- ... -->` 形式即可），SlidesRup 会从这一行提取：

- `%%[[...]]%%` 作为模板
- `%%...%%` / `%%!...%%` 作为 class
- `%%bg=...%%` 作为背景

示例：

```md
---
%%[[BlankPage-H]]%% %%dark%% %%bg=assets/transition.png%%
```

---

## 5. 子页面（Sub-page）：把一个内容页拆成多个“连续页”

当你在内容页（H3）内部希望继续拆分成多页时，有两种方式：

### 5.1 用带控制标记的 H4–H6 触发子页面

规则：当标题满足以下任一条件时，会触发子页面：

- 它是 H4–H6，并且标题行里包含任意 `%%...%%` 控制标记

示例：

```md
### 内容页标题
第一页内容……

#### 第二页 %%bg=assets/bg2.jpg%%
第二页内容……

#### 第三页 %%?%%
第三页是隐藏页……
```

### 5.2 用 `%%---%%` 强制插入一个子页面分隔点

示例：

```md
### 内容页标题
第一页内容……

%%---%%
第二页内容（没有新的标题）
```

---

## 6. 章节内小目录（Chapter TOC）

转换时，SlidesRup 会在每一个章节标题（H2）之后自动插入一个章节内目录块 `::: chapterTOC ... :::`，里面列出本章节所有 H3 页面，并链接到对应 slide id：

- `#c{chapter}p{page}`

提示：

- 带 `%%@%%` 或 `%%?%%` 的 H3 不会出现在章节内目录里

---

## 7. YAML Frontmatter：可选，但很强

SlidesRup 会移除正文里的 frontmatter（不会作为幻灯片内容输出），但会读取其中部分字段来影响转换行为与生成结果。

下面是转换逻辑中明确读取的字段（字段名区分大小写）：

### 7.1 输出位置/命名/尺寸

```yaml
---
slideLocation: Slides/我的演示
slideName: 2026-03-28-分享
slideWidth: 1920
slideHeight: 1080
slideTOCPageNumber: 2
---
```

- slideLocation：指定生成到哪个文件夹（相对于 vault 根）
- slideName：指定生成的幻灯片主文件名（不含 .md）
- slideWidth / slideHeight：指定幻灯片宽高（数字）
- slideTOCPageNumber：目录页插入到第几页之后（从 1 开始计数；小于 2 时相当于不插入在前面）

### 7.2 设计与文案

```yaml
---
slideDesign: H
slideLogoOrTagline: https://example.com/logo.png
slideSlogan: 一句话副标题
slideAuthor: 张三
slideDate: 2026-03-28
slideLastButNotLeast: "# 谢谢观看"
---
```

- slideDesign：设计字母/名称（会用于 `Cover-{design}`、`TOC-{design}`、`Chapter-{design}`、`BackCover-{design}` 等模板名拼接）
- slideLogoOrTagline：封面/布局的 logo 或 tagline
  - 如果是 `http...`：当作在线图片
  - 如果以常见图片后缀结尾（png/jpg/jpeg/gif/svg/webp）：当作本地图片路径，输出 `![[...]]`
  - 如果是 `[[...]]` 且包含图片后缀：当作 Obsidian 图片链接
  - 其他：当作纯文本 tagline
- slideSlogan：slogan 文案
- slideAuthor：作者（默认取插件设置里的 presenter）
- slideDate：日期（会按插件设置 dateFormat 格式化）
- slideLastButNotLeast：尾页主标题/内容（默认为 `# Farewell`）

### 7.3 开关类选项

```yaml
---
slideNavOn: true
slideAutoConvertLinks: true
slideEnableParagraphFragments: true
---
```

- slideNavOn：是否使用带导航的基础布局作为 defaultTemplate
- slideAutoConvertLinks：是否开启链接/图片自动预览增强（见第 9 节）
- slideEnableParagraphFragments：是否为普通段落自动添加 fragment 动效（见第 8 节）

### 7.4 每类页面的默认 class（按文件级覆盖）

这些字段会覆盖插件设置里的默认 class（只对当前源笔记生效）：

```yaml
---
slideTOCPageListClass: toc-page
slideChapterPageListClass: chapter-page
slideContentPageListClass: content-page
slideBlankPageListClass: blank-page
slideBackCoverPageListClass: backcover-page
---
```

---

## 8. Fragment（逐步出现）能力

SlidesRup 支持多种 fragment 生成方式，让你的内容逐条出现。

### 8.1 目录页/章节页的列表符号

在生成 TOC（目录）或章节内目录时，会根据插件设置决定列表标记：

- `-`：普通列表
- `+`：用于 fragment 列表（Advanced Slides 会把 `+` 列表项当作 fragment）

### 8.2 普通段落自动 fragment（可选）

当启用 `slideEnableParagraphFragments`（frontmatter 或全局设置）后：

- 普通段落会被追加 `<!-- element: class="fragment" data-fragment-index="n" -->`
- H4–H6（在不触发子页面的情况下）也可能被加 fragment
- 列表项（包含 `+`、缩进 `+`、或 `1)` 这种形式）也可能被加 fragment

为了避免误伤，以下内容区域不会被自动加 fragment：

- 代码块（```...```）
- 数学块（`$$...$$`）
- 成对 HTML 标签块（`<div>...</div>` 等）
- 已经有 `<!-- element: ... -->` 的行会被尽量复用并补全 fragment 属性

### 8.3 倒序 fragment 列表（reverse-list-fragment）

如果某一页的内容中包含字符串 `reverse-list-fragment`，且该页存在以 `+` 开头的列表项，那么 SlidesRup 会为这些 `+` 列表项按“倒序”分配 `data-fragment-index`。

最实用的写法：把它作为页面 class 注入（见第 3.1 节），例如：

```md
### 结论 %%reverse-list-fragment%%
+ 最后出现
+ 中间出现
+ 最先出现
```

---

## 9. 链接、图片与提示（tooltip / preview）

### 9.1 链接预览（可选）

当启用 `slideAutoConvertLinks`（frontmatter 或全局设置）后：

- 标准链接 `[名称](https://...)` 会被转换为带 `data-preview-link` 的 `<a>` 标签
- 图片链接（以 `!` 开头）不会被当作普通链接处理

示例：

```md
[官网](https://example.com)
```

### 9.2 在线图片预览（可选）

当启用 `slideAutoConvertLinks` 后：

- 在线图片 `![alt](https://...)` 会被追加 `data-preview-image` 属性（以 `<!-- element: ... -->` 形式）

### 9.3 图片对齐/样式控制（推荐用法）

SlidesRup 支持在图片语法里携带“类名/对齐/尺寸”控制信息。

#### Obsidian 图片（推荐）：`![[path#class|size]]`

格式：

- `#` 后面写 class（可包含 `left/right/center/stretch`，也可写你自己的 class）
- `|` 后面写尺寸
  - `300` 表示宽度 `w:300`
  - `300x200` 表示 `w:300 h:200`

示例：

```md
![[assets/pic.png#left shadow|320x180]]
```

#### 标准 Markdown 图片：`![alt#class|size](url)`

示例：

```md
![示意图#center shadow|480](https://example.com/pic.png)
```

转换后会为图片追加 `<!-- element: ... -->` 控制信息（包含 `align="..."` 与 `class="..."`）。

### 9.4 Tooltip（鼠标悬停提示）

写法：用“链接语法”表达 tooltip，但圆括号里写方向与提示文本：

```md
[术语](> "这是一个右侧提示")
[术语](< "这是一个左侧提示")
[术语](^ "这是一个上方提示")
[术语](v "这是一个下方提示")
```

多行 tooltip：在方向后加 `m`：

```md
[术语](^m "第一行
第二行")
```

---

## 10. 演示者备注（Speaker Notes）

用 `%%& ... %%` 包裹一段文字，可以生成 Advanced Slides 的 `note:` 备注块。

示例：

```md
%%&
这段是演讲者备注
只在演讲者视图显示
%%
```

会被转换为：

```md
note:
这段是演讲者备注
只在演讲者视图显示
```

---

## 11. 特殊块（block / lblock / cblock / rblock）

SlidesRup 支持一种“块布局”语法，最终会生成带 class 的 block 容器，便于做左右/居中排版。

写法：

```md
::: lblock
左侧内容
:::

::: rblock
右侧内容
:::
```

支持的块类型：

- `::: block`（普通块）
- `::: lblock`（left）
- `::: cblock`（center）
- `::: rblock`（right）

关闭写法统一为 `:::`

---

## 12. 标签（#tag）会被渲染成特殊样式

正文里形如 `#tag` 的标签会被转换为：

```html
<span class="sr-tag">#tag</span>
```

用于在幻灯片里展示“标签胶囊”样式。

---

## 13. 一份可直接套用的模板（示例）

```md
---
slideDesign: H
slideAutoConvertLinks: true
slideEnableParagraphFragments: true
slideAuthor: 张三
slideDate: 2026-03-28
slideSlogan: 让 Markdown 直接变幻灯片
---

# 我的分享标题

## 背景 %%|背景%%

### 问题是什么 %%bg=assets/bg.jpg%%
这里是一段普通文字，会按需要加 fragment。

%%&
这一页重点讲清楚“痛点”即可
%%

### 对比方案 %%reverse-list-fragment%%
+ 方案 C
+ 方案 B
+ 方案 A

## 方案 %%|方案%%

### 架构图 %%[[WithoutNav]]%%
![[assets/arch.png#center shadow|900]]

%%---%%
这里是同一内容页的第二个子页面（无新标题）
```

---

## 14. 速查表（你在 Markdown 里能用什么）

- 标题结构：H1=全局标题，H2=章节，H3=页面，H4–H6=子页面（需带 `%%` 才触发）
- 忽略标题：`%%@%%`（不分页/不进目录/不生成 slide）
- 隐藏页：`%%?%%`（内容页/子页面）
- 目录显示名：`%%|短标题%%`
- 追加 class：`%%class-a class-b%%`
- 覆盖 class：`%%!class-a class-b%%`
- 指定模板：`%%[[Template]]%%`；无导航：`%%[[WithoutNav]]%%`
- 设置背景：`%%bg=...%%`
- 手动空白页：原文写 `---` 或 `***`（下一行可加控制标记）
- Notes：`%%& ... %%` → `note:`
- Tooltip：`[词](> "提示")`（支持 `< ^ v` 与 `m` 多行）
- 图片控制：`![[path#class|size]]` 或 `![alt#class|size](url)`
- 布局块：`::: lblock/cblock/rblock` + `:::`

