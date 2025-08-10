import { App } from "obsidian";
import { OBASAssistantSettings } from "../types";
import {
	SLIDES_EXTENDED_PLUGIN_FOLDER,
	ADVANCED_SLIDES_PLUGIN_FOLDER,
} from "../constants";

export class TypographyService {
	private obasTypographyFilePath: string;
	constructor(private app: App, private settings: OBASAssistantSettings) {
		if (this.settings.presentationPlugin === "slidesExtended") {
			this.obasTypographyFilePath = `${this.app.vault.configDir}/${SLIDES_EXTENDED_PLUGIN_FOLDER}/dist/Styles/my-typography.css`;
		} else {
			this.obasTypographyFilePath = `${this.app.vault.configDir}/${ADVANCED_SLIDES_PLUGIN_FOLDER}/dist/Styles/my-typography.css`;
		}
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
