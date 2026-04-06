export const TEMPLATE_PLACE_HOLDERS = {
	design: "DESIGN",
	toc: "TOC",
	presenter: "PRESENTER",
	presentDate: "PRESENT_DATE",
	tagline: "LOGO_OR_TAGLINE",
	slogan: "SLOGAN",
	pIndex: "PAGE_INDEX",
	cIndex: "CHAPTER_INDEX",
	cName: "CHAPTER_NAME",
	baseLayout: "BASE_LAYOUT",
	slidesRupPath: "SLIDESRUP_PATH",
	slideName: "SLIDE_NAME",
};

export const DEFAULT_DESIGNS = ["A", "B", "C", "D", "E", "F", "G", "H"];

/**
 * 设计器主题面板扩展项开关（Feature Flag）
 * - false: 仅显示 Primary Color（当前默认）
 * - true: 恢复 Secondary/Background/Text/字体/比例/圆角/阴影/Theme Mode 等全部主题项
 *
 * 恢复方式：将该常量改为 true 即可。
 */
export const DESIGN_THEME_PANEL_SHOW_EXTENDED_FIELDS = false;

export const SLIDESRUP_LIST_CLASSES = [
	"box-list",
	"fancy-list",
	"fancy-list-row",
	"fancy-list-with-order",
	"fancy-list-with-order-row",
	"grid-list",
	"grid-step-list",
	"grid-step-list-v",
	"order-list-with-border",
	"venn-list",
	"pyramid-list",
	"reverse-list-fragment",
	"two-columns-list-1-2",
	"two-columns-list-2-1",
	"three-columns-list",
	"three-columns-list-1-2-1",
	"three-columns-list-1-1-2",
	"three-columns-list-2-1-1",
	"four-columns-list",
];

export const SLIDESRUP_COLUMN_CLASSES = [
	"columns",
	"twoCols-3-7",
	"twoCols-7-3",
	"twoCols-4-6",
	"twoCols-6-4",
	"threeCols-4-3-3",
	"threeCols-3-4-3",
	"threeCols-3-3-4",
	"threeCols-l-5",
	"threeCols-m-5",
	"threeCols-r-5",
	"fourCols-l-4",
	"fourCols-r-4",
];

export const ContentPageType = {
	None: 0,
	WithNav: 1,
	WithoutNav: 2,
} as const;

export type ContentPageType =
	(typeof ContentPageType)[keyof typeof ContentPageType];

export const SLIDES_EXTENDED_PLUGIN_FOLDER = "plugins/slides-extended";
export const ADVANCED_SLIDES_PLUGIN_FOLDER = "plugins/obsidian-advanced-slides";
export const MARP_THEMES_FOLDER = "MarpThemes";
export const REVEAL_USER_DESIGN_FOLDER = "MyDesigns";
