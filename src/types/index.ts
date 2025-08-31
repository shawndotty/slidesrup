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

export interface OBASAssistantSettings {
	updateAPIKey: string;
	updateAPIKeyIsValid: boolean;
	obasFrameworkFolder: string;
	obasRunningLanguage: string;
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
		style: AirtableIds;
		templates: AirtableIds;
		demo: AirtableIds;
		reveal: AirtableIds;
		revealAS: AirtableIds;
	};
	obasThemeColor: string;
	obasHue: number;
	obasSaturation: number;
	obasLightness: number;
	obasHeadingFont: string;
	obasMainFont: string;
	obasMainFontSize: number;
	// 各级标题字体
	obasH1Font: string;
	obasH2Font: string;
	obasH3Font: string;
	obasH4Font: string;
	obasH5Font: string;
	obasH6Font: string;
	// 各级标题字号
	obasH1Size: number;
	obasH2Size: number;
	obasH3Size: number;
	obasH4Size: number;
	obasH5Size: number;
	obasH6Size: number;
	// 标题文字变换
	obasHeadingTextTransform: string;
	// 各级标题颜色
	obasH1Color: string;
	obasH2Color: string;
	obasH3Color: string;
	obasH4Color: string;
	obasH5Color: string;
	obasH6Color: string;
	// 正文颜色
	obasBodyColor: string;
	obasParagraphColor: string;
	obasListColor: string;
	obasStrongColor: string;
	obasEmColor: string;
	obasLinkColor: string;
	enableObasFontFamilyUserSetting: boolean;
	enableObasFontSizeUserSetting: boolean;
	enableObasColorUserSetting: boolean;

	customCss: string;
	enableCustomCss: boolean;
	obasSlideMode: string;
	obasUserDesigns: string;

	// 用户自定义的CSS设计列表，每个元素包含设计名称、文件路径和启用状态
	obasUserDesignsCss: UserDesignCss[];
	obasAutoConvertLinks: boolean;
	obasEnableParagraphFragments: boolean;
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
	obasPath?: string;
	tagline?: string;
	slogan?: string;
	presenter?: string;
	presentDate?: string;
	cIndex?: string;
	pIndex?: string;
	cName?: string;
	slideName?: string;
}
