import { App, debounce, PluginSettingTab, Setting, setIcon } from "obsidian";
import { t } from "../lang/helpers";
import OBASAssistant from "../main";
import { isValidApiKey, isValidEmail } from "../utils";
import { ApiService } from "../services/api-services";
import { FolderSuggest } from "./pickers/folder-picker";
import { FileSuggest, FileSuggestMode } from "./pickers/file-picker";
import { SettingConfig } from "src/types";
import { TabbedSettings } from "./tabbed-settings";
import { DEFAULT_SETTINGS } from "../models/default-settings";
import { inherits } from "util";
import { EditorView, basicSetup, EditorState } from "@codemirror/basic-setup";
import { css } from "@codemirror/lang-css";
import {
	autocompletion,
	CompletionContext,
	CompletionResult,
	CompletionSource,
} from "@codemirror/autocomplete";

type SettingsKeys = keyof OBASAssistant["settings"];

export class OBASAssistantSettingTab extends PluginSettingTab {
	plugin: OBASAssistant;
	private apiService: ApiService;
	private hueSlider?: HTMLInputElement;
	private saturationSlider?: HTMLInputElement;
	private lightnessSlider?: HTMLInputElement;

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

		// 定义标签页配置
		const tabConfigs = [
			{
				title: "Main Setting",
				renderMethod: (content: HTMLElement) =>
					this.renderMainSettings(content),
			},
			{
				title: "User Templates Setting",
				renderMethod: (content: HTMLElement) =>
					this.renderUserSettings(content),
			},
			{
				title: "Theme Setting",
				renderMethod: (content: HTMLElement) =>
					this.renderThemeSettings(content),
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

		this.createDropdownSetting(
			containerEl,
			"Default Design",
			"Please select your default design",
			"defaultDesign",
			{
				none: "None",
				a: "Slide Design A",
				b: "Slide Design B",
				c: "Slide Design C",
				d: "Slide Design D",
				e: "Slide Design E",
				f: "Slide Design F",
				g: "Slide Design G",
				h: "Slide Design H",
			}
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

	private renderThemeSettings(containerEl: HTMLElement): void {
		containerEl.createEl("h2", {
			text: t("Theme Colors"),
			cls: "obas-assistant-title",
		});

		const colorPreviewBlock = this.createColorPreview(containerEl);

		const setPreviewColor = () => {
			const { obasHue, obasSaturation, obasLightness } =
				this.plugin.settings;
			colorPreviewBlock.style.backgroundColor = `hsl(${obasHue}, ${obasSaturation}%, ${obasLightness}%)`;
		};

		setPreviewColor(); // Set initial color

		const onHslChange = debounce(
			async () => {
				await this.plugin.saveSettings();
				await this.plugin.services.obasStyleService.modifyObasHslFile();
				setPreviewColor();
			},
			200,
			true
		);

		const onColorChange = debounce(
			async () => {
				await this.plugin.saveSettings();
				await this.plugin.services.obasStyleService.modifyObasColorFile();
			},
			200,
			true
		);

		// 创建色相选择器
		this.createHueSlider(containerEl, (value) => {
			this.plugin.settings.obasHue = value;
			onHslChange();
			// 更新饱和度和亮度滑块的渐变背景
			this.updateSliderGradients();
		});

		// 创建饱和度选择器
		this.createSaturationSlider(containerEl, (value) => {
			this.plugin.settings.obasSaturation = value;
			onHslChange();
			// 更新亮度滑块的渐变背景
			this.updateSliderGradients();
		});

		// 创建亮度选择器
		this.createLightnessSlider(containerEl, (value) => {
			this.plugin.settings.obasLightness = value;
			onHslChange();
			// 更新饱和度滑块的渐变背景
			this.updateSliderGradients();
		});

		// 标题颜色设置
		containerEl.createEl("h2", {
			text: t("Customize Colors"),
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
					await this.plugin.services.obasStyleService.modifyObasColorFile();
				} else {
					await this.plugin.services.obasStyleService.clearObasColorFile();
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
		const onFontChange = debounce(
			async () => {
				await this.plugin.saveSettings();
				await this.plugin.services.obasStyleService.modifyObasTypographyFile();
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

		this.createToggleSetting(containerEl, {
			name: "Use User Typography Setting",
			desc: "Enable User Typography Setting",
			value: this.plugin.settings.enableObasTypographyUserSetting,
			onChange: async (value) => {
				this.plugin.settings.enableObasTypographyUserSetting = value;
				await this.plugin.saveSettings();
				if (value) {
					await this.plugin.services.obasStyleService.modifyObasTypographyFile();
				} else {
					await this.plugin.services.obasStyleService.clearObasTypographyFile();
				}
			},
		});

		containerEl.createEl("h2", {
			text: t("Font Family"),
			cls: "obas-assistant-title",
		});

		this.createGroupedDropdownSetting(
			containerEl,
			"Main Font",
			"Set Main Font",
			"obasMainFont",
			fontOptionsGrouped,
			onFontChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"Heading Font",
			"Set Heading Font",
			"obasHeadingFont",
			fontOptionsGrouped,
			onFontChange
		);

		// 各级标题字体（H1-H6）
		this.createGroupedDropdownSetting(
			containerEl,
			"H1 Font",
			"Set H1 Font",
			"obasH1Font",
			fontOptionsGrouped,
			onFontChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"H2 Font",
			"Set H2 Font",
			"obasH2Font",
			fontOptionsGrouped,
			onFontChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"H3 Font",
			"Set H3 Font",
			"obasH3Font",
			fontOptionsGrouped,
			onFontChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"H4 Font",
			"Set H4 Font",
			"obasH4Font",
			fontOptionsGrouped,
			onFontChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"H5 Font",
			"Set H5 Font",
			"obasH5Font",
			fontOptionsGrouped,
			onFontChange
		);

		this.createGroupedDropdownSetting(
			containerEl,
			"H6 Font",
			"Set H6 Font",
			"obasH6Font",
			fontOptionsGrouped,
			onFontChange
		);

		containerEl.createEl("h2", {
			text: t("Font Size"),
			cls: "obas-assistant-title",
		});

		this.createSizeSliderSetting(
			containerEl,
			"Body Size",
			"Adjust the font size of body",
			"obasMainFontSize",
			12,
			72,
			onFontChange
		);

		// 各级标题字号设置（H1-H6）
		this.createSizeSliderSetting(
			containerEl,
			"H1 Size",
			"Adjust the font size of H1",
			"obasH1Size",
			12,
			180,
			onFontChange
		);

		this.createSizeSliderSetting(
			containerEl,
			"H2 Size",
			"Adjust the font size of H2",
			"obasH2Size",
			12,
			144,
			onFontChange
		);

		this.createSizeSliderSetting(
			containerEl,
			"H3 Size",
			"Adjust the font size of H3",
			"obasH3Size",
			12,
			108,
			onFontChange
		);

		this.createSizeSliderSetting(
			containerEl,
			"H4 Size",
			"Adjust the font size of H4",
			"obasH4Size",
			12,
			72,
			onFontChange
		);

		this.createSizeSliderSetting(
			containerEl,
			"H5 Size",
			"Adjust the font size of H5",
			"obasH5Size",
			12,
			54,
			onFontChange
		);

		this.createSizeSliderSetting(
			containerEl,
			"H6 Size",
			"Adjust the font size of H6",
			"obasH6Size",
			12,
			36,
			onFontChange
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
			onFontChange
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
		this.createToggleSetting(containerEl, {
			name: "Use User Customized CSS",
			desc: "Enable User Customized CSS",
			value: this.plugin.settings.enableCustomCss,
			onChange: async (value) => {
				this.plugin.settings.enableCustomCss = value;
				await this.plugin.saveSettings();
				if (value) {
					await this.plugin.services.obasStyleService.modifyObasUserStyleFile();
				} else {
					await this.plugin.services.obasStyleService.clearObasUserStyleFile();
				}
			},
		});

		const setting = new Setting(containerEl)
			.setName("自定义 CSS")
			.setDesc("在此输入自定义 CSS 代码，将应用于演示文稿。")
			.setClass("obas-custom-css");

		// 创建一个 div 元素作为 CodeMirror 的容器
		const editorContainer = containerEl.createDiv(
			"obas-assistant-css-editor"
		);

		// 初始化 CodeMirror 编辑器
		const view = new EditorView({
			state: EditorState.create({
				doc: this.plugin.settings.customCss || "",
				extensions: [
					basicSetup, // 启用基础功能，如行号、括号匹配等
					css(), // 启用CSS语言高亮
					autocompletion(), // 添加自动补全功能
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

		// 保存设置的方法（防抖处理）
		const saveCssSetting = debounce(
			(newCss: string) => {
				this.plugin.settings.customCss = newCss;
				this.plugin.saveSettings();
				this.plugin.services.obasStyleService.modifyObasUserStyleFile();
			},
			500,
			true
		);
	}

	private createColorPreview(containerEl: HTMLElement): HTMLElement {
		const previewContainer = containerEl.createDiv({
			cls: "setting-item",
		});
		const settingItemInfo = previewContainer.createDiv({
			cls: "setting-item-info",
		});
		settingItemInfo.createDiv({
			text: t("Preview Your Slide Theme Color"),
			cls: "setting-item-name",
		});

		const settingItemControl = previewContainer.createDiv({
			cls: "setting-item-control",
		});
		const colorBlock = settingItemControl.createDiv({
			cls: "obas-color-preview-block",
		});
		return colorBlock;
	}

	private createSliderSetting(
		containerEl: HTMLElement,
		name: string,
		desc: string,
		settingKey: "obasHue" | "obasSaturation" | "obasLightness",
		max: number,
		onChangeCallback: (value: number) => void
	) {
		new Setting(containerEl)
			.setName(t(name as any))
			.setDesc(t(desc as any))
			.addSlider((slider) =>
				slider
					.setLimits(0, max, 1)
					.setValue(this.plugin.settings[settingKey])
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings[settingKey] = value;
						onChangeCallback(value);
					})
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
		onChangeCallback?: (value: string) => void
	): Setting {
		const translatedOptions = Object.entries(options).reduce(
			(acc, [key, valueKey]) => {
				acc[key] = t(valueKey as any);
				return acc;
			},
			{} as Record<string, string>
		);

		return this.createBaseSetting(
			containerEl,
			nameKey,
			descKey
		).addDropdown((dropdown) => {
			dropdown
				.addOptions(translatedOptions)
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

	// 创建色相选择器
	private createHueSlider(
		containerEl: HTMLElement,
		onChangeCallback: (value: number) => void
	) {
		const setting = new Setting(containerEl)
			.setName(t("Hue"))
			.setDesc(t("Adjust the hue of the theme"));

		const sliderContainer = setting.controlEl.createDiv({
			cls: "obas-hue-slider-container obas-hsl-slider",
		});

		// 创建色相渐变背景
		const hueSlider = sliderContainer.createEl("input", {
			type: "range",
			cls: "obas-hue-slider",
			attr: {
				min: "0",
				max: "360",
				step: "1",
				value: this.plugin.settings.obasHue.toString(),
			},
		});

		// 创建色相渐变背景
		const hueGradient = this.createHueGradient();
		hueSlider.style.background = hueGradient;

		hueSlider.addEventListener("input", (e) => {
			const value = parseInt((e.target as HTMLInputElement).value);
			this.plugin.settings.obasHue = value;
			onChangeCallback(value);
		});

		return setting;
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

	// 创建饱和度选择器
	private createSaturationSlider(
		containerEl: HTMLElement,
		onChangeCallback: (value: number) => void
	) {
		const setting = new Setting(containerEl)
			.setName(t("Saturation"))
			.setDesc(t("Adjust the saturation of the theme"));

		const sliderContainer = setting.controlEl.createDiv({
			cls: "obas-saturation-slider-container obas-hsl-slider",
		});

		const saturationSlider = sliderContainer.createEl("input", {
			type: "range",
			cls: "obas-saturation-slider",
			attr: {
				min: "0",
				max: "100",
				step: "1",
				value: this.plugin.settings.obasSaturation.toString(),
			},
		});

		// 更新饱和度渐变背景
		const updateSaturationGradient = () => {
			const hue = this.plugin.settings.obasHue;
			const lightness = this.plugin.settings.obasLightness;
			const saturationGradient = this.createSaturationGradient(
				hue,
				lightness
			);
			saturationSlider.style.background = saturationGradient;
		};

		updateSaturationGradient();

		saturationSlider.addEventListener("input", (e) => {
			const value = parseInt((e.target as HTMLInputElement).value);
			this.plugin.settings.obasSaturation = value;
			onChangeCallback(value);
		});

		// 存储滑块引用以便后续更新
		this.saturationSlider = saturationSlider;

		return setting;
	}

	// 创建亮度选择器
	private createLightnessSlider(
		containerEl: HTMLElement,
		onChangeCallback: (value: number) => void
	) {
		const setting = new Setting(containerEl)
			.setName(t("Lightness"))
			.setDesc(t("Adjust the lightness of the theme"));

		const sliderContainer = setting.controlEl.createDiv({
			cls: "obas-lightness-slider-container obas-hsl-slider",
		});

		const lightnessSlider = sliderContainer.createEl("input", {
			type: "range",
			cls: "obas-lightness-slider",
			attr: {
				min: "0",
				max: "100",
				step: "1",
				value: this.plugin.settings.obasLightness.toString(),
			},
		});

		// 更新亮度渐变背景
		const updateLightnessGradient = () => {
			const hue = this.plugin.settings.obasHue;
			const saturation = this.plugin.settings.obasSaturation;
			const lightnessGradient = this.createLightnessGradient(
				hue,
				saturation
			);
			lightnessSlider.style.background = lightnessGradient;
		};

		updateLightnessGradient();

		lightnessSlider.addEventListener("input", (e) => {
			const value = parseInt((e.target as HTMLInputElement).value);
			this.plugin.settings.obasLightness = value;
			onChangeCallback(value);
		});

		// 存储滑块引用以便后续更新
		this.lightnessSlider = lightnessSlider;

		return setting;
	}

	// 创建色相渐变
	private createHueGradient(): string {
		const stops = [];
		// 创建更平滑的色相渐变，每30度一个颜色点
		for (let i = 0; i <= 360; i += 30) {
			stops.push(`hsl(${i}, 100%, 50%) ${(i / 360) * 100}%`);
		}
		// 添加最后一个点确保渐变完整
		stops.push(`hsl(360, 100%, 50%) 100%`);
		return `linear-gradient(to right, ${stops.join(", ")})`;
	}

	// 创建饱和度渐变
	private createSaturationGradient(hue: number, lightness: number): string {
		return `linear-gradient(to right, hsl(${hue}, 0%, ${lightness}%), hsl(${hue}, 100%, ${lightness}%))`;
	}

	// 创建亮度渐变
	private createLightnessGradient(hue: number, saturation: number): string {
		return `linear-gradient(to right, hsl(${hue}, ${saturation}%, 0%), hsl(${hue}, ${saturation}%, 50%), hsl(${hue}, ${saturation}%, 100%))`;
	}

	// 更新所有滑块的渐变背景
	private updateSliderGradients(): void {
		if (this.saturationSlider) {
			const hue = this.plugin.settings.obasHue;
			const lightness = this.plugin.settings.obasLightness;
			const saturationGradient = this.createSaturationGradient(
				hue,
				lightness
			);
			this.saturationSlider.style.background = saturationGradient;
		}

		if (this.lightnessSlider) {
			const hue = this.plugin.settings.obasHue;
			const saturation = this.plugin.settings.obasSaturation;
			const lightnessGradient = this.createLightnessGradient(
				hue,
				saturation
			);
			this.lightnessSlider.style.background = lightnessGradient;
		}
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
}
