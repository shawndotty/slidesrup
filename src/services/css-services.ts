import { App } from "obsidian";
import { OBASAssistantSettings } from "../types";
import {
	SLIDES_EXTENDED_PLUGIN_FOLDER,
	ADVANCED_SLIDES_PLUGIN_FOLDER,
} from "../constants";

export class ObasStyleService {
	private obasHslFilePath: string;
	private obasTypographyFilePath: string;
	private obasColorFilePath: string;

	constructor(private app: App, private settings: OBASAssistantSettings) {
		if (this.settings.presentationPlugin === "slidesExtended") {
			this.obasHslFilePath = `${this.app.vault.configDir}/${SLIDES_EXTENDED_PLUGIN_FOLDER}/dist/Styles/my-obas-hsl.css`;
			this.obasTypographyFilePath = `${this.app.vault.configDir}/${SLIDES_EXTENDED_PLUGIN_FOLDER}/dist/Styles/my-obas-typography.css`;
			this.obasColorFilePath = `${this.app.vault.configDir}/${SLIDES_EXTENDED_PLUGIN_FOLDER}/dist/Styles/my-obas-color.css`;
		} else {
			this.obasHslFilePath = `${this.app.vault.configDir}/${ADVANCED_SLIDES_PLUGIN_FOLDER}/dist/Styles/my-obas-hsl.css`;
			this.obasTypographyFilePath = `${this.app.vault.configDir}/${ADVANCED_SLIDES_PLUGIN_FOLDER}/dist/Styles/my-obas-typography.css`;
			this.obasColorFilePath = `${this.app.vault.configDir}/${ADVANCED_SLIDES_PLUGIN_FOLDER}/dist/Styles/my-obas-color.css`;
		}
	}

	async modifyObasHslFile() {
		const {
			obasHue: hue,
			obasSaturation: saturation,
			obasLightness: lightness,
		} = this.settings;
		const hslSettings = `
:root {
    --obas-base-color: hsl(${hue}, ${saturation}%, ${lightness}%);
    --obas-hue: ${hue};
    --obas-saturation: ${saturation}%;
    --obas-lightness: ${lightness}%;
}
`;

		// Use vault.adapter.write to simplify creation and modification.
		// This will create the file (and any necessary parent folders) if it doesn't exist,
		// or overwrite it if it does.
		await this.app.vault.adapter.write(this.obasHslFilePath, hslSettings);
	}

	/**
	 * 颜色设置文件生成方法
	 */
	async modifyObasColorFile() {
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
		} = this.settings as OBASAssistantSettings;

		const colorSettings = `
:root {
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

/* Apply heading level specific colors for Reveal-based slide plugins */
.reveal h1 { 
	color: var(--r-h1-color);
}
.reveal h2 { 
	color: var(--r-h2-color);
}
.reveal h3 { 
	color: var(--r-h3-color);
}
.reveal h4 { 
	color: var(--r-h4-color);
}
.reveal h5 { 
	color: var(--r-h5-color);
}
.reveal h6 { 
	color: var(--r-h6-color);
}

/* Apply body and text element colors */
.reveal {
	color: var(--r-body-color);
}

.reveal p {
	color: var(--r-paragraph-color);
}

.reveal ul, .reveal ol {
	color: var(--r-list-color);
}

.reveal strong, .reveal b {
	color: var(--r-strong-color);
}

.reveal em, .reveal i {
	color: var(--r-em-color);
}

.reveal a {
	color: var(--r-link-color);
}

.reveal a:hover {
	opacity: 0.8;
}
`;

		await this.app.vault.adapter.write(
			this.obasColorFilePath,
			colorSettings
		);
	}

	/**
	 * 清空颜色设置文件内容
	 */
	async clearObasTypographyFile() {
		// 将文件内容设置为空字符串，实现清空效果
		await this.app.vault.adapter.write(this.obasTypographyFilePath, "");
	}

	/**
	 * 清空颜色设置文件内容
	 */
	async clearObasColorFile() {
		// 将文件内容设置为空字符串，实现清空效果
		await this.app.vault.adapter.write(this.obasColorFilePath, "");
	}

	/**
	 * 优化后的字体样式文件生成方法
	 */
	async modifyObasTypographyFile() {
		const {
			obasHeadingFont,
			obasMainFont,
			obasMainFontSize,
			obasH1Font,
			obasH2Font,
			obasH3Font,
			obasH4Font,
			obasH5Font,
			obasH6Font,
			obasH1Size,
			obasH2Size,
			obasH3Size,
			obasH4Size,
			obasH5Size,
			obasH6Size,
			obasHeadingTextTransform,
		} = this.settings as OBASAssistantSettings;

		// 系统字体映射表
		const systemFonts: Record<string, string> = {
			sysKaiti: "楷体, KaiTi, STKaiti, serif",
			sysHeiti: "黑体, SimHei, STHeiti, sans-serif",
			sysSongTi: "宋体, SimSun, STSong, serif",
			sysFangSongTi: "仿宋, FangSong, STFangsong, serif",
			// 常用免费英文字体
			sysEnglishSans: "Arial, Helvetica, sans-serif",
			sysEnglishSerif: "Times New Roman, Times, serif",
			sysEnglishMono: "Courier New, Courier, monospace",
			sysRoboto: "'Roboto', Arial, Helvetica, sans-serif",
			sysOpenSans: "'Open Sans', Arial, Helvetica, sans-serif",
			sysLato: "'Lato', Arial, Helvetica, sans-serif",
			sysMontserrat: "'Montserrat', Arial, Helvetica, sans-serif",
			sysSourceSansPro: "'Source Sans Pro', Arial, Helvetica, sans-serif",
		};

		// 获取字体 CSS 字体族字符串
		const getFontFamily = (font: string) => {
			if (font.startsWith("sys") && systemFonts[font]) {
				return systemFonts[font];
			}
			return `'wenfeng-${font}'`;
		};

		// 获取字体 @import 语句
		const getFontImport = (font: string) => {
			if (font.startsWith("sys")) return "";
			return `@import url('https://cn.windfonts.com/wenfeng/fonts/${font}/regular/web/index.css');`;
		};

		const headingFont = getFontFamily(obasHeadingFont);
		const mainFont = getFontFamily(obasMainFont);

		// 各级标题（缺失则回退到 Heading Font）
		const h1Font = getFontFamily(obasH1Font || obasHeadingFont);
		const h2Font = getFontFamily(obasH2Font || obasHeadingFont);
		const h3Font = getFontFamily(obasH3Font || obasHeadingFont);
		const h4Font = getFontFamily(obasH4Font || obasHeadingFont);
		const h5Font = getFontFamily(obasH5Font || obasHeadingFont);
		const h6Font = getFontFamily(obasH6Font || obasHeadingFont);

		// 只导入一次相同的字体
		const imports = [
			obasHeadingFont,
			obasMainFont,
			obasH1Font || obasHeadingFont,
			obasH2Font || obasHeadingFont,
			obasH3Font || obasHeadingFont,
			obasH4Font || obasHeadingFont,
			obasH5Font || obasHeadingFont,
			obasH6Font || obasHeadingFont,
		]
			.filter(
				(font, idx, arr) =>
					!font.startsWith("sys") && arr.indexOf(font) === idx
			)
			.map(getFontImport)
			.filter(Boolean)
			.join("\n");

		const typographySettings = `
${imports}
:root {
	--r-main-font: ${mainFont};
	--r-heading-font: ${headingFont};
	--r-h1-font: ${h1Font};
	--r-h2-font: ${h2Font};
	--r-h3-font: ${h3Font};
	--r-h4-font: ${h4Font};
	--r-h5-font: ${h5Font};
	--r-h6-font: ${h6Font};
    --r-main-font-size: ${obasMainFontSize}px;
    --r-heading1-size: ${obasH1Size}px;
    --r-heading2-size: ${obasH2Size}px;
    --r-heading3-size: ${obasH3Size}px;
    --r-heading4-size: ${obasH4Size}px;
    --r-heading5-size: ${obasH5Size}px;
    --r-heading6-size: ${obasH6Size}px;
    --r-heading-text-transform: ${obasHeadingTextTransform};
}

/* Apply heading level specific fonts and sizes for Reveal-based slide plugins */
.reveal h1 { 
	font-family: var(--r-h1-font); 
	text-transform: var(--r-heading-text-transform);
}
.reveal h2 { 
	font-family: var(--r-h2-font); 
	text-transform: var(--r-heading-text-transform);
}
.reveal h3 { 
	font-family: var(--r-h3-font); 
	text-transform: var(--r-heading-text-transform);
}
.reveal h4 { 
	font-family: var(--r-h4-font); 
	text-transform: var(--r-heading-text-transform);
}
.reveal h5 { 
	font-family: var(--r-h5-font); 
	text-transform: var(--r-heading-text-transform);
}
.reveal h6 { 
	font-family: var(--r-h6-font); 
	text-transform: var(--r-heading-text-transform);
}
`;

		await this.app.vault.adapter.write(
			this.obasTypographyFilePath,
			typographySettings
		);
	}
}
