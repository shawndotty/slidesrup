import { t } from "../lang/helpers";
import { TEMPLATE_PLACE_HOLDERS } from "src/constants";

const page = `
---

<!-- slide id="c-{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}-p-{{${
	TEMPLATE_PLACE_HOLDERS.pIndex
}}}" class="chapter-{{${TEMPLATE_PLACE_HOLDERS.cIndex}}} fancy-list-row" -->

### ${t("SubSlide")} {{${TEMPLATE_PLACE_HOLDERS.pIndex}}}

+ ${t("List")} 1
	+ ${t("SubList")} 1-1
	+ ${t("SubList")} 2-2
+ ${t("List")} 2
	+ ${t("SubList")} 2-1
    + ${t("SubList")} 2-2
`;

const pIndexReg = new RegExp(`{{${TEMPLATE_PLACE_HOLDERS.pIndex}}}`, "g");

const pages = Array.from({ length: 4 }, (_, i) =>
	page.replace(pIndexReg, `${i + 1}`)
).join("\n");

const chapterAndPages = `
---

<!-- slide id="c-{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}" template="[[${t(
	"Chapter"
)}-{{${TEMPLATE_PLACE_HOLDERS.design}}}]]"  class="order-list-with-border" -->

## ${t("Chapter")} {{${TEMPLATE_PLACE_HOLDERS.cIndex}}}

+ [${t("SubSlide")} 1](#c-{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}-p-1)
+ [${t("SubSlide")} 2](#c-{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}-p-2)
+ [${t("SubSlide")} 3](#c-{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}-p-3)
+ [${t("SubSlide")} 4](#c-{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}-p-4)

${pages}
`;

const cIndexReg = new RegExp(`{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}`, "g");

// 优化：使用循环动态生成章节，避免硬编码
const chaptersAndPages = Array.from({ length: 5 }, (_, i) =>
	chapterAndPages.replace(cIndexReg, `${i + 1}`)
).join("\n");

export const chapterAndPagesTemplate = `
---

<!-- slide id="c-{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}" template="[[${t(
	"Chapter"
)}-{{${TEMPLATE_PLACE_HOLDERS.design}}}]]"  class="order-list-with-border" -->

## {{${TEMPLATE_PLACE_HOLDERS.cName}}}

+ [${t("SubSlide")} 1](#c-{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}-p-1)
+ [${t("SubSlide")} 2](#c-{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}-p-2)
+ [${t("SubSlide")} 3](#c-{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}-p-3)
+ [${t("SubSlide")} 4](#c-{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}-p-4)

${pages}
`;

export const slideTemplate = `
---
css: {{${TEMPLATE_PLACE_HOLDERS.obasPath}}}/Styles/main.css
defaultTemplate: "[[{{${TEMPLATE_PLACE_HOLDERS.baseLayout}}}]]"
aliases:
  - {{${TEMPLATE_PLACE_HOLDERS.slideName}}}
enableLinks: true
height: 1080
margin: 0
pdfSeparateFragments: false
theme: moon
transition: none
width: 1920
---
<!-- slide id="home" template="[[${t("Cover")}-{{${
	TEMPLATE_PLACE_HOLDERS.design
}}}]]" -->
# {{${TEMPLATE_PLACE_HOLDERS.slideName}}}

## {{${TEMPLATE_PLACE_HOLDERS.presenter}}}

### {{${TEMPLATE_PLACE_HOLDERS.presentDate}}}

---

<!-- slide template="[[${t("TOC")}-{{${
	TEMPLATE_PLACE_HOLDERS.design
}}}]]"  class="order-list-with-border" -->

## ${t("TOC")}

![[{{${TEMPLATE_PLACE_HOLDERS.toc}}}]]

${chaptersAndPages}

---

<!-- slide template="[[${t("BackCover")}-{{${
	TEMPLATE_PLACE_HOLDERS.design
}}}]]" class="order-list-with-border" -->

# ${t("Farewell")}

+ ${t("Content is the king")}
+ ${t("Keep is simple and powerful")}
+ ${t("Focus on the basic first")}
`;

export const slideChapterTemplate = `
---

<!-- slide template="[[${t("Chapter")}-{{${
	TEMPLATE_PLACE_HOLDERS.design
}}}]]"  class="order-list-with-border" -->

## ${t("Chapter")} 1

+ ${t("SubSlide")} 1
+ ${t("SubSlide")} 2
+ ${t("SubSlide")} 3
+ ${t("SubSlide")} 4

`;

export const slidePageTemplate = `
---

<!-- slide id="c-{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}-p-{{${
	TEMPLATE_PLACE_HOLDERS.pIndex
}}}"  class="chapter-{{${TEMPLATE_PLACE_HOLDERS.cIndex}}} fancy-list-row" -->

## ${t("SubSlide")}

+ ${t("List")} 1
	+ ${t("SubList")} 1-1
	+ ${t("SubList")} 2-2
+ ${t("List")} 2
	+ ${t("SubList")} 2-1
    + ${t("SubList")} 2-2

`;

export const baseLayout = `
<grid drag="100 10" class="header bg-with-back-color has-dark-background" drop="topleft"  flow="row"   pad="0 40px"  style="color: white">
{{${TEMPLATE_PLACE_HOLDERS.tagline}}}

{{${TEMPLATE_PLACE_HOLDERS.slogan}}}
</grid>
<grid class="content" drag="100 85" drop="0 10" align="topleft" pad="40px">
<% content %>
</grid>
`;

export const baseLayoutWithSteps = `
<grid drag="100 10" class="header steps bg-with-back-color has-dark-background no-fragments" drop="topleft"  flow="row"  pad="0 40px" style="color: white;">
[{{${TEMPLATE_PLACE_HOLDERS.tagline}}}](#home)

![[{{${TEMPLATE_PLACE_HOLDERS.toc}}}]]

</grid>
<grid class="content" drag="100 85" drop="0 10" align="topleft" pad="40px">
<% content %>
</grid>
`;

export const toc = `
+ [${t("Chapter")} 1](#c-1)
+ [${t("Chapter")} 2](#c-2)
+ [${t("Chapter")} 3](#c-3)
+ [${t("Chapter")} 4](#c-4)
+ [${t("Chapter")} 5](#c-5)
`;
