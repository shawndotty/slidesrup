import { App, Editor, Notice, TFile, moment, TFolder } from "obsidian";
import { t } from "../lang/helpers";
import { SlidesRupSettings } from "src/types";
import { SuggesterOption } from "../suggesters/base-suggester";
import { InputModal } from "src/ui/modals/input-modal";
import {
	createPathIfNeeded,
	get_tfiles_from_folder,
	getUserDesigns,
	getAllDesignsOptions,
} from "src/utils";
import {
	TEMPLATE_PLACE_HOLDERS,
	DEFAULT_DESIGNS,
	REVEAL_USER_DESIGN_FOLDER,
} from "src/constants";
import { SlideDesignSuggester } from "../suggesters/suggesters";
import { VSCodeService } from "./vscode-service";

export class DesignMaker {
	private app: App;
	private settings: SlidesRupSettings;
	private static readonly MY_DESIGN_FOLDER = REVEAL_USER_DESIGN_FOLDER;
	private defaultDesigns: typeof DEFAULT_DESIGNS = DEFAULT_DESIGNS;
	private userDesignPath: string = "";
	private userDesigns: Array<string> = [];
	private designOptions: Array<SuggesterOption> = [];
	private vscodeService: VSCodeService;

	constructor(app: App, settings: SlidesRupSettings) {
		this.app = app;
		this.settings = settings;
		this.userDesignPath = `${this.settings.slidesRupFrameworkFolder}/${DesignMaker.MY_DESIGN_FOLDER}`;
		this.vscodeService = new VSCodeService(this.app, this.settings);
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
			`sr-design-${trimedDesignName.toLowerCase()}`,
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

		const marpThemesFolder = `${this.settings.slidesRupFrameworkFolder}/MarpThemes`;
		const marpThemePath = `${marpThemesFolder}/sr-design-${trimedDesignName.toLowerCase()}.css`;
		const defaultThemeContent = [
			`/* @theme sr-design-${trimedDesignName.toLowerCase()} */`,
			'@import "sr-base"',
		].join("\n");

		await this.app.vault.create(marpThemePath, defaultThemeContent);

		await this.vscodeService.addNewMarpThemeForVSCode(
			trimedDesignName.toLowerCase()
		);

		await this._revealNewDesign(newDesignPath);
	}

	async makeNewDesignFromCurrentDesign() {
		this.userDesigns = getUserDesigns(
			this.app,
			this.settings.slidesRupFrameworkFolder
		);
		this.designOptions = getAllDesignsOptions(
			this.defaultDesigns,
			this.userDesigns
		);
		const design = await this._selectSlideDesign(this.designOptions);
		if (!design) return;

		const designName = design.value;
		const isDefaultDesign = this.defaultDesigns.includes(designName);
		const originalDesignPath = `${this.settings.slidesRupFrameworkFolder}/${
			isDefaultDesign ? "Designs" : DesignMaker.MY_DESIGN_FOLDER
		}/Design-${designName}`;

		const marpThemesFolder = `${this.settings.slidesRupFrameworkFolder}/MarpThemes`;

		const newDesignName = await this._getDesignName();

		const newMarpThemePath = `${marpThemesFolder}/sr-design-${newDesignName.toLowerCase()}.css`;

		const originalMarpThemePath = `${marpThemesFolder}/sr-design-${designName.toLowerCase()}.css`;

		if (!newDesignName) return;
		const newDesignPath = `${this.settings.slidesRupFrameworkFolder}/${DesignMaker.MY_DESIGN_FOLDER}/Design-${newDesignName}`;
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

		// 获取所有文件（包括 Markdown 和图片文件）
		const filesToCopy = originalFolder.children.filter(
			(f) => f instanceof TFile
		) as TFile[];

		// 创建图片文件夹
		const imagesFolder = `${newDesignPath}`;
		await createPathIfNeeded(this.app, imagesFolder);

		for (const file of filesToCopy) {
			const originalFileName = file.name;
			let newFileName = originalFileName;
			let newFilePath = "";

			// 判断是否为图片文件
			const isImage = /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(
				originalFileName
			);

			if (isImage) {
				// 图片文件：放入 images 文件夹并重命名
				newFileName = originalFileName.replace(
					new RegExp(`${designName}`, "g"),
					newDesignName
				);
				newFilePath = `${imagesFolder}/${newFileName}`;

				try {
					// 使用 adapter API 复制二进制文件
					const originalFilePath = file.path;
					await this.app.vault.adapter.copy(
						originalFilePath,
						newFilePath
					);
				} catch (error) {
					new Notice(
						`${t(
							"Cann't copy the source file"
						)}${originalFileName}\n${t("Error Info")}${error}`
					);
				}
			} else {
				// Markdown 文件：直接放在设计文件夹下
				newFileName = originalFileName.replace(
					`-${designName}`,
					`-${newDesignName}`
				);
				newFilePath = `${newDesignPath}/${newFileName}`;

				try {
					const content = await this.app.vault.read(file);
					// 对于 Markdown 文件，替换内容中的设计名称和图片路径
					let newContent = content
						.split(designName)
						.join(newDesignName);

					// 更新图片引用路径
					newContent = newContent.replace(
						/!\[(.*?)\]\((.*?)\)/g,
						(match, alt, path) => {
							// 如果是相对路径的图片引用，更新路径
							if (
								!path.startsWith("http") &&
								!path.startsWith("/")
							) {
								// 提取文件名
								const imgFileName = path.split("/").pop();
								if (imgFileName) {
									// 更新为新的图片路径
									return `![${alt}](images/${imgFileName})`;
								}
							}
							return match;
						}
					);

					await this.app.vault.create(newFilePath, newContent);
				} catch (error) {
					new Notice(
						`${t(
							"Cann't copy the source file"
						)}${originalFileName}\n${t("Error Info")}${error}`
					);
				}
			}
		}
		// 复制 Marp 主题文件
		if (originalMarpThemePath) {
			await this.app.vault.adapter.copy(
				originalMarpThemePath,
				newMarpThemePath
			);

			// 读取并更新主题文件内容
			const themeContent = await this.app.vault.adapter.read(
				newMarpThemePath
			);
			const updatedThemeContent = themeContent
				.replace(
					new RegExp(`sr-design-${designName.toLowerCase()}`, "g"),
					`sr-design-${newDesignName.toLowerCase()}`
				)
				.replace(
					`-${designName.toUpperCase()}.`,
					`-${newDesignName.toUpperCase()}.`
				);
			await this.app.vault.adapter.write(
				newMarpThemePath,
				updatedThemeContent
			);

			await this.vscodeService.addNewMarpThemeForVSCode(
				newDesignName.toLowerCase()
			);
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
