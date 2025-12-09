import { SlidesRupSettings } from "src/types";
import { t } from "src/lang/helpers";

export const DEFAULT_SETTINGS: SlidesRupSettings = {
	updateAPIKey: "",
	updateAPIKeyIsValid: false,
	slidesRupFrameworkFolder: "",
	slidesRupRunningLanguage: "ob",
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
	tagline: "SlidesRup",
	slogan: t("SLIDESRUP_SLOGAN"),
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
		marpTheme: {
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
		help: {
			baseID: "",
			tableID: "",
			viewID: "",
		},
	},
	slidesRupThemeColor: "#0044FF",
	slidesRupHue: 225,
	slidesRupSaturation: 100,
	slidesRupLightness: 50,
	slidesRupHeadingFont: "sysKaiti",
	slidesRupMainFont: "sysKaiti",
	slidesRupMainFontSize: 36,
	// 各级标题默认与 Heading 一致
	slidesRupH1Font: "sysKaiti",
	slidesRupH2Font: "sysKaiti",
	slidesRupH3Font: "sysKaiti",
	slidesRupH4Font: "sysKaiti",
	slidesRupH5Font: "sysKaiti",
	slidesRupH6Font: "sysKaiti",
	// 各级标题字号默认值
	slidesRupH1Size: 108,
	slidesRupH2Size: 72,
	slidesRupH3Size: 64,
	slidesRupH4Size: 56,
	slidesRupH5Size: 48,
	slidesRupH6Size: 40,
	// 标题文字变换默认值
	slidesRupHeadingTextTransform: "none",
	// 各级标题颜色默认值
	slidesRupH1Color: "#111111", // 近乎纯黑
	slidesRupH2Color: "#222222", // 深黑灰
	slidesRupH3Color: "#333333", // 标准黑灰
	slidesRupH4Color: "#444444", // 稍浅黑灰
	slidesRupH5Color: "#666666", // 中灰
	slidesRupH6Color: "#888888", // 浅灰

	// Header Settings

	slidesRupTaglineFont: "sysKaiti",
	slidesRupTaglineSize: 36,
	slidesRupTaglineColor: "#ffffff",

	slidesRupSloganFont: "sysKaiti",
	slidesRupSloganSize: 36,
	slidesRupSloganColor: "#ffffff",

	slidesRupNavFont: "sysKaiti",
	slidesRupNavSize: 36,
	slidesRupNavColor: "#ffffff",

	// 正文颜色默认值
	slidesRupBodyColor: "#111111",
	slidesRupParagraphColor: "#111111",
	slidesRupListColor: "#111111",
	slidesRupStrongColor: "#e74c3c",
	slidesRupEmColor: "#FFD600",
	slidesRupLinkColor: "#3498db",
	enableSlidesRupFontFamilyUserSetting: false,
	enableSlidesRupFontSizeUserSetting: false,
	enableSlidesRupColorUserSetting: false,

	customCss: "",
	customMarpCss: "",
	enableCustomCss: false,
	slidesRupSlideMode: "light",
	slidesRupUserDesigns: "none",
	slidesRupUserDesignsCss: [],
	slidesRupAutoConvertLinks: true,
	slidesRupEnableParagraphFragments: true,

	slidesRupDefaultTOCListClass: "order-list-with-border",
	slidesRupDefaultChapterListClass: "order-list-with-border",
	slidesRupDefaultContentListClass: "fancy-list-row",
	slidesRupDefaultBlankListClass: "fancy-list-row",
	slidesRupDefaultBackCoverListClass: "order-list-with-border",

	slidesRupUserTOCPageListClass: "",
	slidesRupUserChapterPageListClass: "",
	slidesRupUserContentPageListClass: "",
	slidesRupUserBlankPageListClass: "",
	slidesRupUserBackCoverPageListClass: "",

	slidesRupDefaultSlideSize: "p16-9",
	slidesRupContentPageSlideType: "h",
	slidesRupSlideNavigationMode: "default",
	slidesRupDefaultTOCPageNumber: 2,

	slidesRupUserSpecificFrontmatterOptions: "",
	slidesRupTurnOnFragmentsInTOCSlide: true,
	slidesRupTurnOnFragmentsInChapterSlides: true,

	slidesRupTrunOnBaseLayoutNav: true,
	slidesRupSeparateNavAndToc: false,

	slidesRupEnableHeadingOBURI: true,

	userAddedListClasses: "",
	userAddedColumnClasses: "",
};
