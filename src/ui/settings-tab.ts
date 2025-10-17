import {
	App,
	debounce,
	PluginSettingTab,
	Setting,
	setIcon,
	TFolder,
} from "obsidian";
import { t } from "../lang/helpers";
import SlidesRup from "../main";
import { isValidApiKey, isValidEmail } from "../utils";
import { ApiService } from "../services/api-services";
import { FolderSuggest } from "./pickers/folder-picker";
import { FileSuggest, FileSuggestMode } from "./pickers/file-picker";
import { SettingConfig } from "src/types";
import { TabbedSettings } from "./tabbed-settings";
import { DEFAULT_SETTINGS } from "../models/default-settings";
import { EditorView, basicSetup, EditorState } from "@codemirror/basic-setup";
import { css } from "@codemirror/lang-css";
import { autocompletion } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import { DEFAULT_DESIGNS, REVEAL_USER_DESIGN_FOLDER } from "../constants";
import { markdown } from "@codemirror/lang-markdown";

type SettingsKeys = keyof SlidesRup["settings"];

export class SlidesRupSettingTab extends PluginSettingTab {
	plugin: SlidesRup;
	private apiService: ApiService;

	constructor(app: App, plugin: SlidesRup) {
		super(app, plugin);
		this.plugin = plugin;
		this.apiService = new ApiService(this.plugin.settings);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", {
			text: t("SlidesRup_Settings_Heading"),
		});

		const tabbedSettings = new TabbedSettings(containerEl);

		const tabConfigs = [
			{
				title: "Main Setting",
				renderMethod: (content: HTMLElement) =>
					this.renderMainSettings(content),
			},
			{
				title: "Slide Settings",
				renderMethod: (content: HTMLElement) =>
					this.renderSlideSettings(content),
			},
			{
				title: "Design and Templates",
				renderMethod: (content: HTMLElement) =>
					this.renderUserSettings(content),
			},
			{
				title: "Color Setting",
				renderMethod: (content: HTMLElement) =>
					this.renderColorSettings(content),
			},
			{
				title: "Font Setting",
				renderMethod: (content: HTMLElement) =>
					this.renderFontSettings(content),
			},
			{
				title: "Advanced Settings",
				renderMethod: (content: HTMLElement) =>
					this.renderAdvancedSettings(content),
			},
		];

		// 使用循环创建标签页
		tabConfigs.forEach((config) => {
			tabbedSettings.addTab(t(config.title as any), config.renderMethod);
		});
	}

	private renderMainSettings(containerEl: HTMLElement): void {
		this.createDropdownSetting(
			containerEl,
			"Presentation Plugin",
			"Please select your presentation plugin",
			"presentationPlugin",
			{
				slidesExtended: "Slides Extended",
				advancedSlides: "Advanced Slides",
			}
		);
		this.createValidatedInput({
			containerEl,
			name: t("SlidesRup Update API Key"),
			description: t("Please enter a valid update API Key"),
			placeholder: t("Enter the API Key"),
			reload: false,
			getValue: () => this.plugin.settings.updateAPIKey,
			setValue: (value) => (this.plugin.settings.updateAPIKey = value),
			getIsValid: () => this.plugin.settings.updateAPIKeyIsValid,
			setIsValid: (isValid) =>
				(this.plugin.settings.updateAPIKeyIsValid = isValid),
			localValidator: isValidApiKey,
			remoteValidator: () => this.apiService.checkApiKey(),
		});

		this.createValidatedInput({
			containerEl,
			name: t("Your Email Address"),
			description: t(
				"Please enter the email you provided when you purchase this product"
			),
			placeholder: t("Enter your email"),
			reload: true,
			getValue: () => this.plugin.settings.userEmail,
			setValue: (value) => (this.plugin.settings.userEmail = value),
			getIsValid: () => this.plugin.settings.userChecked,
			setIsValid: (isValid) =>
				(this.plugin.settings.userChecked = isValid),
			localValidator: isValidEmail,
			remoteValidator: () => this.apiService.getUpdateIDs(),
		});

		this.createDropdownSetting(
			containerEl,
			"SlidesRup Running Language",
			"Please select your slidesRup framework running language",
			"slidesRupRunningLanguage",
			{
				ob: "Auto (Follow System Language)",
				"zh-cn": "Chinese",
				"zh-tw": "Chinses Traditional",
				en: "English",
			}
		);

		this.createFolderSetting(
			containerEl,
			"SlidesRup Framework Folder",
			"Please enter the path to the SlidesRup Framework Folder",
			"Enter the full path to the SlidesRup Framework folder",
			"slidesRupFrameworkFolder"
		);

		const toggleDefaultLocation = (value: string) => {
			defaultLocationSetting.settingEl.style.display =
				value === "assigned" ? "" : "none";
		};

		this.createDropdownSetting(
			containerEl,
			"New Slide Location Option",
			"Please select the default new slide location option",
			"newSlideLocationOption",
			{
				current: "Current Folder",
				decideByUser: "Decide At Creation",
				assigned: "User Assigned Folder",
			},
			toggleDefaultLocation
		);

		const defaultLocationSetting = this.createFolderSetting(
			containerEl,
			"Default New Slide Location",
			"Please enter the path to the default new slide location",
			"Enter the full path to the default new slide location",
			"assignedNewSlideLocation"
		);

		toggleDefaultLocation(this.plugin.settings.newSlideLocationOption);

		this.createToggleSetting(containerEl, {
			name: "Customize Slide Folder Name",
			desc: "Use Customize Slide Folder Name",
			value: this.plugin.settings.customizeSlideFolderName,
			onChange: async (value) => {
				this.plugin.settings.customizeSlideFolderName = value;
				await this.plugin.saveSettings();
			},
		});

		this.createToggleSetting(containerEl, {
			name: "Add Sub Pages When Add Chapter",
			desc: "Add Sub Pages When Add Chapter",
			value: this.plugin.settings.addChapterWithSubPages,
			onChange: async (value) => {
				this.plugin.settings.addChapterWithSubPages = value;
				await this.plugin.saveSettings();
			},
		});
	}

	private renderUserSettings(containerEl: HTMLElement): void {
		containerEl.createEl("h2", {
			text: t("Slide Design"),
			cls: "slides-rup-title",
		});

		this.createDropdownSetting(
			containerEl,
			"Default Design",
			"Please select your default design",
			"defaultDesign",
			this.getDefaultDesignOptions()
		);

		this.createDropdownSetting(
			containerEl,
			"User Designs",
			"Please select your user design",
			"slidesRupUserDesigns",
			this.getUserDesignOptions(),
			undefined,
			false
		);

		if (
			this.plugin.settings.slidesRupUserDesignsCss &&
			Array.isArray(this.plugin.settings.slidesRupUserDesignsCss) &&
			this.plugin.settings.slidesRupUserDesignsCss.length > 0
		) {
			containerEl.createEl("h3", {
				text: t("User Designs CSS"),
				cls: "slides-rup-title",
			});
			this.plugin.settings.slidesRupUserDesignsCss.forEach(
				(item, index) => {
					const name = item.name || `Design CSS ${index + 1}`;
					const path = item.filePath || "";
					new Setting(containerEl)
						.setName(name)
						.setDesc(`${t("Enable CSS:")} ${path}`)
						.addToggle((toggle) => {
							toggle
								.setValue(item.enabled)
								.onChange(async (value) => {
									// 更新对应item的enable值
									this.plugin.settings.slidesRupUserDesignsCss[
										index
									].enabled = value;
									await this.plugin.saveSettings();

									await this.plugin.services.slidesRupStyleService.modifyStyleSection(
										"userCss"
									);
								});
						});
				}
			);
		}

		containerEl.createEl("h2", {
			text: t("User Templates"),
			cls: "slides-rup-title",
		});

		this.createToggleSetting(containerEl, {
			name: "Enable User Templates",
			desc: "Enable User Templates",
			value: this.plugin.settings.enableUserTemplates,
			onChange: async (value) => {
				this.plugin.settings.enableUserTemplates = value;
				await this.plugin.saveSettings();
			},
		});

		this.createFolderSetting(
			containerEl,
			"User Templates Folder",
			"Please enter the path to your own templates",
			"Choose your templates folder",
			"templatesFolder"
		);

		this.createFileSetting(
			containerEl,
			"User Slide Template",
			"Please choose your personal slide template",
			"Choose your personal slide template",
			"userSlideTemplate"
		);

		this.createFileSetting(
			containerEl,
			"User Base Layout Template",
			"Please choose your personal base layout template",
			"Choose your personal base layout template",
			"userBaseLayoutTemplate"
		);

		this.createFileSetting(
			containerEl,
			"User TOC Template",
			"Please choose your personal TOC template",
			"Choose your personal TOC template",
			"userTocTemplate"
		);

		this.createFileSetting(
			containerEl,
			"User Chapter Template",
			"Please choose your personal chapter template",
			"Choose your personal chapter template",
			"userChapterTemplate"
		);

		this.createFileSetting(
			containerEl,
			"User Chapter With Sub Pages Template",
			"Please choose your personal chapter with sub pages template",
			"Choose your personal chapter with sub pages template",
			"userChapterAndPagesTemplate"
		);

		this.createFileSetting(
			containerEl,
			"User Page Template",
			"Please choose your personal page template",
			"Choose your personal page template",
			"userPageTemplate"
		);
	}

	private renderColorSettings(containerEl: HTMLElement): void {
		containerEl.createEl("h2", {
			text: t("Theme Colors"),
			cls: "slides-rup-title",
		});

		const onThemeColorChanges = debounce(
			async () => {
				await this.plugin.saveSettings();
				await this.plugin.services.slidesRupStyleService.modifyStyleSection(
					"hsl"
				);
			},
			200,
			true
		);

		const onColorChange = debounce(
			async () => {
				await this.plugin.saveSettings();
				await this.plugin.services.slidesRupStyleService.modifyStyleSection(
					"color"
				);
			},
			200,
			true
		);

		this.createColorSetting(
			containerEl,
			"Theme Color",
			"Set the theme color",
			"slidesRupThemeColor",
			onThemeColorChanges
		);

		this.createDropdownSetting(
			containerEl,
			"Slide Mode",
			"Set the slide mode",
			"slidesRupSlideMode",
			{
				none: "Decide At Creation",
				light: "Light Mode",
				dark: "Dark Mode",
			}
		);

		// 标题颜色设置
		containerEl.createEl("h2", {
			text: t("Customize Text Colors"),
			cls: "slides-rup-title",
		});

		this.createToggleSetting(containerEl, {
			name: "Use User Color Setting",
			desc: "Enable User Color Setting",
			value: this.plugin.settings.enableSlidesRupColorUserSetting,
			onChange: async (value) => {
				this.plugin.settings.enableSlidesRupColorUserSetting = value;
				await this.plugin.saveSettings();
				if (value) {
					await this.plugin.services.slidesRupStyleService.modifyStyleSection(
						"color"
					);
				} else {
					await this.plugin.services.slidesRupStyleService.clearStyleSection(
						"color"
					);
					await this.plugin.services.slidesRupStyleService.clearStyleSection(
						"colorMarp"
					);
				}
			},
		});

		containerEl.createEl("h3", {
			text: t("Heading Colors"),
			cls: "slides-rup-title",
		});

		this.createColorSetting(
			containerEl,
			"H1 Color",
			"Set the color for H1 headings",
			"slidesRupH1Color",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"H2 Color",
			"Set the color for H2 headings",
			"slidesRupH2Color",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"H3 Color",
			"Set the color for H3 headings",
			"slidesRupH3Color",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"H4 Color",
			"Set the color for H4 headings",
			"slidesRupH4Color",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"H5 Color",
			"Set the color for H5 headings",
			"slidesRupH5Color",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"H6 Color",
			"Set the color for H6 headings",
			"slidesRupH6Color",
			onColorChange
		);

		// 正文颜色设置
		containerEl.createEl("h3", {
			text: t("Body Colors"),
			cls: "slides-rup-title",
		});

		this.createColorSetting(
			containerEl,
			"Body Color",
			"Set the color for body text",
			"slidesRupBodyColor",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"Paragraph Color",
			"Set the color for paragraphs",
			"slidesRupParagraphColor",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"List Color",
			"Set the color for lists",
			"slidesRupListColor",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"Strong Color",
			"Set the color for strong/bold text",
			"slidesRupStrongColor",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"Emphasis Color",
			"Set the color for emphasis/italic text",
			"slidesRupEmColor",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"Link Color",
			"Set the color for links",
			"slidesRupLinkColor",
			onColorChange
		);
	}

	private renderFontSettings(containerEl: HTMLElement): void {
		const onFontFamilyChange = debounce(
			async () => {
				await this.plugin.saveSettings();
				await this.plugin.services.slidesRupStyleService.modifyStyleSection(
					"fontFamily"
				);
			},
			200,
			true
		);

		const onFontSizeChange = debounce(
			async () => {
				await this.plugin.saveSettings();
				await this.plugin.services.slidesRupStyleService.modifyStyleSection(
					"fontSize"
				);
			},
			200,
			true
		);

		const onHeadingTextTransformChange = debounce(
			async () => {
				await this.plugin.saveSettings();
				await this.plugin.services.slidesRupStyleService.modifyStyleSection(
					"headingTransform"
				);
			},
			200,
			true
		);
		// Obsidian 的 Setting API（即 addDropdown）本身并不支持原生的分组（optgroup）功能。
		// 如果需要分组效果，需要自定义实现，或者直接操作 DOM。
		// 下面是一个简单的实现方式，直接操作 dropdown 的 select 元素，插入 optgroup。

		const fontOptionsGrouped: Array<{
			label: string;
			options: Record<string, string>;
		}> = [
			{
				label: "系统字体",
				options: {
					inherit: "无指定",
					sysKaiti: "楷体",
					sysHeiti: "黑体",
					sysSongTi: "宋体",
					sysFangSongTi: "仿宋",
				},
			},
			{
				label: "黑体",
				options: {
					opsa: t("opsa"),
					dyzgt: t("dyzgt"),
					hzpyt: t("hzpyt"),
					xwmh: t("xwmh"),
				},
			},
			{
				label: "宋体",
				options: {
					opsa: t("systcn"),
					xwxzs: t("xwxzs"),
					pxzs: t("pxzs"),
					nswt: t("nswt"),
					mspyt: t("mspyt"),
				},
			},
			{
				label: "楷体",
				options: {
					xwwk: t("xwwk"),
					jxzk: t("jxzk"),
				},
			},
			{
				label: "硬笔手写体",
				options: {
					qssxt: t("qssxt"),
					prsxt: t("prsxt"),
				},
			},
			{
				label: "毛笔手写体",
				options: {
					qtbfsxt: t("qtbfsxt"),
					pmzdzgkt: t("pmzdzgkt"),
					pmzdcsd: t("pmzdcsd"),
				},
			},
			{
				label: "英文字体",
				options: {
					sysEnglishSans: "Arial",
					sysEnglishSerif: "Times New Roman",
					sysEnglishMono: "Courier New",
					sysRoboto: "Roboto",
					sysOpenSans: "Open Sans",
					sysLato: "Lato",
					sysMontserrat: "Montserrat",
					sysSourceSansPro: "Source Sans Pro",
				},
			},
		];

		containerEl.createEl("h2", {
			text: t("Font Family"),
			cls: "slides-rup-title",
		});

		this.createToggleSetting(containerEl, {
			name: "Use User Font Family Setting",
			desc: "Enable User Font Family Setting",
			value: this.plugin.settings.enableSlidesRupFontFamilyUserSetting,
			onChange: async (value) => {
				this.plugin.settings.enableSlidesRupFontFamilyUserSetting =
					value;
				await this.plugin.saveSettings();
				if (value) {
					await this.plugin.services.slidesRupStyleService.modifyStyleSection(
						"fontFamily"
					);
				} else {
					await this.plugin.services.slidesRupStyleService.clearStyleSection(
						"fontFamily"
					);
				}
			},
		});

		this.createGroupedDropdownSetting(
			containerEl,
			"Main Font",
			"Set Main Font",
			"slidesRupMainFont",
			fontOptionsGrouped,
			onFontFamilyChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"Heading Font",
			"Set Heading Font",
			"slidesRupHeadingFont",
			fontOptionsGrouped,
			onFontFamilyChange
		);

		// 各级标题字体（H1-H6）
		this.createGroupedDropdownSetting(
			containerEl,
			"H1 Font",
			"Set H1 Font",
			"slidesRupH1Font",
			fontOptionsGrouped,
			onFontFamilyChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"H2 Font",
			"Set H2 Font",
			"slidesRupH2Font",
			fontOptionsGrouped,
			onFontFamilyChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"H3 Font",
			"Set H3 Font",
			"slidesRupH3Font",
			fontOptionsGrouped,
			onFontFamilyChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"H4 Font",
			"Set H4 Font",
			"slidesRupH4Font",
			fontOptionsGrouped,
			onFontFamilyChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"H5 Font",
			"Set H5 Font",
			"slidesRupH5Font",
			fontOptionsGrouped,
			onFontFamilyChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"H6 Font",
			"Set H6 Font",
			"slidesRupH6Font",
			fontOptionsGrouped,
			onFontFamilyChange
		);

		containerEl.createEl("h2", {
			text: t("Font Size"),
			cls: "slides-rup-title",
		});

		this.createToggleSetting(containerEl, {
			name: "Use User Font Size Setting",
			desc: "Enable User Font Size Setting",
			value: this.plugin.settings.enableSlidesRupFontSizeUserSetting,
			onChange: async (value) => {
				this.plugin.settings.enableSlidesRupFontSizeUserSetting = value;
				await this.plugin.saveSettings();
				if (value) {
					await this.plugin.services.slidesRupStyleService.modifyStyleSection(
						"fontSize"
					);
				} else {
					await this.plugin.services.slidesRupStyleService.clearStyleSection(
						"fontSize"
					);
				}
			},
		});

		this.createSizeSliderSetting(
			containerEl,
			"Body Size",
			"Adjust the font size of body",
			"slidesRupMainFontSize",
			12,
			72,
			onFontSizeChange
		);

		// 各级标题字号设置（H1-H6）
		this.createSizeSliderSetting(
			containerEl,
			"H1 Size",
			"Adjust the font size of H1",
			"slidesRupH1Size",
			12,
			180,
			onFontSizeChange
		);

		this.createSizeSliderSetting(
			containerEl,
			"H2 Size",
			"Adjust the font size of H2",
			"slidesRupH2Size",
			12,
			144,
			onFontSizeChange
		);

		this.createSizeSliderSetting(
			containerEl,
			"H3 Size",
			"Adjust the font size of H3",
			"slidesRupH3Size",
			12,
			108,
			onFontSizeChange
		);

		this.createSizeSliderSetting(
			containerEl,
			"H4 Size",
			"Adjust the font size of H4",
			"slidesRupH4Size",
			12,
			72,
			onFontSizeChange
		);

		this.createSizeSliderSetting(
			containerEl,
			"H5 Size",
			"Adjust the font size of H5",
			"slidesRupH5Size",
			12,
			54,
			onFontSizeChange
		);

		this.createSizeSliderSetting(
			containerEl,
			"H6 Size",
			"Adjust the font size of H6",
			"slidesRupH6Size",
			12,
			36,
			onFontSizeChange
		);

		// 标题文字变换设置
		containerEl.createEl("h2", {
			text: t("Text Transform"),
			cls: "slides-rup-title",
		});

		this.createDropdownSetting(
			containerEl,
			"Heading Text Transform",
			"Set text transform for all headings",
			"slidesRupHeadingTextTransform",
			{
				none: "None",
				capitalize: "Capitalize",
				uppercase: "Uppercase",
				lowercase: "Lowercase",
			},
			onHeadingTextTransformChange
		);
	}

	private renderSlideSettings(containerEl: HTMLElement): void {
		this.createDropdownSetting(
			containerEl,
			"Default Slide Size",
			"Please select your default slide size",
			"slidesRupDefaultSlideSize",
			{
				"p16-9": "Presentation 16:9",
				"p9-16": "Presentation 9:16",
				a4v: "A4 Vertical",
				a4h: "A4 Horizontal",
			}
		);

		this.createTextSetting(containerEl, {
			name: "Tagline",
			desc: "Set Tagline",
			placeholder: "Your Tagline",
			value: this.plugin.settings.tagline,
			onChange: async (value) => {
				this.plugin.settings.tagline = value;
				await this.plugin.saveSettings();
			},
		});

		this.createTextSetting(containerEl, {
			name: "Slogan",
			desc: "Set Slogan",
			placeholder: "Your Slogan",
			value: this.plugin.settings.slogan,
			onChange: async (value) => {
				this.plugin.settings.slogan = value;
				await this.plugin.saveSettings();
			},
		});

		this.createTextSetting(containerEl, {
			name: "Presenter",
			desc: "Set Presenter",
			placeholder: "Presenter",
			value: this.plugin.settings.presenter,
			onChange: async (value) => {
				this.plugin.settings.presenter = value;
				await this.plugin.saveSettings();
			},
		});

		this.createTextSetting(containerEl, {
			name: "Date Format",
			desc: "Set Date Format",
			placeholder: "Your Date Format",
			value: this.plugin.settings.dateFormat,
			onChange: async (value) => {
				this.plugin.settings.dateFormat = value;
				await this.plugin.saveSettings();
			},
		});

		this.createToggleSetting(containerEl, {
			name: "Turn on Base Layout Nav",
			desc: "Turn on to use base layout with nav",
			value: this.plugin.settings.slidesRupTrunOnBaseLayoutNav,
			onChange: async (value) => {
				this.plugin.settings.slidesRupTrunOnBaseLayoutNav = value;
				await this.plugin.saveSettings();
			},
		});

		this.createToggleSetting(containerEl, {
			name: "Separate Nav and TOC",
			desc: "Turn on to separate nav and TOC",
			value: this.plugin.settings.slidesRupSeparateNavAndToc,
			onChange: async (value) => {
				this.plugin.settings.slidesRupSeparateNavAndToc = value;
				await this.plugin.saveSettings();
			},
		});

		this.createDropdownSetting(
			containerEl,
			"Content Page Slide Type",
			"Please select the default slide type for content pages",
			"slidesRupContentPageSlideType",
			{
				h: "Horizontal",
				v: "Vertical",
			}
		);

		this.createDropdownSetting(
			containerEl,
			"Slide Navigation Mode",
			"Please select the default slide navigation mode",
			"slidesRupSlideNavigationMode",
			{
				default: "Default",
				linear: "Linear",
				grid: "Grid",
			}
		);

		this.createTextSetting(containerEl, {
			name: "Default TOC Page Position",
			desc: "Set Default TOC Page Position",
			value: this.plugin.settings.slidesRupDefaultTOCPageNumber.toString(),
			onChange: async (value) => {
				this.plugin.settings.slidesRupDefaultTOCPageNumber =
					Number(value);
				await this.plugin.saveSettings();
			},
		});

		this.createToggleSetting(containerEl, {
			name: "Toggle TOC Page Fragments",
			desc: "Turn on to use fragments",
			value: this.plugin.settings.slidesRupTurnOnFragmentsInTOCSlide,
			onChange: async (value) => {
				this.plugin.settings.slidesRupTurnOnFragmentsInTOCSlide = value;
				await this.plugin.saveSettings();
			},
		});

		this.createToggleSetting(containerEl, {
			name: "Toggle Chapter Page Fragments",
			desc: "Turn on to use fragments",
			value: this.plugin.settings.slidesRupTurnOnFragmentsInChapterSlides,
			onChange: async (value) => {
				this.plugin.settings.slidesRupTurnOnFragmentsInChapterSlides =
					value;
				await this.plugin.saveSettings();
			},
		});

		this.createToggleSetting(containerEl, {
			name: "Toggle Chapter and Content Page Heading OBURI",
			desc: "Turn on to enable Heading OBURI for chapter and content pages",
			value: this.plugin.settings.slidesRupEnableHeadingOBURI,
			onChange: async (value) => {
				this.plugin.settings.slidesRupEnableHeadingOBURI = value;
				await this.plugin.saveSettings();
			},
		});

		this.createToggleSetting(containerEl, {
			name: "Auto Convert Links",
			desc: "ACLD",
			value: this.plugin.settings.slidesRupAutoConvertLinks,
			onChange: async (value) => {
				this.plugin.settings.slidesRupAutoConvertLinks = value;
				await this.plugin.saveSettings();
			},
		});

		this.createToggleSetting(containerEl, {
			name: "Enable Paragraph Fragments",
			desc: "EPF",
			value: this.plugin.settings.slidesRupEnableParagraphFragments,
			onChange: async (value) => {
				this.plugin.settings.slidesRupEnableParagraphFragments = value;
				await this.plugin.saveSettings();
			},
		});

		const defaultListClassOptions = {
			"fancy-list": "Fancy List",
			"fancy-list-row": "Fancy List Row",
			"fancy-list-with-order": "Fancy List With Order",
			"fancy-list-with-order-row": "Fancy List With Order Row",
			"grid-list": "Grid List",
			"grid-step-list": "Grid Step List",
			"grid-step-list-v": "Grid Step List Vertical",
			"box-list": "Box List",
			"order-list-with-border": "Order List With Border",
		};

		containerEl.createEl("h3", {
			text: t("Slide Default List"),
			cls: "slides-rup-title",
		});

		this.createDropdownSetting(
			containerEl,
			"Default TOC Page List Class",
			"Please select the default list class for TOC pages",
			"slidesRupDefaultTOCListClass",
			defaultListClassOptions
		);

		this.createDropdownSetting(
			containerEl,
			"Default Chapter Page List Class",
			"Please select the default list class for chapter pages",
			"slidesRupDefaultChapterListClass",
			defaultListClassOptions
		);

		this.createDropdownSetting(
			containerEl,
			"Default Content Page List Class",
			"Please select the default list class for content pages",
			"slidesRupDefaultContentListClass",
			defaultListClassOptions
		);

		this.createDropdownSetting(
			containerEl,
			"Default Blank Page List Class",
			"Please select the default list class for blank pages",
			"slidesRupDefaultBlankListClass",
			defaultListClassOptions
		);

		this.createDropdownSetting(
			containerEl,
			"Default BackCover Page List Class",
			"Please select the default list class for backcover page",
			"slidesRupDefaultBackCoverListClass",
			defaultListClassOptions
		);

		this.createTextSetting(containerEl, {
			name: "User TOC Page List Class",
			desc: "Set User TOC Page List Class",
			placeholder: "User TOC Page List Class",
			value: this.plugin.settings.slidesRupUserTOCPageListClass,
			onChange: async (value) => {
				this.plugin.settings.slidesRupUserTOCPageListClass = value;
				await this.plugin.saveSettings();
			},
		});

		this.createTextSetting(containerEl, {
			name: "User Chapter Page List Class",
			desc: "Set User Chapter Page List Class",
			placeholder: "User Chapter Page List Class",
			value: this.plugin.settings.slidesRupUserChapterPageListClass,
			onChange: async (value) => {
				this.plugin.settings.slidesRupUserChapterPageListClass = value;
				await this.plugin.saveSettings();
			},
		});

		this.createTextSetting(containerEl, {
			name: "User Content Page List Class",
			desc: "Set User Content Page List Class",
			placeholder: "User Content Page List Class",
			value: this.plugin.settings.slidesRupUserContentPageListClass,
			onChange: async (value) => {
				this.plugin.settings.slidesRupUserContentPageListClass = value;
				await this.plugin.saveSettings();
			},
		});

		this.createTextSetting(containerEl, {
			name: "User Blank Page List Class",
			desc: "Set User Blank Page List Class",
			placeholder: "User Blank Page List Class",
			value: this.plugin.settings.slidesRupUserBlankPageListClass,
			onChange: async (value) => {
				this.plugin.settings.slidesRupUserBlankPageListClass = value;
				await this.plugin.saveSettings();
			},
		});

		this.createTextSetting(containerEl, {
			name: "User BackCover Page List Class",
			desc: "Set User BackCover Page List Class",
			placeholder: "User BackCover Page List Class",
			value: this.plugin.settings.slidesRupUserBackCoverPageListClass,
			onChange: async (value) => {
				this.plugin.settings.slidesRupUserBackCoverPageListClass =
					value;
				await this.plugin.saveSettings();
			},
		});
	}

	private renderAdvancedSettings(containerEl: HTMLElement): void {
		// 根据用户设计CSS配置创建动态toggle设置

		containerEl.createEl("h2", {
			text: t("Customized CSS"),
			cls: "slides-rup-title",
		});

		this.createToggleSetting(containerEl, {
			name: "Use User Customized CSS",
			desc: "Enable User Customized CSS",
			value: this.plugin.settings.enableCustomCss,
			onChange: async (value) => {
				this.plugin.settings.enableCustomCss = value;
				await this.plugin.saveSettings();
				if (value) {
					await this.plugin.services.slidesRupStyleService.modifyStyleSection(
						"userStyle"
					);
				} else {
					await this.plugin.services.slidesRupStyleService.clearStyleSection(
						"userStyle"
					);
				}
			},
		});

		new Setting(containerEl)
			.setName(t("User Customized CSS"))
			.setDesc(t("Input Your Customized CSS"))
			.setClass("slides-rup-custom-css");

		// 创建一个 div 元素作为 CodeMirror 的容器
		const editorContainer = containerEl.createDiv("slides-rup-css-editor");

		new EditorView({
			state: EditorState.create({
				doc: this.plugin.settings.customCss || "",
				extensions: [
					basicSetup, // 启用基础功能，如行号、括号匹配等
					css(), // 启用CSS语言高亮
					autocompletion(), // 添加自动补全功能
					...(document.body.classList.contains("theme-dark")
						? [oneDark]
						: []), // 仅在暗色模式下加载 oneDark 主题
					EditorView.updateListener.of((update) => {
						// 监听编辑器内容的变化
						if (update.docChanged) {
							const newCss = update.state.doc.toString();
							// 使用 debounce 来防止频繁保存，提升性能
							saveCssSetting(newCss);
						}
					}),
				],
			}),
			parent: editorContainer,
		});

		// 如果你希望根据 Obsidian 当前的主题自动切换，可以进一步判断 document.body 的 class（比如 "theme-dark"），
		// 并动态切换 oneDark 或默认主题。

		// 保存设置的方法（防抖处理）
		const saveCssSetting = debounce(
			(newCss: string) => {
				this.plugin.settings.customCss = newCss;
				this.plugin.saveSettings();
				this.plugin.services.slidesRupStyleService.modifyStyleSection(
					"userStyle"
				);
			},
			500,
			true
		);

		new Setting(containerEl)
			.setName(t("User Customized Marp CSS"))
			.setDesc(t("Input Your Customized Marp CSS"))
			.setClass("slides-rup-custom-css");

		// 创建一个 div 元素作为 CodeMirror 的容器
		const editorContainerForMarpCss = containerEl.createDiv(
			"slides-rup-css-editor"
		);

		new EditorView({
			state: EditorState.create({
				doc: this.plugin.settings.customMarpCss || "",
				extensions: [
					basicSetup, // 启用基础功能，如行号、括号匹配等
					css(), // 启用CSS语言高亮
					autocompletion(), // 添加自动补全功能
					...(document.body.classList.contains("theme-dark")
						? [oneDark]
						: []), // 仅在暗色模式下加载 oneDark 主题
					EditorView.updateListener.of((update) => {
						// 监听编辑器内容的变化
						if (update.docChanged) {
							const newCss = update.state.doc.toString();
							// 使用 debounce 来防止频繁保存，提升性能
							saveMarpCssSetting(newCss);
						}
					}),
				],
			}),
			parent: editorContainerForMarpCss,
		});

		// 如果你希望根据 Obsidian 当前的主题自动切换，可以进一步判断 document.body 的 class（比如 "theme-dark"），
		// 并动态切换 oneDark 或默认主题。

		// 保存设置的方法（防抖处理）
		const saveMarpCssSetting = debounce(
			(newCss: string) => {
				this.plugin.settings.customMarpCss = newCss;
				this.plugin.saveSettings();
				this.plugin.services.slidesRupStyleService.modifyStyleSection(
					"userStyleMarp"
				);
			},
			500,
			true
		);

		this.createTextAreaSetting(containerEl, {
			name: "List Class Name Added by User",
			desc: "One Class name each line",
			value: this.plugin.settings.userAddedListClasses,
			onChange: async (value) => {
				this.plugin.settings.userAddedListClasses = value;
				await this.plugin.saveSettings();
			},
		});

		this.createTextAreaSetting(containerEl, {
			name: "Columns Class Name Added by User",
			desc: "One Class name each line",
			value: this.plugin.settings.userAddedColumnClasses,
			onChange: async (value) => {
				this.plugin.settings.userAddedColumnClasses = value;
				await this.plugin.saveSettings();
			},
		});

		containerEl.createEl("h2", {
			text: t("User Specific Frontmatter Options"),
			cls: "slides-rup-title",
		});

		new Setting(containerEl)
			.setName(t("Frontmatter Options"))
			.setDesc(t("Input Your Frontmatter Options"))
			.setClass("slides-rup-custom-fm");
		// 添加 Advanced Slides YAML 参考链接

		const yamlEditorContainer = containerEl.createDiv(
			"slides-rup-yaml-editor"
		);
		new EditorView({
			state: EditorState.create({
				doc:
					this.plugin.settings
						.slidesRupUserSpecificFrontmatterOptions || "",
				extensions: [
					basicSetup, // 启用基础功能，如行号、括号匹配等
					markdown(), // 启用Frontmatter语言高亮 // 启用Frontmatter语言高亮
					autocompletion(), // 添加自动补全功能
					...(document.body.classList.contains("theme-dark")
						? [oneDark]
						: []), // 仅在暗色模式下加载 oneDark 主题
					EditorView.updateListener.of((update) => {
						// 监听编辑器内容的变化
						if (update.docChanged) {
							const newFrontmatter = update.state.doc.toString();
							// 使用 debounce 来防止频繁保存，提升性能
							saveFrontmatterSetting(newFrontmatter);
						}
					}),
				],
			}),
			parent: yamlEditorContainer,
		});
		// 保存设置的方法（防抖处理）
		const saveFrontmatterSetting = debounce(
			(newFrontmatter: string) => {
				this.plugin.settings.slidesRupUserSpecificFrontmatterOptions =
					newFrontmatter;
				this.plugin.saveSettings();
			},
			500,
			true
		);

		containerEl.createEl("a", {
			text: t("Advanced Slides YAML Reference"),
			href: "https://mszturc.github.io/obsidian-advanced-slides/yaml/",
			cls: "slides-rup-link",
		});
	}

	// 通用方法：创建切换设置项
	private createToggleSetting(
		content: HTMLElement,
		config: SettingConfig
	): void {
		new Setting(content)
			.setName(t(config.name as any))
			.setDesc(t(config.desc as any))
			.addToggle((toggle) => {
				toggle.setValue(config.value).onChange(config.onChange);
			});
	}

	private createTextSetting(
		content: HTMLElement,
		config: SettingConfig
	): void {
		new Setting(content)
			.setName(t(config.name as any))
			.setDesc(t(config.desc as any))
			.addText((text) => {
				text.setValue(config.value).onChange(config.onChange);
			});
	}

	private createTextAreaSetting(
		content: HTMLElement,
		config: SettingConfig
	): void {
		new Setting(content)
			.setName(t(config.name as any))
			.setDesc(t(config.desc as any))
			.addTextArea((text) => {
				text.setValue(config.value).onChange(config.onChange);
			});
	}

	private createBaseSetting(
		containerEl: HTMLElement,
		nameKey: string,
		descKey: string
	): Setting {
		return new Setting(containerEl)
			.setName(t(nameKey as any))
			.setDesc(t(descKey as any));
	}

	private createFolderSetting(
		containerEl: HTMLElement,
		nameKey: string,
		descKey: string,
		placeholderKey: string,
		settingKey: SettingsKeys
	): Setting {
		return this.createBaseSetting(containerEl, nameKey, descKey).addSearch(
			(text) => {
				new FolderSuggest(this.app, text.inputEl);
				text.setPlaceholder(t(placeholderKey as any))
					.setValue(this.plugin.settings[settingKey] as string)
					.onChange(async (value) => {
						(this.plugin.settings[settingKey] as any) = value;
						await this.plugin.saveSettings();
					});
			}
		);
	}

	private createFileSetting(
		containerEl: HTMLElement,
		nameKey: string,
		descKey: string,
		placeholderKey: string,
		settingKey: SettingsKeys
	) {
		this.createBaseSetting(containerEl, nameKey, descKey).addSearch(
			(text) => {
				new FileSuggest(
					text.inputEl,
					this.plugin,
					FileSuggestMode.TemplateFiles
				);
				text.setPlaceholder(t(placeholderKey as any))
					.setValue(this.plugin.settings[settingKey] as string)
					.onChange(async (value) => {
						(this.plugin.settings[settingKey] as any) = value;
						await this.plugin.saveSettings();
					});
			}
		);
	}

	private createDropdownSetting(
		containerEl: HTMLElement,
		nameKey: string,
		descKey: string,
		settingKey: SettingsKeys,
		options: Record<string, string>,
		onChangeCallback?: (value: string) => void,
		translateOptions: boolean = true
	): Setting {
		if (translateOptions) {
			options = Object.entries(options).reduce((acc, [key, valueKey]) => {
				acc[key] = t(valueKey as any);
				return acc;
			}, {} as Record<string, string>);
		}

		return this.createBaseSetting(
			containerEl,
			nameKey,
			descKey
		).addDropdown((dropdown) => {
			dropdown
				.addOptions(options)
				.setValue(this.plugin.settings[settingKey] as string)
				.onChange(async (value) => {
					(this.plugin.settings[settingKey] as any) = value;
					await this.plugin.saveSettings();
					onChangeCallback?.(value);
				});
		});
	}

	private createValidatedInput(options: {
		containerEl: HTMLElement;
		name: string;
		description: string;
		placeholder: string;
		reload: boolean;
		getValue: () => string;
		setValue: (value: string) => void;
		getIsValid: () => boolean;
		setIsValid: (isValid: boolean) => void;
		localValidator: (value: string) => boolean;
		remoteValidator: () => Promise<void>;
	}) {
		new Setting(options.containerEl)
			.setName(options.name)
			.setDesc(options.description)
			.addText((text) => {
				const controlEl = text.inputEl.parentElement;
				let statusEl: HTMLElement | null = null;

				const updateVisualState = (
					state: "valid" | "invalid" | "loading" | "idle"
				) => {
					// Clear previous state
					statusEl?.remove();
					text.inputEl.classList.remove(
						"valid-input",
						"invalid-input"
					);

					switch (state) {
						case "loading":
							statusEl = createEl("span", {
								text: t("Validating..."),
								cls: "setting-item-control-status loading-text",
							});
							controlEl?.prepend(statusEl);
							break;
						case "valid":
							statusEl = createEl("span", {
								text: t("Valid"),
								cls: "setting-item-control-status valid-text",
							});
							controlEl?.prepend(statusEl);
							text.inputEl.classList.add("valid-input");
							break;
						case "invalid":
							text.inputEl.classList.add("invalid-input");
							break;
						case "idle":
						default:
							break;
					}
				};

				const initialState = options.getIsValid() ? "valid" : "idle";
				updateVisualState(initialState);

				const initialValue = options.getValue();
				let hasValueChanged = false;

				text.setPlaceholder(options.placeholder)
					.setValue(initialValue)
					.onChange(async (value: string) => {
						options.setValue(value);
						hasValueChanged = true;
						await this.plugin.saveSettings();
					});

				text.inputEl.addEventListener("blur", async () => {
					if (!hasValueChanged) {
						return;
					}

					const value = text.inputEl.value;

					if (!options.localValidator(value)) {
						options.setIsValid(false);
						updateVisualState("invalid");
						return;
					}

					updateVisualState("loading");
					try {
						await options.remoteValidator();
						updateVisualState(
							options.getIsValid() ? "valid" : "invalid"
						);
					} catch (error) {
						console.error("Validation error:", error);
						updateVisualState("invalid");
					} finally {
						await this.plugin.saveSettings();
					}
					if (options.getIsValid() && options.reload) {
						// 在输入框后面添加一个重新加载按钮，使用 reload emoji，点击后重新加载 Obsidian
						const reloadButton = document.createElement("button");
						reloadButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;" xmlns="http://www.w3.org/2000/svg"><path d="M12 4a8 8 0 1 1-8 8" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/><polyline points="4 4 4 8 8 8" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
						reloadButton.title = t("Reload OB") as string;
						reloadButton.style.padding = "2px 8px";
						reloadButton.style.border = "1px solid #888";
						reloadButton.style.borderRadius = "4px";
						reloadButton.style.cursor = "pointer";
						reloadButton.onclick = () => {
							this.app.commands.executeCommandById("app:reload");
						};
						// 将按钮插入到输入框后面
						text.inputEl.parentElement?.appendChild(reloadButton);
					}

					hasValueChanged = false;
				});
			});
	}

	private createGroupedDropdownSetting(
		containerEl: HTMLElement,
		nameKey: string,
		descKey: string,
		settingKey: SettingsKeys,
		optionsGrouped: Array<{
			label: string;
			options: Record<string, string>;
		}>,
		onChangeCallback?: (value: string) => void
	): Setting {
		return this.createBaseSetting(
			containerEl,
			nameKey,
			descKey
		).addDropdown((dropdown) => {
			// 先清空默认选项
			dropdown.selectEl.innerHTML = "";

			optionsGrouped.forEach((group) => {
				const optgroup = document.createElement("optgroup");
				optgroup.label = group.label;
				for (const [key, value] of Object.entries(group.options)) {
					const option = document.createElement("option");
					option.value = key;
					option.text = value;
					optgroup.appendChild(option);
				}
				dropdown.selectEl.appendChild(optgroup);
			});

			dropdown
				.setValue(this.plugin.settings[settingKey] as string)
				.onChange(async (value) => {
					(this.plugin.settings[settingKey] as any) = value;
					await this.plugin.saveSettings();
					await onChangeCallback?.(value);
				});
		});
	}

	// 创建字号滑块设置
	private createSizeSliderSetting(
		containerEl: HTMLElement,
		nameKey: string,
		descKey: string,
		settingKey:
			| "slidesRupH1Size"
			| "slidesRupH2Size"
			| "slidesRupH3Size"
			| "slidesRupH4Size"
			| "slidesRupH5Size"
			| "slidesRupH6Size"
			| "slidesRupMainFontSize",
		min: number,
		max: number,
		onChangeCallback: (value: number) => void
	) {
		const setting = new Setting(containerEl)
			.setName(t(nameKey as any))
			.setDesc(t(descKey as any));

		const sliderContainer = setting.controlEl.createDiv({
			cls: "slides-rup-size-slider-container",
		});

		const sizeSlider = sliderContainer.createEl("input", {
			type: "range",
			cls: "slides-rup-size-slider",
			attr: {
				min: min.toString(),
				max: max.toString(),
				step: "1",
				value: this.plugin.settings[settingKey].toString(),
			},
		});

		// 添加数值显示
		const valueDisplay = sliderContainer.createEl("span", {
			text: `${this.plugin.settings[settingKey]}px`,
			cls: "slides-rup-size-value",
		});

		sizeSlider.addEventListener("input", (e) => {
			const value = parseInt((e.target as HTMLInputElement).value);
			this.plugin.settings[settingKey] = value;
			valueDisplay.setText(`${value}px`);
			onChangeCallback(value);
		});

		return setting;
	}

	private getUserDesignOptions() {
		const slidesRupFrameworkPath =
			this.plugin.settings.slidesRupFrameworkFolder;
		const slidesRupUserDesignsPath = `${slidesRupFrameworkPath}/${REVEAL_USER_DESIGN_FOLDER}`;
		const options = {
			none: t("None"),
		};

		// 获取框架文件夹
		const slidesRupUserDesignsFolder = this.app.vault.getAbstractFileByPath(
			slidesRupUserDesignsPath
		);

		if (
			slidesRupUserDesignsFolder &&
			slidesRupUserDesignsFolder instanceof TFolder
		) {
			// 获取所有子文件夹
			const subFolders = slidesRupUserDesignsFolder.children
				.filter((file) => file instanceof TFolder)
				.map((folder) => folder.name.split("-").last() as string);

			// 将子文件夹添加到选项中
			for (const folderName of subFolders) {
				// 使用类型断言确保 options 可以接受字符串索引
				(options as { [key: string]: string })[folderName] = folderName;
			}
		}

		return options;
	}

	// 创建颜色设置
	private createColorSetting(
		containerEl: HTMLElement,
		nameKey: string,
		descKey: string,
		settingKey: SettingsKeys,
		onChangeCallback: (value: string) => void
	) {
		const setting = new Setting(containerEl)
			.setName(t(nameKey as any))
			.setDesc(t(descKey as any));

		const colorInput = setting.controlEl.createEl("input", {
			type: "color",
			value: this.plugin.settings[settingKey] as string,
		});

		// 创建“恢复默认”按钮
		const resetIcon = setting.controlEl.createEl("button", {
			cls: "slides-rup-reset-color-btn",
			attr: {
				"aria-label": t("Use Default Value"),
			},
		});

		setIcon(resetIcon, "refresh");

		// 获取默认值
		const defaultValue =
			(DEFAULT_SETTINGS[settingKey] as string) || "#000000";

		// 监听颜色变化
		colorInput.addEventListener("change", async (e) => {
			const target = e.target as HTMLInputElement;
			const value = target.value;
			(this.plugin.settings[settingKey] as any) = value;
			await this.plugin.saveSettings();
			onChangeCallback(value);
		});

		// 监听“恢复默认”按钮点击
		resetIcon.addEventListener("click", async () => {
			(this.plugin.settings[settingKey] as any) = defaultValue;
			colorInput.value = defaultValue;
			await this.plugin.saveSettings();
			onChangeCallback(defaultValue);
		});

		return setting;
	}
	/**
	 * 获取默认设计选项
	 * @returns 包含None选项和所有默认设计的选项对象
	 */
	private getDefaultDesignOptions(): Record<string, string> {
		return {
			none: "None",
			...Object.fromEntries(
				DEFAULT_DESIGNS.map((letter) => [
					letter,
					`Slide Design ${letter.toUpperCase()}`,
				])
			),
		};
	}
}
