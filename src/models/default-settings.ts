import { OBASAssistantSettings } from "src/types";
import { t } from "src/lang/helpers";

export const DEFAULT_SETTINGS: OBASAssistantSettings = {
	updateAPIKey: "",
	updateAPIKeyIsValid: false,
	obasFrameworkFolder: "",
	obasRunningLanguage: "ob",
	userEmail: "",
	userChecked: false,
	newSlideLocationOption: "current",
	assignedNewSlideLocation: "",
	defaultDesign: "none",
	templatesFolder: "",
	demoFolder: "",
	userSlideTemplate: "",
	userChapterTemplate: "",
	userChapterAndPagesTemplate: "",
	userPageTemplate: "",
	userBaseLayoutTemplate: "",
	userTocTemplate: "",
	presenter: "Johnny",
	tagline: "OBAS",
	slogan: t("Keep is simple but elegant"),
	dateFormat: "",
	enableUserTemplates: true,
	customizeSlideFolderName: true,
	addChapterWithSubPages: true,
	presentationPlugin: "slidesExtended",
	updateIDs: {
		style: {
			baseID: "",
			tableID: "",
			viewID: "",
		},
		templates: {
			baseID: "",
			tableID: "",
			viewID: "",
		},
		demo: {
			baseID: "",
			tableID: "",
			viewID: "",
		},
		reveal: {
			baseID: "",
			tableID: "",
			viewID: "",
		},
		revealAS: {
			baseID: "",
			tableID: "",
			viewID: "",
		},
	},
	obasHue: 225,
	obasSaturation: 100,
	obasLightness: 50,
	obasHeadingFont: "sysKaiti",
	obasMainFont: "sysKaiti",
	obasMainFontSize: 36,
	// 各级标题默认与 Heading 一致
	obasH1Font: "sysKaiti",
	obasH2Font: "sysKaiti",
	obasH3Font: "sysKaiti",
	obasH4Font: "sysKaiti",
	obasH5Font: "sysKaiti",
	obasH6Font: "sysKaiti",
	// 各级标题字号默认值
	obasH1Size: 108,
	obasH2Size: 72,
	obasH3Size: 64,
	obasH4Size: 56,
	obasH5Size: 48,
	obasH6Size: 40,
	// 标题文字变换默认值
	obasHeadingTextTransform: "none",
	// 各级标题颜色默认值
	obasH1Color: "#111111", // 近乎纯黑
	obasH2Color: "#222222", // 深黑灰
	obasH3Color: "#333333", // 标准黑灰
	obasH4Color: "#444444", // 稍浅黑灰
	obasH5Color: "#666666", // 中灰
	obasH6Color: "#888888", // 浅灰
	// 正文颜色默认值
	obasBodyColor: "#111111",
	obasParagraphColor: "#111111",
	obasListColor: "#111111",
	obasStrongColor: "#e74c3c",
	obasEmColor: "#FFD600",
	obasLinkColor: "#3498db",
	enableObasFontFamilyUserSetting: false,
	enableObasFontSizeUserSetting: false,
	enableObasColorUserSetting: false,

	customCss: "",
	enableCustomCss: false,
};
