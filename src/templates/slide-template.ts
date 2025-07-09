import { t } from "../lang/helpers";
import { TEMPLATE_PLACE_HOLDERS } from "src/constants";

const page = `
---

<!-- slide id="c-{{cIndex}}-p-{{pIndex}}" class="chapter-{{cIndex}} fancy-list-row" -->

### ${t("SubSlide")} {{pIndex}}

+ ${t("List")} 1
	+ ${t("SubList")} 1-1
	+ ${t("SubList")} 2-2
+ ${t("List")} 2
	+ ${t("SubList")} 2-1
    + ${t("SubList")} 2-2
`;

const pages = [
	page.replace(/{{pIndex}}/g, "1"),
	page.replace(/{{pIndex}}/g, "2"),
	page.replace(/{{pIndex}}/g, "3"),
	page.replace(/{{pIndex}}/g, "4"),
].join("\n");

export const chapterAndPages = `
---

<!-- slide id="c-{{cIndex}}" template="[[${t("Chapter")}-{{${
	TEMPLATE_PLACE_HOLDERS.design
}}}]]"  class="order-list-with-border" -->

## ${t("Chapter")} {{cIndex}}

+ [${t("SubSlide")} 1](#c-{{cIndex}}-p-1)
+ [${t("SubSlide")} 2](#c-{{cIndex}}-p-2)
+ [${t("SubSlide")} 3](#c-{{cIndex}}-p-3)
+ [${t("SubSlide")} 4](#c-{{cIndex}}-p-4)

${pages}
`;

const chaptersAndPages = [
	chapterAndPages.replace(/{{cIndex}}/g, "1"),
	chapterAndPages.replace(/{{cIndex}}/g, "2"),
	chapterAndPages.replace(/{{cIndex}}/g, "3"),
	chapterAndPages.replace(/{{cIndex}}/g, "4"),
	chapterAndPages.replace(/{{cIndex}}/g, "5"),
].join("\n");

export const slideTemplate = `
---
css: {{OBASPATH}}/Style/main.css
defaultTemplate: "[[{{BASELAYOUT}}]]"
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
# ${t("Use OBAS to Express Yourself")}

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
