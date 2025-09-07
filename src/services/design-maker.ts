import { App, Editor, Notice, TFile, moment, TFolder } from "obsidian";
import { t } from "../lang/helpers";
import { OBASAssistantSettings } from "src/types";
import { SuggesterOption } from "../suggesters/base-suggester";
import { InputModal } from "src/ui/modals/input-modal";
import {
	createPathIfNeeded,
	get_tfiles_from_folder,
	getUserDesigns,
	getAllDesignsOptions,
} from "src/utils";
import { TEMPLATE_PLACE_HOLDERS, DEFAULT_DESIGNS } from "src/constants";
import { SlideDesignSuggester } from "../suggesters/suggesters";

export class DesignMaker {
	private app: App;
	private settings: OBASAssistantSettings;
	private static readonly MY_DESIGN_FOLDER = "MyDesigns";
	private defaultDesigns: typeof DEFAULT_DESIGNS = DEFAULT_DESIGNS;
	private userDesignPath: string = "";
	private userDesigns: Array<string> = [];
	private designOptions: Array<SuggesterOption> = [];

	constructor(app: App, settings: OBASAssistantSettings) {
		this.app = app;
		this.settings = settings;
		this.userDesignPath = `${this.settings.obasFrameworkFolder}/${DesignMaker.MY_DESIGN_FOLDER}`;
	}

	async makeNewBlankDesign() {
		const designName = await this._getDesignName();
		if (!designName) return;

		const trimedDesignName = designName.trim();

		const newDesignFolderName = `Design-${trimedDesignName}`;
		const newDesignPath = `${this.userDesignPath}/${newDesignFolderName}`;

		await createPathIfNeeded(this.app, newDesignPath);

		const newDesignFiles = [
			`${t("Cover")}-${trimedDesignName}`,
			`${t("BackCover")}-${trimedDesignName}`,
			`${t("TOC")}-${trimedDesignName}`,
			`${t("Chapter")}-${trimedDesignName}`,
			`${t("ContentPage")}-${trimedDesignName}`,
			`${t("BlankPage")}-${trimedDesignName}`,
		];

		// Optimized approach:
		const fileCreationPromises = newDesignFiles.map(async (fileName) => {
			const filePath = `${newDesignPath}/${fileName}.md`;
			try {
				return await this.app.vault.create(filePath, `<% content %>`);
			} catch (error) {
				new Notice(
					`${t("Cann't create file")}${filePath}\n${t(
						"Error Info"
					)}${error}`
				);
				return null;
			}
		});

		await Promise.allSettled(fileCreationPromises);

		await this._revealNewDesign(newDesignPath);
	}

	async makeNewDesignFromCurrentDesign() {
		this.userDesigns = getUserDesigns(
			this.app,
			this.settings.obasFrameworkFolder
		);
		this.designOptions = getAllDesignsOptions(
			this.defaultDesigns,
			this.userDesigns
		);
		const design = await this._selectSlideDesign(this.designOptions);
		if (!design) return;

		const designName = design.value;
		const isDefaultDesign = this.defaultDesigns.includes(designName);
		const originalDesignPath = `${this.settings.obasFrameworkFolder}/${
			isDefaultDesign ? "Designs" : "MyDesigns"
		}/Design-${designName}`;

		const newDesignName = await this._getDesignName();

		if (!newDesignName) return;
		const newDesignPath = `${this.settings.obasFrameworkFolder}/MyDesigns/Design-${newDesignName}`;
		await createPathIfNeeded(this.app, newDesignPath);

		// 使用 Obsidian API 复制 originalDesignPath 下的所有文件到 newDesignPath，并重命名文件名中的 -designName 为 -newDesignName
		const originalFolder =
			this.app.vault.getAbstractFileByPath(originalDesignPath);
		if (!originalFolder || !(originalFolder instanceof TFolder)) {
			new Notice(
				`${t("Cann't find the source folder")}${originalDesignPath}`
			);
			return;
		}
		const filesToCopy = originalFolder.children.filter(
			(f) => f instanceof TFile
		) as TFile[];
		for (const file of filesToCopy) {
			const originalFileName = file.name;
			const newFileName = originalFileName.replace(
				`-${designName}`,
				`-${newDesignName}`
			);
			const newFilePath = `${newDesignPath}/${newFileName}`;
			try {
				const content = await this.app.vault.read(file);
				const newContent = content.replace(designName, newDesignName);
				await this.app.vault.create(newFilePath, newContent);
			} catch (error) {
				new Notice(
					`${t(
						"Cann't copy the source file"
					)}${originalFileName}\n${t("Error Info")}${error}`
				);
			}
		}
		await this._revealNewDesign(newDesignPath);
	}

	private async _revealNewDesign(path: string) {
		// 创建成功后高亮新建的设计文件夹（使用 Obsidian API 打开新建文件夹并选中第一个文件）
		const folder = this.app.vault.getAbstractFileByPath(path);
		if (folder && folder instanceof TFolder) {
			// 获取文件浏览器
			const fileExplorerLeaves =
				this.app.workspace.getLeavesOfType("file-explorer");
			// 检查是否存在可用叶子节点
			if (fileExplorerLeaves.length === 0) {
				// 若不存在，创建新的文件浏览器标签
				const leaf = this.app.workspace.getLeaf("tab");
				await leaf.setViewState({ type: "file-explorer" });
				fileExplorerLeaves.push(leaf);
			}
			// 获取首个文件浏览器视图实例
			const fileExplorerView = fileExplorerLeaves[0].view as any;

			// 强制激活文件浏览器标签（确保视图可见）
			this.app.workspace.revealLeaf(fileExplorerLeaves[0]);

			fileExplorerView.revealInFolder(folder);
		}
	}

	private async _getDesignName(): Promise<string> {
		const modal = new InputModal(
			this.app,
			t("Please input your design name"),
			""
		);
		return (await modal.openAndGetValue()) || "";
	}

	private async _selectSlideDesign(
		options: SuggesterOption[]
	): Promise<SuggesterOption | null> {
		const suggester = new SlideDesignSuggester(this.app, options);
		return new Promise((resolve) => {
			suggester.onChooseItem = (item: SuggesterOption) => {
				resolve(item);
				return item;
			};
			suggester.open();
		});
	}
}
