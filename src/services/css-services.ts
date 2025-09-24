import { App } from "obsidian";
import { SlidesRupSettings, UserDesignCss } from "../types";
import {
	SLIDES_EXTENDED_PLUGIN_FOLDER,
	ADVANCED_SLIDES_PLUGIN_FOLDER,
	MARP_THEMES_FOLDER,
} from "../constants";

interface StyleSection {
	hsl: string;
	headingTransform: string;
	color: string;
	fontFamily: string;
	fontSize: string;
	userCss: string;
	userStyle: string;
	userMarpCss: string;
}

export class SlidesRupStyleService {
	private slidesRupMainStyleFilePath: string;
	private slidesRupMarpUserSettingFilePath: string;
	private styleSections: StyleSection = {
		hsl: "",
		headingTransform: "",
		color: "",
		fontFamily: "",
		fontSize: "",
		userCss: "",
		userStyle: "",
		userMarpCss: "",
	};

	constructor(private app: App, private settings: SlidesRupSettings) {
		const pluginFolder =
			this.settings.presentationPlugin === "slidesExtended"
				? SLIDES_EXTENDED_PLUGIN_FOLDER
				: ADVANCED_SLIDES_PLUGIN_FOLDER;
		const basePath = `${this.app.vault.configDir}/${pluginFolder}/dist/Styles`;
		const marpThemesPath = `${this.settings.slidesRupFrameworkFolder}/${MARP_THEMES_FOLDER}`;

		this.slidesRupMainStyleFilePath = `${basePath}/my-slides-rup-user-style.css`;
		this.slidesRupMarpUserSettingFilePath = `${marpThemesPath}/my-sr-settings.css`;
	}

	async updateUserDesignCssSettings() {
		const userDesignCssFiles = await this.getUserDesignCssFiles();
		const userDesignCss: UserDesignCss[] = userDesignCssFiles.map(
			(file) => {
				return {
					name: file.split("/").last() as string,
					filePath: file,
					enabled: false,
				};
			}
		);

		// 创建当前文件路径的集合
		const currentFilePaths = new Set(userDesignCssFiles);

		// 过滤出不在当前设置中的新CSS文件
		const existingPaths = new Set(
			this.settings.slidesRupUserDesignsCss?.map(
				(item) => item.filePath
			) || []
		);

		const newUserDesignCss = userDesignCss.filter(
			(item) => !existingPaths.has(item.filePath)
		);

		// 移除已经被删除的CSS文件，保留新添加的文件
		this.settings.slidesRupUserDesignsCss =
			this.settings.slidesRupUserDesignsCss.filter((item) =>
				currentFilePaths.has(item.filePath)
			);

		// 添加新的CSS文件
		this.settings.slidesRupUserDesignsCss.push(...newUserDesignCss);
	}

	/**
	 * 生成用户自定义CSS
	 */
	private async generateUserCss() {
		const userCss = await Promise.all(
			this.settings.slidesRupUserDesignsCss
				.filter((item) => item.enabled)
				.map(async (item) => {
					return `/* ${
						item.name
					} */\n${await this.app.vault.adapter.read(item.filePath)}`;
				})
		);
		return userCss.join("\n\n");
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
    --slides-rup-base-color: hsl(${hue}, ${saturation}%, ${lightness}%);
    --slides-rup-hue: ${hue};
    --slides-rup-saturation: ${saturation}%;
    --slides-rup-lightness: ${lightness}%;
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
		slidesRupH1Color: string;
		slidesRupH2Color: string;
		slidesRupH3Color: string;
		slidesRupH4Color: string;
		slidesRupH5Color: string;
		slidesRupH6Color: string;
		slidesRupBodyColor: string;
		slidesRupParagraphColor: string;
		slidesRupListColor: string;
		slidesRupStrongColor: string;
		slidesRupEmColor: string;
		slidesRupLinkColor: string;
	}): string {
		const {
			slidesRupH1Color,
			slidesRupH2Color,
			slidesRupH3Color,
			slidesRupH4Color,
			slidesRupH5Color,
			slidesRupH6Color,
			slidesRupBodyColor,
			slidesRupParagraphColor,
			slidesRupListColor,
			slidesRupStrongColor,
			slidesRupEmColor,
			slidesRupLinkColor,
		} = colors;

		return `:root {
    /* 颜色变量 */
    --r-h1-color: ${slidesRupH1Color};
    --r-h2-color: ${slidesRupH2Color};
    --r-h3-color: ${slidesRupH3Color};
    --r-h4-color: ${slidesRupH4Color};
    --r-h5-color: ${slidesRupH5Color};
    --r-h6-color: ${slidesRupH6Color};
    --r-body-color: ${slidesRupBodyColor};
    --r-paragraph-color: ${slidesRupParagraphColor};
    --r-list-color: ${slidesRupListColor};
    --r-strong-color: ${slidesRupStrongColor};
    --r-em-color: ${slidesRupEmColor};
    --r-link-color: ${slidesRupLinkColor};
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
		slidesRupHeadingFont: string;
		slidesRupMainFont: string;
		slidesRupH1Font?: string;
		slidesRupH2Font?: string;
		slidesRupH3Font?: string;
		slidesRupH4Font?: string;
		slidesRupH5Font?: string;
		slidesRupH6Font?: string;
	}): string {
		const {
			slidesRupHeadingFont,
			slidesRupMainFont,
			slidesRupH1Font,
			slidesRupH2Font,
			slidesRupH3Font,
			slidesRupH4Font,
			slidesRupH5Font,
			slidesRupH6Font,
		} = fonts;

		const headingFont = this.getFontFamily(slidesRupHeadingFont);
		const mainFont = this.getFontFamily(slidesRupMainFont);
		const h1Font = this.getFontFamily(
			this.getHeadingFontOption(slidesRupH1Font, slidesRupHeadingFont)
		);
		const h2Font = this.getFontFamily(
			this.getHeadingFontOption(slidesRupH2Font, slidesRupHeadingFont)
		);
		const h3Font = this.getFontFamily(
			this.getHeadingFontOption(slidesRupH3Font, slidesRupHeadingFont)
		);
		const h4Font = this.getFontFamily(
			this.getHeadingFontOption(slidesRupH4Font, slidesRupHeadingFont)
		);
		const h5Font = this.getFontFamily(
			this.getHeadingFontOption(slidesRupH5Font, slidesRupHeadingFont)
		);
		const h6Font = this.getFontFamily(
			this.getHeadingFontOption(slidesRupH6Font, slidesRupHeadingFont)
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
			? this.settings.slidesRupMainFont
			: headingfont;
	}

	/**
	 * 生成字体大小样式部分
	 */
	private generateFontSizeSection(sizes: {
		slidesRupMainFontSize: number;
		slidesRupH1Size: number;
		slidesRupH2Size: number;
		slidesRupH3Size: number;
		slidesRupH4Size: number;
		slidesRupH5Size: number;
		slidesRupH6Size: number;
	}): string {
		const {
			slidesRupMainFontSize,
			slidesRupH1Size,
			slidesRupH2Size,
			slidesRupH3Size,
			slidesRupH4Size,
			slidesRupH5Size,
			slidesRupH6Size,
		} = sizes;

		return `:root {
    /* 字体大小变量 */
    --r-main-font-size: ${slidesRupMainFontSize}px;
    --r-heading1-size: ${slidesRupH1Size}px;
    --r-heading2-size: ${slidesRupH2Size}px;
    --r-heading3-size: ${slidesRupH3Size}px;
    --r-heading4-size: ${slidesRupH4Size}px;
    --r-heading5-size: ${slidesRupH5Size}px;
    --r-heading6-size: ${slidesRupH6Size}px;
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
			.filter((font) => font !== "inherit")
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
			this.slidesRupMainStyleFilePath,
			allStyles
		);
	}

	private async writeMarpUserSettingFile() {
		const allMarpCss = this.generateMarpUserStyleFromSections();
		await this.app.vault.adapter.write(
			this.slidesRupMarpUserSettingFilePath,
			allMarpCss
		);
	}

	private generateMarpUserStyleFromSections(): string {
		const fontImports = this.getFontImports();
		return `
${fontImports}

${this.styleSections.hsl}

${
	this.styleSections.userMarpCss
		? `/* Customize CSS */\n${this.styleSections.userMarpCss}`
		: ""
}
`;
	}

	private getFontImports(): string {
		return this.generateFontImports([
			this.settings.slidesRupHeadingFont,
			this.settings.slidesRupMainFont,
			this.settings.slidesRupH1Font || this.settings.slidesRupHeadingFont,
			this.settings.slidesRupH2Font || this.settings.slidesRupHeadingFont,
			this.settings.slidesRupH3Font || this.settings.slidesRupHeadingFont,
			this.settings.slidesRupH4Font || this.settings.slidesRupHeadingFont,
			this.settings.slidesRupH5Font || this.settings.slidesRupHeadingFont,
			this.settings.slidesRupH6Font || this.settings.slidesRupHeadingFont,
		]);
	}

	/**
	 * 从样式部分生成样式表，不重新从设置生成
	 */
	private generateStyleSheetFromSections(): string {
		// 生成字体导入语句（需要从当前设置获取字体信息）
		const fontImports = this.getFontImports();

		return `
${fontImports}

${this.styleSections.hsl}

${this.styleSections.headingTransform}

${this.styleSections.color}

${this.styleSections.fontFamily}

${this.styleSections.fontSize}

${
	this.styleSections.userCss
		? `/* Design CSS */\n${this.styleSections.userCss}`
		: ""
}

${
	this.styleSections.userStyle
		? `/* Customize CSS */\n${this.styleSections.userStyle}`
		: ""
}
`;
	}

	async clearStyleSection(section: keyof StyleSection | "all") {
		if (section === "all") {
			return this.clearAllStyles();
		}
		await this.updateStyleSection(section, "");
	}

	async modifyStyleSection(section: keyof StyleSection) {
		switch (section) {
			case "hsl":
				const { slidesRupThemeColor } = this.settings;
				const hsl = this.colorToHsl(slidesRupThemeColor);
				this.styleSections.hsl = this.generateHslSection(
					hsl.h,
					hsl.s,
					hsl.l
				);
				break;
			case "headingTransform":
				this.styleSections.headingTransform =
					this.generateHeadingTransformSection(
						this.settings.slidesRupHeadingTextTransform
					);
				break;
			case "color":
				const colors = {
					slidesRupH1Color: this.settings.slidesRupH1Color,
					slidesRupH2Color: this.settings.slidesRupH2Color,
					slidesRupH3Color: this.settings.slidesRupH3Color,
					slidesRupH4Color: this.settings.slidesRupH4Color,
					slidesRupH5Color: this.settings.slidesRupH5Color,
					slidesRupH6Color: this.settings.slidesRupH6Color,
					slidesRupBodyColor: this.settings.slidesRupBodyColor,
					slidesRupParagraphColor:
						this.settings.slidesRupParagraphColor,
					slidesRupListColor: this.settings.slidesRupListColor,
					slidesRupStrongColor: this.settings.slidesRupStrongColor,
					slidesRupEmColor: this.settings.slidesRupEmColor,
					slidesRupLinkColor: this.settings.slidesRupLinkColor,
				};
				this.styleSections.color = this.generateColorSection(colors);
				break;
			case "fontFamily":
				const fonts = {
					slidesRupHeadingFont: this.settings.slidesRupHeadingFont,
					slidesRupMainFont: this.settings.slidesRupMainFont,
					slidesRupH1Font: this.settings.slidesRupH1Font,
					slidesRupH2Font: this.settings.slidesRupH2Font,
					slidesRupH3Font: this.settings.slidesRupH3Font,
					slidesRupH4Font: this.settings.slidesRupH4Font,
					slidesRupH5Font: this.settings.slidesRupH5Font,
					slidesRupH6Font: this.settings.slidesRupH6Font,
				};
				this.styleSections.fontFamily =
					this.generateFontFamilySection(fonts);
				break;
			case "fontSize":
				const sizes = {
					slidesRupMainFontSize: this.settings.slidesRupMainFontSize,
					slidesRupH1Size: this.settings.slidesRupH1Size,
					slidesRupH2Size: this.settings.slidesRupH2Size,
					slidesRupH3Size: this.settings.slidesRupH3Size,
					slidesRupH4Size: this.settings.slidesRupH4Size,
					slidesRupH5Size: this.settings.slidesRupH5Size,
					slidesRupH6Size: this.settings.slidesRupH6Size,
				};
				this.styleSections.fontSize =
					this.generateFontSizeSection(sizes);
				break;
			case "userStyle":
				this.styleSections.userStyle = this.settings.customCss || "";
				break;
			case "userCss":
				this.styleSections.userCss = await this.generateUserCss();
				break;
			case "userMarpCss":
				this.styleSections.userMarpCss =
					this.settings.customMarpCss || "";
				break;
			// 其他样式部分的处理...
		}
		await this.writeStyleFile();
		await this.writeMarpUserSettingFile();
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

	async getUserDesignCssFiles() {
		const slidesRupFrameworkPath = this.settings.slidesRupFrameworkFolder;
		const userDesignsPath = `${slidesRupFrameworkPath}/MyDesigns`;
		let cssFiles: string[] = [];
		// 使用 Obsidian 的 adapter API 递归获取 userDesignsPath 下所有子文件夹的 css 文件
		cssFiles = await this.getAllCssFilesInFolder(userDesignsPath);
		return cssFiles;
	}

	async getAllCssFilesInFolder(folderPath: string): Promise<string[]> {
		let result: string[] = [];
		const adapter = this.app.vault.adapter;
		try {
			const files = await adapter.list(folderPath);
			// 处理文件
			if (files.files && files.files.length > 0) {
				const cssFiles = files.files.filter((file: string) =>
					file.endsWith(".css")
				);
				result.push(
					...cssFiles.map(
						(f) => `${folderPath}/${f.split("/").pop()}`
					)
				);
			}
			// 递归处理子文件夹
			if (files.folders && files.folders.length > 0) {
				for (const subFolder of files.folders) {
					const subFolderPath = `${folderPath}/${subFolder
						.split("/")
						.pop()}`;
					const subFiles = await this.getAllCssFilesInFolder(
						subFolderPath
					);
					result.push(...subFiles);
				}
			}
		} catch (e) {
			// 如果文件夹不存在，直接返回空数组
			return [];
		}
		return result;
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
}
