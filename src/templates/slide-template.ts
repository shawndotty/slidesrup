import { t } from "../lang/helpers";
import { TEMPLATE_PLACE_HOLDERS } from "src/constants";

// 将静态模板改为函数，以便在运行时动态生成
export function getPageTemplate() {
	return `
---

<!-- slide id="c{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}p{{${
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
}

export function getPagesTemplate() {
	const page = getPageTemplate();
	const pIndexReg = new RegExp(`{{${TEMPLATE_PLACE_HOLDERS.pIndex}}}`, "g");

	return Array.from({ length: 4 }, (_, i) =>
		page.replace(pIndexReg, `${i + 1}`)
	).join("\n");
}

export function getChapterAndPagesTemplate() {
	const pages = getPagesTemplate();

	return `
---

<!-- slide id="c{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}" template="[[${t(
		"Chapter"
	)}-{{${
		TEMPLATE_PLACE_HOLDERS.design
	}}}]]"  class="order-list-with-border" -->

## ${t("Chapter")} {{${TEMPLATE_PLACE_HOLDERS.cIndex}}}

+ [${t("SubSlide")} 1](#c{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}p1)
+ [${t("SubSlide")} 2](#c{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}p2)
+ [${t("SubSlide")} 3](#c{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}p3)
+ [${t("SubSlide")} 4](#c{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}p4)

${pages}
`;
}

export function getChaptersAndPagesTemplate() {
	const chapterAndPages = getChapterAndPagesTemplate();
	const cIndexReg = new RegExp(`{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}`, "g");

	// 优化：使用循环动态生成章节，避免硬编码
	return Array.from({ length: 5 }, (_, i) =>
		chapterAndPages.replace(cIndexReg, `${i + 1}`)
	).join("\n");
}

export function getChapterAndPagesTemplateWithCustomName() {
	const pages = getPagesTemplate();

	return `
---

<!-- slide id="c{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}" template="[[${t(
		"Chapter"
	)}-{{${
		TEMPLATE_PLACE_HOLDERS.design
	}}}]]"  class="order-list-with-border" -->

## {{${TEMPLATE_PLACE_HOLDERS.cName}}}

+ [${t("SubSlide")} 1](#c{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}p1)
+ [${t("SubSlide")} 2](#c{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}p2)
+ [${t("SubSlide")} 3](#c{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}p3)
+ [${t("SubSlide")} 4](#c{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}p4)

${pages}
`;
}

export function getSlideTemplate(slideMode: string) {
	const chaptersAndPages = getChaptersAndPagesTemplate();

	return `
---
css: dist/Styles/main${slideMode === "dark" ? "-dark" : ""}.css
defaultTemplate: "[[{{${TEMPLATE_PLACE_HOLDERS.baseLayout}}}]]"
aliases:
  - {{${TEMPLATE_PLACE_HOLDERS.slideName}}}
enableLinks: true
height: 1080
margin: 0
pdfSeparateFragments: false
verticalSeparator: \\*\\*\\*
theme: white
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
}

export function getSlideChapterTemplate() {
	return `
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
}

export function getSlidePageTemplate() {
	return `
---

<!-- slide id="c{{${TEMPLATE_PLACE_HOLDERS.cIndex}}}p{{${
		TEMPLATE_PLACE_HOLDERS.pIndex
	}}}"  class="chapter-{{${
		TEMPLATE_PLACE_HOLDERS.cIndex
	}}} fancy-list-row" -->

### ${t("SubSlide")}

+ ${t("List")} 1
	+ ${t("SubList")} 1-1
	+ ${t("SubList")} 2-2
+ ${t("List")} 2
	+ ${t("SubList")} 2-1
    + ${t("SubList")} 2-2

`;
}

export function getBaseLayout() {
	return `
<grid drag="100 10" class="header bg-with-back-color has-dark-background" drop="topleft"  flow="row"   pad="0 40px"  style="color: white">
{{${TEMPLATE_PLACE_HOLDERS.tagline}}}

{{${TEMPLATE_PLACE_HOLDERS.slogan}}}
</grid>
<grid class="content" drag="100 85" drop="0 10" align="topleft" pad="40px">
<% content %>
</grid>
`;
}

export function getBaseLayoutWithSteps() {
	return `
<grid drag="100 10" class="header steps bg-with-back-color has-dark-background no-fragments" drop="topleft"  flow="row"  pad="0 40px" style="color: white;">
{{${TEMPLATE_PLACE_HOLDERS.tagline}}}

![[{{${TEMPLATE_PLACE_HOLDERS.toc}}}]]

</grid>
<grid class="content" drag="100 85" drop="0 10" align="topleft" pad="40px">
<% content %>
</grid>
`;
}

export function getToc() {
	return `
+ [${t("Chapter")} 1](#c1)
+ [${t("Chapter")} 2](#c2)
+ [${t("Chapter")} 3](#c3)
+ [${t("Chapter")} 4](#c4)
+ [${t("Chapter")} 5](#c5)
`;
}

// 为了向后兼容，保留原有的导出名称
export const chapterAndPagesTemplate = getChapterAndPagesTemplateWithCustomName;
export const slideTemplate = getSlideTemplate;
export const slideChapterTemplate = getSlideChapterTemplate;
export const slidePageTemplate = getSlidePageTemplate;
export const baseLayout = getBaseLayout;
export const baseLayoutWithSteps = getBaseLayoutWithSteps;
export const toc = getToc;
