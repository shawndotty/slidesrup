import { App } from "obsidian";
import { OBASAssistantSettings } from "../types";
import {
	SLIDES_EXTENDED_PLUGIN_FOLDER,
	ADVANCED_SLIDES_PLUGIN_FOLDER,
} from "../constants";

interface StyleSection {
	hsl: string;
	headingTransform: string;
	color: string;
	fontFamily: string;
	fontSize: string;
	userStyle: string;
}

export class ObasStyleService {
	private obasMainStyleFilePath: string;
	private styleSections: StyleSection = {
		hsl: "",
		headingTransform: "",
		color: "",
		fontFamily: "",
		fontSize: "",
		userStyle: "",
	};

	constructor(private app: App, private settings: OBASAssistantSettings) {
		const pluginFolder =
			this.settings.presentationPlugin === "slidesExtended"
				? SLIDES_EXTENDED_PLUGIN_FOLDER
				: ADVANCED_SLIDES_PLUGIN_FOLDER;
		const basePath = `${this.app.vault.configDir}/${pluginFolder}/dist/Styles`;

		this.obasMainStyleFilePath = `${basePath}/my-obas-user-style.css`;
	}

	/**
	 * 生成并写入所有样式到一个文件
	 * 这个方法用于初始化或完全重新生成样式
	 */
	async generateAllStyles() {
		const allStyles = this.generateCompleteStyleSheet();
		await this.app.vault.adapter.write(
			this.obasMainStyleFilePath,
			allStyles
		);
	}

	/**
	 * 生成完整的样式表
	 */
	private generateCompleteStyleSheet(): string {
		const {
			// HSL 设置
			obasHue: hue,
			obasSaturation: saturation,
			obasLightness: lightness,
			// 标题变换设置
			obasHeadingTextTransform,
			// 颜色设置
			obasH1Color,
			obasH2Color,
			obasH3Color,
			obasH4Color,
			obasH5Color,
			obasH6Color,
			obasBodyColor,
			obasParagraphColor,
			obasListColor,
			obasStrongColor,
			obasEmColor,
			obasLinkColor,
			// 字体设置
			obasHeadingFont,
			obasMainFont,
			obasH1Font,
			obasH2Font,
			obasH3Font,
			obasH4Font,
			obasH5Font,
			obasH6Font,
			// 字体大小设置
			obasMainFontSize,
			obasH1Size,
			obasH2Size,
			obasH3Size,
			obasH4Size,
			obasH5Size,
			obasH6Size,
			// 自定义CSS
			customCss,
		} = this.settings as OBASAssistantSettings;

		// 更新样式部分
		this.styleSections.hsl = this.generateHslSection(
			hue,
			saturation,
			lightness
		);
		this.styleSections.headingTransform =
			this.generateHeadingTransformSection(obasHeadingTextTransform);
		this.styleSections.color = this.generateColorSection({
			obasH1Color,
			obasH2Color,
			obasH3Color,
			obasH4Color,
			obasH5Color,
			obasH6Color,
			obasBodyColor,
			obasParagraphColor,
			obasListColor,
			obasStrongColor,
			obasEmColor,
			obasLinkColor,
		});
		this.styleSections.fontFamily = this.generateFontFamilySection({
			obasHeadingFont,
			obasMainFont,
			obasH1Font,
			obasH2Font,
			obasH3Font,
			obasH4Font,
			obasH5Font,
			obasH6Font,
		});
		this.styleSections.fontSize = this.generateFontSizeSection({
			obasMainFontSize,
			obasH1Size,
			obasH2Size,
			obasH3Size,
			obasH4Size,
			obasH5Size,
			obasH6Size,
		});
		this.styleSections.userStyle = customCss || "";

		// 生成字体导入语句
		const fontImports = this.generateFontImports([
			obasHeadingFont,
			obasMainFont,
			obasH1Font || obasHeadingFont,
			obasH2Font || obasHeadingFont,
			obasH3Font || obasHeadingFont,
			obasH4Font || obasHeadingFont,
			obasH5Font || obasHeadingFont,
			obasH6Font || obasHeadingFont,
		]);

		return `
${fontImports}

${this.styleSections.hsl}

${this.styleSections.headingTransform}

${this.styleSections.color}

${this.styleSections.fontFamily}

${this.styleSections.fontSize}

${
	this.styleSections.userStyle
		? `/* 自定义CSS */\n${this.styleSections.userStyle}`
		: ""
}
`;
	}

	/**
	 * 生成HSL样式部分
	 */
	private generateHslSection(
		hue: number,
		saturation: number,
		lightness: number
	): string {
		return `:root {
    /* HSL 基础颜色变量 */
    --obas-base-color: hsl(${hue}, ${saturation}%, ${lightness}%);
    --obas-hue: ${hue};
    --obas-saturation: ${saturation}%;
    --obas-lightness: ${lightness}%;
}`;
	}

	/**
	 * 生成标题变换样式部分
	 */
	private generateHeadingTransformSection(transform: string): string {
		return `.reveal h1,
.reveal h2,
.reveal h3,
.reveal h4,
.reveal h5,
.reveal h6 {
    text-transform: ${transform};
}`;
	}

	/**
	 * 生成颜色样式部分
	 */
	private generateColorSection(colors: {
		obasH1Color: string;
		obasH2Color: string;
		obasH3Color: string;
		obasH4Color: string;
		obasH5Color: string;
		obasH6Color: string;
		obasBodyColor: string;
		obasParagraphColor: string;
		obasListColor: string;
		obasStrongColor: string;
		obasEmColor: string;
		obasLinkColor: string;
	}): string {
		const {
			obasH1Color,
			obasH2Color,
			obasH3Color,
			obasH4Color,
			obasH5Color,
			obasH6Color,
			obasBodyColor,
			obasParagraphColor,
			obasListColor,
			obasStrongColor,
			obasEmColor,
			obasLinkColor,
		} = colors;

		return `:root {
    /* 颜色变量 */
    --r-h1-color: ${obasH1Color};
    --r-h2-color: ${obasH2Color};
    --r-h3-color: ${obasH3Color};
    --r-h4-color: ${obasH4Color};
    --r-h5-color: ${obasH5Color};
    --r-h6-color: ${obasH6Color};
    --r-body-color: ${obasBodyColor};
    --r-paragraph-color: ${obasParagraphColor};
    --r-list-color: ${obasListColor};
    --r-strong-color: ${obasStrongColor};
    --r-em-color: ${obasEmColor};
    --r-link-color: ${obasLinkColor};
}

/* 标题颜色应用 */
.reveal h1 { color: var(--r-h1-color); }
.reveal h2 { color: var(--r-h2-color); }
.reveal h3 { color: var(--r-h3-color); }
.reveal h4 { color: var(--r-h4-color); }
.reveal h5 { color: var(--r-h5-color); }
.reveal h6 { color: var(--r-h6-color); }

/* 主体和文本元素颜色 */
.reveal { color: var(--r-body-color); }
.reveal p { color: var(--r-paragraph-color); }
.reveal ul, .reveal ol { color: var(--r-list-color); }
.reveal strong, .reveal b { color: var(--r-strong-color); }
.reveal em, .reveal i { color: var(--r-em-color); }
.reveal a { color: var(--r-link-color); }
.reveal a:hover { opacity: 0.8; }`;
	}

	/**
	 * 生成字体族样式部分
	 */
	private generateFontFamilySection(fonts: {
		obasHeadingFont: string;
		obasMainFont: string;
		obasH1Font?: string;
		obasH2Font?: string;
		obasH3Font?: string;
		obasH4Font?: string;
		obasH5Font?: string;
		obasH6Font?: string;
	}): string {
		const {
			obasHeadingFont,
			obasMainFont,
			obasH1Font,
			obasH2Font,
			obasH3Font,
			obasH4Font,
			obasH5Font,
			obasH6Font,
		} = fonts;

		const headingFont = this.getFontFamily(obasHeadingFont);
		const mainFont = this.getFontFamily(obasMainFont);
		const h1Font = this.getFontFamily(
			this.getHeadingFontOption(obasH1Font, obasHeadingFont)
		);
		const h2Font = this.getFontFamily(
			this.getHeadingFontOption(obasH2Font, obasHeadingFont)
		);
		const h3Font = this.getFontFamily(
			this.getHeadingFontOption(obasH3Font, obasHeadingFont)
		);
		const h4Font = this.getFontFamily(
			this.getHeadingFontOption(obasH4Font, obasHeadingFont)
		);
		const h5Font = this.getFontFamily(
			this.getHeadingFontOption(obasH5Font, obasHeadingFont)
		);
		const h6Font = this.getFontFamily(
			this.getHeadingFontOption(obasH6Font, obasHeadingFont)
		);

		return `:root {
    /* 字体族变量 */
    --r-main-font: ${mainFont};
    --r-heading-font: ${headingFont};
    --r-h1-font: ${h1Font};
    --r-h2-font: ${h2Font};
    --r-h3-font: ${h3Font};
    --r-h4-font: ${h4Font};
    --r-h5-font: ${h5Font};
    --r-h6-font: ${h6Font};
}

/* 标题字体应用 */
.reveal h1 { font-family: var(--r-h1-font); }
.reveal h2 { font-family: var(--r-h2-font); }
.reveal h3 { font-family: var(--r-h3-font); }
.reveal h4 { font-family: var(--r-h4-font); }
.reveal h5 { font-family: var(--r-h5-font); }
.reveal h6 { font-family: var(--r-h6-font); }

/* 主体字体 */
.reveal { font-family: var(--r-main-font); }`;
	}

	private getHeadingFontOption(
		levelFont: string | undefined,
		headingfont: string
	): string {
		return levelFont && levelFont.trim() !== "" && levelFont !== "inherit"
			? levelFont
			: headingfont === "inherit"
			? this.settings.obasMainFont
			: headingfont;
	}

	/**
	 * 生成字体大小样式部分
	 */
	private generateFontSizeSection(sizes: {
		obasMainFontSize: number;
		obasH1Size: number;
		obasH2Size: number;
		obasH3Size: number;
		obasH4Size: number;
		obasH5Size: number;
		obasH6Size: number;
	}): string {
		const {
			obasMainFontSize,
			obasH1Size,
			obasH2Size,
			obasH3Size,
			obasH4Size,
			obasH5Size,
			obasH6Size,
		} = sizes;

		return `:root {
    /* 字体大小变量 */
    --r-main-font-size: ${obasMainFontSize}px;
    --r-heading1-size: ${obasH1Size}px;
    --r-heading2-size: ${obasH2Size}px;
    --r-heading3-size: ${obasH3Size}px;
    --r-heading4-size: ${obasH4Size}px;
    --r-heading5-size: ${obasH5Size}px;
    --r-heading6-size: ${obasH6Size}px;
}

/* 标题字体大小应用 */
.reveal h1 { font-size: var(--r-heading1-size); }
.reveal h2 { font-size: var(--r-heading2-size); }
.reveal h3 { font-size: var(--r-heading3-size); }
.reveal h4 { font-size: var(--r-heading4-size); }
.reveal h5 { font-size: var(--r-heading5-size); }
.reveal h6 { font-size: var(--r-heading6-size); }

/* 主体字体大小 */
.reveal { font-size: var(--r-main-font-size); }`;
	}

	/**
	 * 生成字体导入语句
	 */
	private generateFontImports(fonts: string[]): string {
		// 只导入一次相同的字体，过滤掉系统字体
		const uniqueFonts = fonts
			.filter(
				(font, idx, arr) =>
					!font.startsWith("sys") && arr.indexOf(font) === idx
			)
			.map(
				(font) =>
					`@import url('https://cn.windfonts.com/wenfeng/fonts/${font}/regular/web/index.css');`
			)
			.filter(Boolean)
			.join("\n");

		return uniqueFonts;
	}

	/**
	 * 获取字体族字符串
	 */
	private getFontFamily(font: string): string {
		const systemFonts: Record<string, string> = {
			sysKaiti: "楷体, KaiTi, STKaiti, serif",
			sysHeiti: "黑体, SimHei, STHeiti, sans-serif",
			sysSongTi: "宋体, SimSun, STSong, serif",
			sysFangSongTi: "仿宋, FangSong, STFangsong, serif",
			sysEnglishSans: "Arial, Helvetica, sans-serif",
			sysEnglishSerif: "Times New Roman, Times, serif",
			sysEnglishMono: "Courier New, Courier, monospace",
			sysRoboto: "'Roboto', Arial, Helvetica, sans-serif",
			sysOpenSans: "'Open Sans', Arial, Helvetica, sans-serif",
			sysLato: "'Lato', Arial, Helvetica, sans-serif",
			sysMontserrat: "'Montserrat', Arial, Helvetica, sans-serif",
			sysSourceSansPro: "'Source Sans Pro', Arial, Helvetica, sans-serif",
		};

		if (font.startsWith("sys") && systemFonts[font]) {
			return systemFonts[font];
		}
		return `'wenfeng-${font}'`;
	}

	/**
	 * 更新特定样式部分并重写文件
	 */
	private async updateStyleSection(
		section: keyof StyleSection,
		content: string
	) {
		this.styleSections[section] = content;
		await this.writeStyleFile();
	}

	/**
	 * 直接写入样式文件，不重新生成样式
	 */
	private async writeStyleFile() {
		const allStyles = this.generateStyleSheetFromSections();
		await this.app.vault.adapter.write(
			this.obasMainStyleFilePath,
			allStyles
		);
	}

	/**
	 * 从样式部分生成样式表，不重新从设置生成
	 */
	private generateStyleSheetFromSections(): string {
		// 生成字体导入语句（需要从当前设置获取字体信息）
		const fontImports = this.generateFontImports([
			this.settings.obasHeadingFont,
			this.settings.obasMainFont,
			this.settings.obasH1Font || this.settings.obasHeadingFont,
			this.settings.obasH2Font || this.settings.obasHeadingFont,
			this.settings.obasH3Font || this.settings.obasHeadingFont,
			this.settings.obasH4Font || this.settings.obasHeadingFont,
			this.settings.obasH5Font || this.settings.obasHeadingFont,
			this.settings.obasH6Font || this.settings.obasHeadingFont,
		]);

		return `
${fontImports}

${this.styleSections.hsl}

${this.styleSections.headingTransform}

${this.styleSections.color}

${this.styleSections.fontFamily}

${this.styleSections.fontSize}

${
	this.styleSections.userStyle
		? `/* 自定义CSS */\n${this.styleSections.userStyle}`
		: ""
}
`;
	}

	// 保留原有方法以保持向后兼容性，但现在提供更精细的控制
	async modifyObasHslFile() {
		const { obasThemeColor } = this.settings;
		const hsl = this.colorToHsl(obasThemeColor);
		await this.updateStyleSection(
			"hsl",
			this.generateHslSection(hsl.h, hsl.s, hsl.l)
		);
	}

	/**
	 * Convert hex color to HSL color values
	 * @param hex - Hex color string (e.g. "#ff0000" or "#f00")
	 * @returns Object containing h, s, l values
	 */
	private colorToHsl(hex: string): { h: number; s: number; l: number } {
		// Convert hex to RGB first
		const r = parseInt(hex.slice(1, 3), 16) / 255;
		const g = parseInt(hex.slice(3, 5), 16) / 255;
		const b = parseInt(hex.slice(5, 7), 16) / 255;

		// Find min and max RGB values
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);

		// Calculate HSL values
		let h = 0;
		let s = 0;
		const l = (max + min) / 2;

		if (max !== min) {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

			switch (max) {
				case r:
					h = (g - b) / d + (g < b ? 6 : 0);
					break;
				case g:
					h = (b - r) / d + 2;
					break;
				case b:
					h = (r - g) / d + 4;
					break;
			}
			h /= 6;
		}

		return {
			h: Math.round(h * 360),
			s: Math.round(s * 100),
			l: Math.round(l * 100),
		};
	}

	async modifyObasHeadingTransformFile() {
		const { obasHeadingTextTransform } = this.settings;
		await this.updateStyleSection(
			"headingTransform",
			this.generateHeadingTransformSection(obasHeadingTextTransform)
		);
	}

	async modifyObasColorFile() {
		const colors = {
			obasH1Color: this.settings.obasH1Color,
			obasH2Color: this.settings.obasH2Color,
			obasH3Color: this.settings.obasH3Color,
			obasH4Color: this.settings.obasH4Color,
			obasH5Color: this.settings.obasH5Color,
			obasH6Color: this.settings.obasH6Color,
			obasBodyColor: this.settings.obasBodyColor,
			obasParagraphColor: this.settings.obasParagraphColor,
			obasListColor: this.settings.obasListColor,
			obasStrongColor: this.settings.obasStrongColor,
			obasEmColor: this.settings.obasEmColor,
			obasLinkColor: this.settings.obasLinkColor,
		};
		await this.updateStyleSection(
			"color",
			this.generateColorSection(colors)
		);
	}

	async modifyObasFontFamilyFile() {
		const fonts = {
			obasHeadingFont: this.settings.obasHeadingFont,
			obasMainFont: this.settings.obasMainFont,
			obasH1Font: this.settings.obasH1Font,
			obasH2Font: this.settings.obasH2Font,
			obasH3Font: this.settings.obasH3Font,
			obasH4Font: this.settings.obasH4Font,
			obasH5Font: this.settings.obasH5Font,
			obasH6Font: this.settings.obasH6Font,
		};
		await this.updateStyleSection(
			"fontFamily",
			this.generateFontFamilySection(fonts)
		);
	}

	async modifyObasFontSizeFile() {
		const sizes = {
			obasMainFontSize: this.settings.obasMainFontSize,
			obasH1Size: this.settings.obasH1Size,
			obasH2Size: this.settings.obasH2Size,
			obasH3Size: this.settings.obasH3Size,
			obasH4Size: this.settings.obasH4Size,
			obasH5Size: this.settings.obasH5Size,
			obasH6Size: this.settings.obasH6Size,
		};
		await this.updateStyleSection(
			"fontSize",
			this.generateFontSizeSection(sizes)
		);
	}

	async modifyObasUserStyleFile() {
		await this.updateStyleSection(
			"userStyle",
			this.settings.customCss || ""
		);
	}

	// 清空特定样式部分
	async clearObasHslFile() {
		await this.updateStyleSection("hsl", "");
	}

	async clearObasHeadingTransformFile() {
		await this.updateStyleSection("headingTransform", "");
	}

	async clearObasColorFile() {
		await this.updateStyleSection("color", "");
	}

	async clearObasFontFamilyFile() {
		await this.updateStyleSection("fontFamily", "");
	}

	async clearObasFontSizeFile() {
		await this.updateStyleSection("fontSize", "");
	}

	async clearObasUserStyleFile() {
		await this.updateStyleSection("userStyle", "");
	}

	/**
	 * 清空所有样式
	 */
	async clearAllStyles() {
		Object.keys(this.styleSections).forEach((key) => {
			this.styleSections[key as keyof StyleSection] = "";
		});
		await this.writeStyleFile();
	}
}
