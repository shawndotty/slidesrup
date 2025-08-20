import {
	App,
	debounce,
	PluginSettingTab,
	Setting,
	setIcon,
	TFolder,
} from "obsidian";
import { t } from "../lang/helpers";
import OBASAssistant from "../main";
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
import { DEFAULT_DESIGNS } from "../constants";

type SettingsKeys = keyof OBASAssistant["settings"];

export class OBASAssistantSettingTab extends PluginSettingTab {
	plugin: OBASAssistant;
	private apiService: ApiService;

	constructor(app: App, plugin: OBASAssistant) {
		super(app, plugin);
		this.plugin = plugin;
		this.apiService = new ApiService(this.plugin.settings);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", {
			text: t("OBAS_Assistant_Settings_Heading"),
		});

		const tabbedSettings = new TabbedSettings(containerEl);

		const tabConfigs = [
			{
				title: "Main Setting",
				renderMethod: (content: HTMLElement) =>
					this.renderMainSettings(content),
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
				title: "Slide Settings",
				renderMethod: (content: HTMLElement) =>
					this.renderSlideSettings(content),
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
			name: t("OBAS Update API Key"),
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
			"OBAS Running Language",
			"Please select your obas framework running language",
			"obasRunningLanguage",
			{
				ob: "Auto (Follow System Language)",
				"zh-cn": "Chinese",
				"zh-tw": "Chinses Traditional",
				en: "English",
			}
		);

		this.createFolderSetting(
			containerEl,
			"OBAS Framework Folder",
			"Please enter the path to the OBAS Framework Folder",
			"Enter the full path to the OBAS Framework folder",
			"obasFrameworkFolder"
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
			cls: "obas-assistant-title",
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
			"Please enter your user design name",
			"obasUserDesigns",
			this.getUserDesignOptions(),
			undefined,
			false
		);

		if (
			this.plugin.settings.obasUserDesignsCss &&
			Array.isArray(this.plugin.settings.obasUserDesignsCss) &&
			this.plugin.settings.obasUserDesignsCss.length > 0
		) {
			containerEl.createEl("h3", {
				text: t("User Designs CSS"),
				cls: "obas-assistant-title",
			});
			this.plugin.settings.obasUserDesignsCss.forEach((item, index) => {
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
								this.plugin.settings.obasUserDesignsCss[
									index
								].enabled = value;
								await this.plugin.saveSettings();

								await this.plugin.services.obasStyleService.modifyStyleSection(
									"userCss"
								);
							});
					});
			});
		}

		containerEl.createEl("h2", {
			text: t("User Templates"),
			cls: "obas-assistant-title",
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
			cls: "obas-assistant-title",
		});

		const onThemeColorChanges = debounce(
			async () => {
				await this.plugin.saveSettings();
				await this.plugin.services.obasStyleService.modifyStyleSection(
					"hsl"
				);
			},
			200,
			true
		);

		const onColorChange = debounce(
			async () => {
				await this.plugin.saveSettings();
				await this.plugin.services.obasStyleService.modifyStyleSection(
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
			"obasThemeColor",
			onThemeColorChanges
		);

		this.createDropdownSetting(
			containerEl,
			"Slide Mode",
			"Set the slide mode",
			"obasSlideMode",
			{
				none: "Decide At Creation",
				light: "Light Mode",
				dark: "Dark Mode",
			}
		);

		// 标题颜色设置
		containerEl.createEl("h2", {
			text: t("Customize Text Colors"),
			cls: "obas-assistant-title",
		});

		this.createToggleSetting(containerEl, {
			name: "Use User Color Setting",
			desc: "Enable User Color Setting",
			value: this.plugin.settings.enableObasColorUserSetting,
			onChange: async (value) => {
				this.plugin.settings.enableObasColorUserSetting = value;
				await this.plugin.saveSettings();
				if (value) {
					await this.plugin.services.obasStyleService.modifyStyleSection(
						"color"
					);
				} else {
					await this.plugin.services.obasStyleService.clearStyleSection(
						"color"
					);
				}
			},
		});

		containerEl.createEl("h3", {
			text: t("Heading Colors"),
			cls: "obas-assistant-title",
		});

		this.createColorSetting(
			containerEl,
			"H1 Color",
			"Set the color for H1 headings",
			"obasH1Color",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"H2 Color",
			"Set the color for H2 headings",
			"obasH2Color",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"H3 Color",
			"Set the color for H3 headings",
			"obasH3Color",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"H4 Color",
			"Set the color for H4 headings",
			"obasH4Color",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"H5 Color",
			"Set the color for H5 headings",
			"obasH5Color",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"H6 Color",
			"Set the color for H6 headings",
			"obasH6Color",
			onColorChange
		);

		// 正文颜色设置
		containerEl.createEl("h3", {
			text: t("Body Colors"),
			cls: "obas-assistant-title",
		});

		this.createColorSetting(
			containerEl,
			"Body Color",
			"Set the color for body text",
			"obasBodyColor",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"Paragraph Color",
			"Set the color for paragraphs",
			"obasParagraphColor",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"List Color",
			"Set the color for lists",
			"obasListColor",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"Strong Color",
			"Set the color for strong/bold text",
			"obasStrongColor",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"Emphasis Color",
			"Set the color for emphasis/italic text",
			"obasEmColor",
			onColorChange
		);

		this.createColorSetting(
			containerEl,
			"Link Color",
			"Set the color for links",
			"obasLinkColor",
			onColorChange
		);
	}

	private renderFontSettings(containerEl: HTMLElement): void {
		const onFontFamilyChange = debounce(
			async () => {
				await this.plugin.saveSettings();
				await this.plugin.services.obasStyleService.modifyStyleSection(
					"fontFamily"
				);
			},
			200,
			true
		);

		const onFontSizeChange = debounce(
			async () => {
				await this.plugin.saveSettings();
				await this.plugin.services.obasStyleService.modifyStyleSection(
					"fontSize"
				);
			},
			200,
			true
		);

		const onHeadingTextTransformChange = debounce(
			async () => {
				await this.plugin.saveSettings();
				await this.plugin.services.obasStyleService.modifyStyleSection(
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
			cls: "obas-assistant-title",
		});

		this.createToggleSetting(containerEl, {
			name: "Use User Font Family Setting",
			desc: "Enable User Font Family Setting",
			value: this.plugin.settings.enableObasFontFamilyUserSetting,
			onChange: async (value) => {
				this.plugin.settings.enableObasFontFamilyUserSetting = value;
				await this.plugin.saveSettings();
				if (value) {
					await this.plugin.services.obasStyleService.modifyStyleSection(
						"fontFamily"
					);
				} else {
					await this.plugin.services.obasStyleService.clearStyleSection(
						"fontFamily"
					);
				}
			},
		});

		this.createGroupedDropdownSetting(
			containerEl,
			"Main Font",
			"Set Main Font",
			"obasMainFont",
			fontOptionsGrouped,
			onFontFamilyChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"Heading Font",
			"Set Heading Font",
			"obasHeadingFont",
			fontOptionsGrouped,
			onFontFamilyChange
		);

		// 各级标题字体（H1-H6）
		this.createGroupedDropdownSetting(
			containerEl,
			"H1 Font",
			"Set H1 Font",
			"obasH1Font",
			fontOptionsGrouped,
			onFontFamilyChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"H2 Font",
			"Set H2 Font",
			"obasH2Font",
			fontOptionsGrouped,
			onFontFamilyChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"H3 Font",
			"Set H3 Font",
			"obasH3Font",
			fontOptionsGrouped,
			onFontFamilyChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"H4 Font",
			"Set H4 Font",
			"obasH4Font",
			fontOptionsGrouped,
			onFontFamilyChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"H5 Font",
			"Set H5 Font",
			"obasH5Font",
			fontOptionsGrouped,
			onFontFamilyChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"H6 Font",
			"Set H6 Font",
			"obasH6Font",
			fontOptionsGrouped,
			onFontFamilyChange
		);

		containerEl.createEl("h2", {
			text: t("Font Size"),
			cls: "obas-assistant-title",
		});

		this.createToggleSetting(containerEl, {
			name: "Use User Font Size Setting",
			desc: "Enable User Font Size Setting",
			value: this.plugin.settings.enableObasFontSizeUserSetting,
			onChange: async (value) => {
				this.plugin.settings.enableObasFontSizeUserSetting = value;
				await this.plugin.saveSettings();
				if (value) {
					await this.plugin.services.obasStyleService.modifyStyleSection(
						"fontSize"
					);
				} else {
					await this.plugin.services.obasStyleService.clearStyleSection(
						"fontSize"
					);
				}
			},
		});

		this.createSizeSliderSetting(
			containerEl,
			"Body Size",
			"Adjust the font size of body",
			"obasMainFontSize",
			12,
			72,
			onFontSizeChange
		);

		// 各级标题字号设置（H1-H6）
		this.createSizeSliderSetting(
			containerEl,
			"H1 Size",
			"Adjust the font size of H1",
			"obasH1Size",
			12,
			180,
			onFontSizeChange
		);

		this.createSizeSliderSetting(
			containerEl,
			"H2 Size",
			"Adjust the font size of H2",
			"obasH2Size",
			12,
			144,
			onFontSizeChange
		);

		this.createSizeSliderSetting(
			containerEl,
			"H3 Size",
			"Adjust the font size of H3",
			"obasH3Size",
			12,
			108,
			onFontSizeChange
		);

		this.createSizeSliderSetting(
			containerEl,
			"H4 Size",
			"Adjust the font size of H4",
			"obasH4Size",
			12,
			72,
			onFontSizeChange
		);

		this.createSizeSliderSetting(
			containerEl,
			"H5 Size",
			"Adjust the font size of H5",
			"obasH5Size",
			12,
			54,
			onFontSizeChange
		);

		this.createSizeSliderSetting(
			containerEl,
			"H6 Size",
			"Adjust the font size of H6",
			"obasH6Size",
			12,
			36,
			onFontSizeChange
		);

		// 标题文字变换设置
		containerEl.createEl("h2", {
			text: t("Text Transform"),
			cls: "obas-assistant-title",
		});

		this.createDropdownSetting(
			containerEl,
			"Heading Text Transform",
			"Set text transform for all headings",
			"obasHeadingTextTransform",
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
	}

	private renderAdvancedSettings(containerEl: HTMLElement): void {
		// 根据用户设计CSS配置创建动态toggle设置

		containerEl.createEl("h2", {
			text: t("Customized CSS"),
			cls: "obas-assistant-title",
		});

		this.createToggleSetting(containerEl, {
			name: "Use User Customized CSS",
			desc: "Enable User Customized CSS",
			value: this.plugin.settings.enableCustomCss,
			onChange: async (value) => {
				this.plugin.settings.enableCustomCss = value;
				await this.plugin.saveSettings();
				if (value) {
					await this.plugin.services.obasStyleService.modifyStyleSection(
						"userStyle"
					);
				} else {
					await this.plugin.services.obasStyleService.clearStyleSection(
						"userStyle"
					);
				}
			},
		});

		new Setting(containerEl)
			.setName("自定义 CSS")
			.setDesc("在此输入自定义 CSS 代码，将应用于演示文稿。")
			.setClass("obas-custom-css");

		// 创建一个 div 元素作为 CodeMirror 的容器
		const editorContainer = containerEl.createDiv(
			"obas-assistant-css-editor"
		);

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
				this.plugin.services.obasStyleService.modifyStyleSection(
					"userStyle"
				);
			},
			500,
			true
		);
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
			| "obasH1Size"
			| "obasH2Size"
			| "obasH3Size"
			| "obasH4Size"
			| "obasH5Size"
			| "obasH6Size"
			| "obasMainFontSize",
		min: number,
		max: number,
		onChangeCallback: (value: number) => void
	) {
		const setting = new Setting(containerEl)
			.setName(t(nameKey as any))
			.setDesc(t(descKey as any));

		const sliderContainer = setting.controlEl.createDiv({
			cls: "obas-size-slider-container",
		});

		const sizeSlider = sliderContainer.createEl("input", {
			type: "range",
			cls: "obas-size-slider",
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
			cls: "obas-size-value",
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
		const obasFrameworkPath = this.plugin.settings.obasFrameworkFolder;
		const obasUserDesignsPath = `${obasFrameworkPath}/MyDesigns`;
		const options = {
			none: t("None"),
		};

		// 获取框架文件夹
		const obasUserDesignsFolder =
			this.app.vault.getAbstractFileByPath(obasUserDesignsPath);

		if (obasUserDesignsFolder && obasUserDesignsFolder instanceof TFolder) {
			// 获取所有子文件夹
			const subFolders = obasUserDesignsFolder.children
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
			cls: "obas-reset-color-btn",
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
