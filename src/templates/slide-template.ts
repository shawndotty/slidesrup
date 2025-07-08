import { t } from "../lang/helpers";

export const slideTemplate = `
---
css: {{OBASPath}}/Style/main.css
defaultTemplate: "[[{{baseLayout}}]]"
enableLinks: true
height: 1080
margin: 0
pdfSeparateFragments: false
theme: moon
transition: none
width: 1920
---
<!-- slide template="[[${t("Cover")}-{{design}}]]" -->
# ${t("Use OBAS to Express Yourself")}

---

<!-- slide template="[[${t(
	"TOC"
)}-{{design}}]]"  class="order-list-with-border" -->

## ${t("TOC")}

+ ${t("Chapter")} 1
+ ${t("Chapter")} 2
+ ${t("Chapter")} 3
+ ${t("Chapter")} 4

---

<!-- slide template="[[${t(
	"Chapter"
)}-{{design}}]]"  class="order-list-with-border" -->

## ${t("Chapter")} 1

+ ${t("SubSlide")} 1
+ ${t("SubSlide")} 2
+ ${t("SubSlide")} 3
+ ${t("SubSlide")} 4

---

<!-- slide class="chapter-1 fancy-list-row" -->

## ${t("SubSlide")} 1

+ ${t("List")} 1
	+ ${t("SubList")} 1-1
	+ ${t("SubList")} 2-2
+ ${t("List")} 2
	+ ${t("SubList")} 2-1
    + ${t("SubList")} 2-2

---

<!-- slide template="[[${t(
	"BackCover"
)}-{{design}}]]" class="order-list-with-border" -->

# ${t("Farewell")}

+ ${t("Content is the king")}
+ ${t("Keep is simple and powerful")}
+ ${t("Focus on the basic first")}
`;

export const slideChapterTemplate = `
---

<!-- slide template="[[${t(
	"Chapter"
)}-{{design}}]]"  class="order-list-with-border" -->

## ${t("Chapter")} 1

+ ${t("SubSlide")} 1
+ ${t("SubSlide")} 2
+ ${t("SubSlide")} 3
+ ${t("SubSlide")} 4

`;

export const slidePageTemplate = `
---

<!-- slide class="chapter-1 fancy-list-row" -->

## ${t("SubSlide")} 1

+ ${t("List")} 1
	+ ${t("SubList")} 1-1
	+ ${t("SubList")} 2-2
+ ${t("List")} 2
	+ ${t("SubList")} 2-1
    + ${t("SubList")} 2-2

`;

export const baseLayout = `
<grid drag="100 10" class="header bg-with-back-color has-dark-background" drop="topleft"  flow="row"   pad="0 40px"  style="color: white">
Johnny学OB

学习是一切的解药
</grid>
<grid class="content" drag="100 85" drop="0 10" align="topleft" pad="40px">
<% content %>
</grid>
`;

export const baseLayoutWithSteps = `
<grid drag="100 10" class="header steps bg-with-back-color has-dark-background" drop="topleft"  flow="row"  pad="0 40px" style="color: white;">
Johnny学AS

- 第一章
- 第二章
- 第三章
- 第四章
- 第五章
- 第六章

</grid>
<grid class="content" drag="100 85" drop="0 10" align="topleft" pad="40px">
<% content %>
</grid>
`;
