import { App, debounce, PluginSettingTab, Setting } from "obsidian";
import { t } from "../lang/helpers";
import OBASAssistant from "../main";
import { isValidApiKey, isValidEmail } from "../utils";
import { ApiService } from "../services/api-services";
import { FolderSuggest } from "./pickers/folder-picker";
import { FileSuggest, FileSuggestMode } from "./pickers/file-picker";

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
			text: t("Main Setting"),
			cls: "my-plugin-title",
		});

		// Refactored API Key Setting
		this.createValidatedInput({
			containerEl,
			name: t("OBAS Update API Key"),
			description: t("Please enter a valid update API Key"),
			placeholder: t("Enter the API Key"),
			getValue: () => this.plugin.settings.updateAPIKey,
			setValue: (value) => (this.plugin.settings.updateAPIKey = value),
			getIsValid: () => this.plugin.settings.updateAPIKeyIsValid,
			setIsValid: (isValid) =>
				(this.plugin.settings.updateAPIKeyIsValid = isValid),
			localValidator: isValidApiKey,
			remoteValidator: () => this.apiService.checkApiKey(),
		});

		// Refactored Email Setting
		this.createValidatedInput({
			containerEl,
			name: t("Your Email Address"),
			description: t(
				"Please enter the email you provided when you purchase this product"
			),
			placeholder: t("Enter your email"),
			getValue: () => this.plugin.settings.userEmail,
			setValue: (value) => (this.plugin.settings.userEmail = value),
			getIsValid: () => this.plugin.settings.userChecked,
			setIsValid: (isValid) =>
				(this.plugin.settings.userChecked = isValid),
			localValidator: isValidEmail,
			remoteValidator: () => this.apiService.getUpdateIDs(),
		});

		new Setting(containerEl)
			.setName(t("OBAS Framework Folder"))
			.setDesc(t("Please enter the path to the OBAS Framework Folder"))
			.addSearch((text) => {
				new FolderSuggest(this.app, text.inputEl);
				text.setPlaceholder(
					t("Enter the full path to the OBAS Framework folder")
				)
					.setValue(this.plugin.settings.obasFrameworkFolder)
					.onChange(async (value) => {
						this.plugin.settings.obasFrameworkFolder = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t("Default Design"))
			.setDesc(t("Please select your default design"))
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						none: t("None"),
						a: t("Slide Design A"),
						b: t("Slide Design B"),
						c: t("Slide Design C"),
						d: t("Slide Design D"),
						e: t("Slide Design E"),
						f: t("Slide Design F"),
						g: t("Slide Design G"),
					})
					.setValue(this.plugin.settings.defaultDesign)
					.onChange(async (value) => {
						this.plugin.settings.defaultDesign = value;
						await this.plugin.saveSettings();
					})
			);

		const newSlideLocationSetting = new Setting(containerEl)
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

		defaultLocationSetting.settingEl.style.display =
			this.plugin.settings.newSlideLocationOption === "assigned"
				? ""
				: "none";

		new Setting(containerEl)
			.setName(t("User Templates Folder"))
			.setDesc(t("Please enter the path to your own templates"))
			.addSearch((text) => {
				new FolderSuggest(this.app, text.inputEl);
				text.setPlaceholder(t("Choose your templates folder"))
					.setValue(this.plugin.settings.templatesFolder)
					.onChange(async (value) => {
						this.plugin.settings.templatesFolder = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t("User Slide Template"))
			.setDesc(t("Please choose your personal slide template"))
			.addSearch((text) => {
				new FileSuggest(
					text.inputEl,
					this.plugin,
					FileSuggestMode.TemplateFiles
				);
				text.setPlaceholder(t("Choose your personal slide template"))
					.setValue(this.plugin.settings.userSlideTemplate)
					.onChange(async (value) => {
						this.plugin.settings.userSlideTemplate = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t("User Chapter Template"))
			.setDesc(t("Please choose your personal chapter template"))
			.addSearch((text) => {
				new FileSuggest(
					text.inputEl,
					this.plugin,
					FileSuggestMode.TemplateFiles
				);
				text.setPlaceholder(t("Choose your personal chapter template"))
					.setValue(this.plugin.settings.userChapterTemplate)
					.onChange(async (value) => {
						this.plugin.settings.userChapterTemplate = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t("User Page Template"))
			.setDesc(t("Please choose your personal page template"))
			.addSearch((text) => {
				new FileSuggest(
					text.inputEl,
					this.plugin,
					FileSuggestMode.TemplateFiles
				);
				text.setPlaceholder(t("Choose your personal page template"))
					.setValue(this.plugin.settings.userPageTemplate)
					.onChange(async (value) => {
						this.plugin.settings.userPageTemplate = value;
						await this.plugin.saveSettings();
					});
			});
	}

	/**
	 * Creates a setting with a text input that supports live, debounced validation.
	 * Note: Add styles for `.valid-input` and `.invalid-input` classes in `styles.css`
	 * for visual feedback.
	 */
	private createValidatedInput(options: {
		containerEl: HTMLElement;
		name: string;
		description: string;
		placeholder: string;
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
				const validSpan = createEl("span", {
					text: t("Valid"),
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

				const updateVisualState = (
					isValid: boolean,
					isLoading: boolean = false
				) => {
					loadingSpan.style.display = isLoading ? "inline" : "none";
					validSpan.style.display =
						!isLoading && isValid ? "inline" : "none";

					text.inputEl.classList.toggle(
						"valid-input",
						!isLoading && isValid
					);
					text.inputEl.classList.toggle(
						"invalid-input",
						!isLoading && !isValid
					);

					if (isLoading) {
						text.inputEl.classList.remove(
							"valid-input",
							"invalid-input"
						);
					}
				};

				updateVisualState(options.getIsValid());

				text.setPlaceholder(options.placeholder).setValue(
					options.getValue()
				);

				const debouncedValidation = debounce(
					async (value: string) => {
						options.setValue(value);
						if (options.localValidator(value)) {
							updateVisualState(false, true); // Show loading
							await options.remoteValidator();
							updateVisualState(options.getIsValid(), false);
						} else {
							options.setIsValid(false); // Fix bug: update stored validity
							updateVisualState(false, false);
						}
						await this.plugin.saveSettings();
					},
					500,
					true
				);

				text.onChange(debouncedValidation);
			});
	}
}
