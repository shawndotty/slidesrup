import { App, Notice, TFile } from "obsidian";
import { t } from "./lang/helpers";
import { slideTemplate } from "./templates/slide-template";
import { SuggesterOption } from "./utils/base-suggester";
import {
	SlideLocationSuggester,
	SlideDesignSuggester,
} from "./utils/suggesters";
import { OBASAssistantSettings } from "./types";

export class SlidesMaker {
	private app: App;
	private settings: OBASAssistantSettings;

	constructor(app: App, settings: OBASAssistantSettings) {
		this.app = app;
		this.settings = settings;
	}

	async createSlides(): Promise<void> {
		// 在当前文件夹创建新笔记
		const newSlideLocationChoice = this.settings.newSlideLocationOption;
		const currentFolder =
			this.app.workspace.getActiveFile()?.parent?.path || "";
		let newSlideLocation = currentFolder;
		switch (newSlideLocationChoice) {
			case "current":
				break;
			case "decideByUser":
				const locationSuggester = new SlideLocationSuggester(
					this.app,
					currentFolder,
					this.settings.assignedNewSlideLocation
				);
				const locationOption = await new Promise<SuggesterOption>(
					(resolve) => {
						locationSuggester.onChooseItem = (item) => {
							resolve(item);
							return item;
						};
						locationSuggester.open();
					}
				);

				// 如果用户取消了位置选择，直接返回
				if (!locationOption) {
					new Notice(t("Select Location"));
					return;
				}
				newSlideLocation = locationOption.value;
				break;
			case "assigned":
				newSlideLocation = this.settings.assignedNewSlideLocation;
				break;
		}

		const template = slideTemplate.replace(
			"{{OBASPath}}",
			this.settings.obasFrameworkFolder
		);

		// 使用时间戳和计数器生成文件名
		const now = new Date();
		const timestamp = `${now.getFullYear()}-${String(
			now.getMonth() + 1
		).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(
			now.getHours()
		).padStart(2, "0")}-${String(now.getMinutes()).padStart(
			2,
			"0"
		)}-${String(now.getSeconds()).padStart(2, "0")}`;
		const fileName = `${t("Untitled Slide")}-${timestamp}`;

		let designOption: SuggesterOption | null = null;
		const suggester = new SlideDesignSuggester(this.app);
		// 创建一个弹出窗口让用户选择设计
		designOption = await new Promise<SuggesterOption>((resolve) => {
			suggester.onChooseItem = (item) => {
				resolve(item);
				return item;
			};
			suggester.open();
		});

		// 如果用户取消了选择，直接返回
		if (!designOption) {
			new Notice(t("Please select a slide design"));
			return;
		}

		// 将选中的设计替换到模板中
		// 使用正则表达式全局替换所有匹配的占位符
		const finalTemplate = template.replace(
			/\{\{design\}\}/g,
			designOption.value
		);
		const filePath =
			newSlideLocation !== "/"
				? `${newSlideLocation}/${fileName}.md`
				: `${fileName}.md`;

		// 使用模板内容创建新文件
		await this.app.vault.create(
			filePath,
			finalTemplate.trim().replace("{{title}}", fileName)
		);

		console.log(filePath);

		// 打开新创建的文件
		const newFile = this.app.vault.getAbstractFileByPath(filePath);
		console.dir(newFile);
		if (newFile) {
			console.log("here");
			if (newFile instanceof TFile) {
				await this.app.workspace.getLeaf().openFile(newFile);
			}
		}
	}
}
