// Airtable 配置常量
export const AIRTABLE_CONFIG = {
	// 获取更新ID的配置
	GET_UPDATE_IDS: {
		BASE_ID: "appxQqkHaEkjUQnBf",
		TABLE_ID: "EmailSync",
		VIEW_ID: "OBAS",
		FIELD_NAME: "OBASUpdateIDs",
		TOKEN: "patCw7AoXaktNgHNM.bf8eb50a33da820fde56b1f5d4cf5899bc8c508096baf36b700e94cd13570000",
	},

	// 检查API密钥的配置
	CHECK_API_KEY: {
		WEBHOOK_URL:
			"https://hooks.airtable.com/workflows/v1/genericWebhook/appq9k6KwHV3lEIJZ/wfl2uT25IPEljno9w/wtrFUIEC8SXlDsdIu",
		BASE_ID: "appq9k6KwHV3lEIJZ",
		TABLE_ID: "UpdateLogs",
		VIEW_ID: "viweTQ2YarquoqZUT",
		FIELD_NAME: "Match",
		TOKEN: "patCw7AoXaktNgHNM.bf8eb50a33da820fde56b1f5d4cf5899bc8c508096baf36b700e94cd13570000",
	},
} as const;

export const TEMPLATE_PLACE_HOLDERS = {
	design: "DESIGN",
	toc: "TOC",
	presenter: "PRESENTER",
	presentDate: "PRESENT_DATE",
	tagline: "TAGLINE",
	slogan: "SLOGAN",
	pIndex: "PAGE_INDEX",
	cIndex: "CHAPTER_INDEX",
	cName: "CHAPTER_NAME",
	baseLayout: "BASE_LAYOUT",
	obasPath: "OBAS_PATH",
	slideName: "SLIDE_NAME",
};

export const DEFAULT_DESIGNS = [
	"A",
	"B",
	"C",
	"D",
	"E",
	"F",
	"G",
	"H",
] as const;

export const OBAS_LIST_CLASSES = [
	"box-list",
	"fancy-list",
	"fancy-list-row",
	"fancy-list-with-order",
	"fancy-list-with-order-row",
	"grid-list",
	"grid-step-list",
	"grid-step-list-v",
	"order-list-with-border",
	"two-columns-list-1-2",
	"two-columns-list-2-1",
	"three-columns-list",
	"three-columns-list-1-2-1",
	"three-columns-list-1-1-2",
	"three-columns-list-2-1-1",
	"four-columns-list",
];

export const SLIDES_EXTENDED_PLUGIN_FOLDER = "plugins/slides-extended";
export const ADVANCED_SLIDES_PLUGIN_FOLDER = "plugins/obsidian-advanced-slides";
