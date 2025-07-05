import { App, PluginSettingTab, Setting } from "obsidian";
import { t } from "../lang/helpers";
import OBASAssistant from "../main";
import { isValidApiKey, isValidEmail } from "./utils";

export class OBASAssistantSettingTab extends PluginSettingTab {
	plugin: OBASAssistant;

	constructor(app: App, plugin: OBASAssistant) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", {
			text: t("Main Setting"),
			cls: "my-plugin-title", // 添加自定义CSS类
		});

		new Setting(containerEl)
			.setName(t("OBAS Update API Key"))
			.setDesc(t("Please enter a valid update API Key"))
			.addText((text) => {
				const validSpan = createEl("span", {
					text: t("Valid API Key"),
					cls: "valid-text",
				});
				const loadingSpan = createEl("span", {
					text: t("Validating..."),
					cls: "loading-text",
				});
				validSpan.style.display = "none";
				loadingSpan.style.display = "none";
				text.inputEl.parentElement?.insertBefore(
					validSpan,
					text.inputEl
				);
				text.inputEl.parentElement?.insertBefore(
					loadingSpan,
					text.inputEl
				);

				const updateValidState = (
					isValid: boolean,
					isLoading: boolean = false
				) => {
					if (isLoading) {
						text.inputEl.removeClass("valid-api-key");
						text.inputEl.removeClass("invalid-api-key");
						validSpan.style.display = "none";
						loadingSpan.style.display = "inline";
					} else {
						loadingSpan.style.display = "none";
						if (isValid) {
							text.inputEl.removeClass("invalid-api-key");
							text.inputEl.addClass("valid-api-key");
							text.inputEl.style.borderColor = "#4CAF50";
							text.inputEl.style.color = "#4CAF50";
							validSpan.style.display = "inline";
						} else {
							text.inputEl.removeClass("valid-api-key");
							text.inputEl.addClass("invalid-api-key");
							text.inputEl.style.borderColor = "#FF5252";
							text.inputEl.style.color = "#FF5252";
							validSpan.style.display = "none";
						}
					}
				};

				// 初始状态设置
				updateValidState(this.plugin.settings.updateAPIKeyIsValid);
				return text
					.setPlaceholder(t("Enter the API Key"))
					.setValue(this.plugin.settings.updateAPIKey)
					.onChange(async (value) => {
						this.plugin.settings.updateAPIKey = value;
						if (isValidApiKey(value)) {
							updateValidState(false, true); // 显示加载状态
							await this.plugin.checkApiKey();
							updateValidState(
								this.plugin.settings.updateAPIKeyIsValid
							);
						} else {
							updateValidState(false);
						}
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t("Your Email Address"))
			.setDesc(
				t(
					"Please enter the email you provided when you purchase this product"
				)
			)
			.addText((text) => {
				const validSpan = createEl("span", {
					text: t("Valid Email"),
					cls: "valid-text",
				});
				const loadingSpan = createEl("span", {
					text: t("Validating..."),
					cls: "loading-text",
				});
				validSpan.style.display = "none";
				loadingSpan.style.display = "none";
				text.inputEl.parentElement?.insertBefore(
					validSpan,
					text.inputEl
				);
				text.inputEl.parentElement?.insertBefore(
					loadingSpan,
					text.inputEl
				);

				const updateValidState = (
					isValid: boolean,
					isLoading: boolean = false
				) => {
					if (isLoading) {
						text.inputEl.removeClass("valid-email");
						text.inputEl.removeClass("invalid-email");
						validSpan.style.display = "none";
						loadingSpan.style.display = "inline";
					} else {
						loadingSpan.style.display = "none";
						if (isValid) {
							text.inputEl.removeClass("invalid-email");
							text.inputEl.addClass("valid-email");
							text.inputEl.style.borderColor = "#4CAF50";
							text.inputEl.style.color = "#4CAF50";
							validSpan.style.display = "inline";
						} else {
							text.inputEl.removeClass("valid-email");
							text.inputEl.addClass("invalid-email");
							text.inputEl.style.borderColor = "#FF5252";
							text.inputEl.style.color = "#FF5252";
							validSpan.style.display = "none";
						}
					}
				};

				// 初始状态设置
				updateValidState(this.plugin.settings.userChecked);
				return text
					.setPlaceholder(t("Enter your email"))
					.setValue(this.plugin.settings.userEmail)
					.onChange(async (value) => {
						this.plugin.settings.userEmail = value;
						if (isValidEmail(this.plugin.settings.userEmail)) {
							updateValidState(false, true);
							await this.plugin.getUpdateIDs();
							updateValidState(this.plugin.settings.userChecked);
						} else {
							updateValidState(false);
						}
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t("OBAS Framework Folder"))
			.setDesc(t("Please enter the path to the OBAS Framework Folder"))
			.addText((text) =>
				text
					.setPlaceholder(
						t("Enter the full path to the OBAS Framework folder")
					)
					.setValue(this.plugin.settings.obasFrameworkFolder)
					.onChange(async (value) => {
						this.plugin.settings.obasFrameworkFolder = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t("New Slide Location Option"))
			.setDesc(t("Please select the default new slide location option"))
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						current: t("Current Folder"),
						decideByUser: t("Decide At Creation"),
						assigned: t("User Assigned Folder"),
					})
					.setValue(this.plugin.settings.newSlideLocationOption)
					.onChange(async (value) => {
						this.plugin.settings.newSlideLocationOption = value;
						// 根据选项控制Default New Slide Location设置项的显示状态
						defaultLocationSetting.settingEl.style.display =
							value === "assigned" ? "" : "none";
						await this.plugin.saveSettings();
					})
			);

		const defaultLocationSetting = new Setting(containerEl)
			.setName(t("Default New Slide Location"))
			.setDesc(
				t("Please enter the path to the default new slide location")
			)
			.addText((text) =>
				text
					.setPlaceholder(
						t(
							"Enter the full path to the default new slide location"
						)
					)
					.setValue(this.plugin.settings.assignedNewSlideLocation)
					.onChange(async (value) => {
						this.plugin.settings.assignedNewSlideLocation = value;
						await this.plugin.saveSettings();
					})
			);

		// 根据初始选项设置显示状态
		defaultLocationSetting.settingEl.style.display =
			this.plugin.settings.newSlideLocationOption === "assigned"
				? ""
				: "none";
	}
}
