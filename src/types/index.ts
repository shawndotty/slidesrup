// 扩展 App 类型以包含 commands 属性
declare module "obsidian" {
	interface App {
		commands: {
			executeCommandById(id: string): void;
		};
		plugins: {
			plugins: {
				[key: string]: any;
			};
		};
		dom: {
			appContainerEl: HTMLElement;
		};
	}
}
// 修复：将类型声明改为实际的初始值
export interface UserSpecificListClassType {
	TOCPageListClass: string;
	ChapterPageListClass: string;
	ContentPageListClass: string;
	BlankPageListClass: string;
	BackCoverPageListClass: string;
}
export interface AirtableIds {
	baseID: string;
	tableID: string;
	viewID: string;
}

export interface UserDesignCss {
	name: string;
	filePath: string;
	enabled: boolean;
}

export interface SlidesRupSettings {
	updateAPIKey: string;
	updateAPIKeyIsValid: boolean;
	slidesRupFrameworkFolder: string;
	slidesRupRunningLanguage: string;
	userEmail: string;
	userChecked: boolean;
	newSlideLocationOption: string;
	assignedNewSlideLocation: string;
	defaultDesign: string;
	templatesFolder: string;
	userSlideTemplate: string;
	userChapterTemplate: string;
	userChapterAndPagesTemplate: string;
	userPageTemplate: string;
	userBaseLayoutTemplate: string;
	userTocTemplate: string;
	presenter: string;
	tagline: string;
	slogan: string;
	dateFormat: string;
	enableUserTemplates: boolean;
	customizeSlideFolderName: boolean;
	addChapterWithSubPages: boolean;
	demoFolder: string;
	presentationPlugin: string;
	updateIDs: {
		style?: AirtableIds;
		marpTheme?: AirtableIds;
		templates?: AirtableIds;
		demo?: AirtableIds;
		reveal?: AirtableIds;
		revealAS?: AirtableIds;
		help?: AirtableIds;
	};
	slidesRupThemeColor: string;
	slidesRupHue: number;
	slidesRupSaturation: number;
	slidesRupLightness: number;
	slidesRupHeadingFont: string;
	slidesRupMainFont: string;
	slidesRupMainFontSize: number;
	// 各级标题字体
	slidesRupH1Font: string;
	slidesRupH2Font: string;
	slidesRupH3Font: string;
	slidesRupH4Font: string;
	slidesRupH5Font: string;
	slidesRupH6Font: string;
	// 各级标题字号
	slidesRupH1Size: number;
	slidesRupH2Size: number;
	slidesRupH3Size: number;
	slidesRupH4Size: number;
	slidesRupH5Size: number;
	slidesRupH6Size: number;
	// 标题文字变换
	slidesRupHeadingTextTransform: string;
	// 各级标题颜色
	slidesRupH1Color: string;
	slidesRupH2Color: string;
	slidesRupH3Color: string;
	slidesRupH4Color: string;
	slidesRupH5Color: string;
	slidesRupH6Color: string;
	// 正文颜色
	slidesRupBodyColor: string;
	slidesRupParagraphColor: string;
	slidesRupListColor: string;
	slidesRupStrongColor: string;
	slidesRupEmColor: string;
	slidesRupLinkColor: string;
	enableSlidesRupFontFamilyUserSetting: boolean;
	enableSlidesRupFontSizeUserSetting: boolean;
	enableSlidesRupColorUserSetting: boolean;

	customCss: string;
	customMarpCss: string;
	enableCustomCss: boolean;
	slidesRupSlideMode: string;
	slidesRupUserDesigns: string;

	// 用户自定义的CSS设计列表，每个元素包含设计名称、文件路径和启用状态
	slidesRupUserDesignsCss: UserDesignCss[];
	slidesRupAutoConvertLinks: boolean;
	slidesRupEnableParagraphFragments: boolean;

	// Default Slide List Class
	slidesRupDefaultTOCListClass: string;
	slidesRupDefaultChapterListClass: string;
	slidesRupDefaultContentListClass: string;
	slidesRupDefaultBlankListClass: string;
	slidesRupDefaultBackCoverListClass: string;

	slidesRupUserTOCPageListClass: string;
	slidesRupUserChapterPageListClass: string;
	slidesRupUserContentPageListClass: string;
	slidesRupUserBlankPageListClass: string;
	slidesRupUserBackCoverPageListClass: string;

	slidesRupDefaultSlideSize: string;
	slidesRupContentPageSlideType: string;
	slidesRupSlideNavigationMode: string;
	slidesRupDefaultTOCPageNumber: number;

	slidesRupUserSpecificFrontmatterOptions: string;
	slidesRupTurnOnFragmentsInTOCSlide: boolean;
	slidesRupTurnOnFragmentsInChapterSlides: boolean;

	slidesRupTrunOnBaseLayoutNav: boolean;

	slidesRupSeparateNavAndToc: boolean;

	slidesRupEnableHeadingOBURI: boolean;

	userAddedListClasses: string;
	userAddedColumnClasses: string;
}

export interface NocoDBTable {
	viewID: string;
	baseID?: string;
	tableID?: string;
	targetFolderPath: string;
}

export interface NocoDBSettings {
	apiKey: string;
	tables: NocoDBTable[];
	iotoUpdate?: boolean;
	syncSettings?: {
		recordFieldsNames?: {
			title?: string;
			content?: string;
			subFolder?: string;
			extension?: string;
		};
	};
}

export interface RecordFields {
	[key: string]: any;
	Title?: string;
	MD?: string;
	SubFolder?: string;
	Extension?: string;
}

export interface Record {
	fields: RecordFields;
}

// 设置项配置接口
export interface SettingConfig {
	name: string;
	desc: string;
	placeholder?: string;
	value: any;
	onChange: (value: any) => Promise<void>;
}

export interface ReplaceConfig {
	baseLayout?: string;
	toc?: string;
	design?: string;
	slidesRupPath?: string;
	tagline?: string;
	slogan?: string;
	presenter?: string;
	presentDate?: string;
	cIndex?: string;
	pIndex?: string;
	cName?: string;
	slideName?: string;
}

export type Options = {
	theme: string;
	highlightTheme: string;
	template: string;
	separator: string;
	verticalSeparator: string;
	notesSeparator: string;
	enableLinks: boolean;
	title: string;
	css: string | string[];
	remoteCSS: string | string[];
	width: number;
	height: number;
	margin: number;
	showGrid: boolean;
	bg: string;
	center: boolean;
	log: boolean;
	defaultTemplate: string;
};

export interface SRSuggestion {
	id: string;
	title: string;
	description?: string;
	suggestionText?: string;
}

export interface DateFilterOption {
	id: string;
	name: string;
	value: number;
}
