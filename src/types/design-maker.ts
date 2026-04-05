export const DESIGN_MAKER_VIEW_TYPE = "slides-rup-design-maker";

export type DesignPageType =
	| "cover"
	| "toc"
	| "chapter"
	| "content"
	| "contentWithoutNav"
	| "blank"
	| "backCover";

export type DesignBlockRole =
	| "grid"
	| "text"
	| "image"
	| "placeholder"
	| "content";

export interface DesignBlockRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export type DesignRectUnit = "percent" | "px";

export interface DesignGridBlock {
	id: string;
	type: "grid";
	role: DesignBlockRole;
	rect: DesignBlockRect;
	content: string;
	className: string;
	style: string;
	pad: string;
	align: string;
	flow: string;
	filter: string;
	justifyContent: string;
	bg: string;
	border: string;
	animate: string;
	opacity: string;
	rotate: string;
	frag: string;
	extraAttributes: Record<string, string>;
	hiddenInDesign?: boolean;
	children?: DesignCanvasBlock[];
}

export interface DesignRawBlock {
	id: string;
	type: "raw";
	raw: string;
	hiddenInDesign?: boolean;
}

export type DesignCanvasBlock = DesignGridBlock | DesignRawBlock;

export interface ThemeStyleDraft {
	themeName: string;
	primaryColor: string;
	secondaryColor: string;
	backgroundColor: string;
	textColor: string;
	headingFont: string;
	bodyFont: string;
	headingScale: number;
	bodyScale: number;
	borderRadius: number;
	shadowOpacity: number;
	mode: "light" | "dark";
	headerDirectives: string[];
	rawCss: string;
}

export interface DesignPageDraft {
	type: DesignPageType;
	label: string;
	fileName: string;
	filePath: string;
	blocks: DesignCanvasBlock[];
	rawMarkdown: string;
	hasUnsupportedContent: boolean;
	rectUnit?: DesignRectUnit;
	unitWarnings?: string[];
}

export interface DesignDraft {
	designName: string;
	designPath: string;
	sourceDesignName: string;
	pages: Record<DesignPageType, DesignPageDraft>;
	theme: ThemeStyleDraft;
}

export interface DesignMakerViewState extends Record<string, unknown> {
	designPath: string;
	designName: string;
}
