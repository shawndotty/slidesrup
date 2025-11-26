import { App, Editor, Notice, TFile, moment, TFolder } from "obsidian";
import { t } from "../lang/helpers";
export class NoteMaker {
	private app: App;
	constructor(app: App) {
		this.app = app;
	}

	/**
	 * 移除当前打开笔记中的所有以 %% 开头和结尾的注释内容
	 * 支持多行注释
	 */
	async removeCommentBlocks(): Promise<string> {
		const editor = this.app.workspace.activeEditor?.editor;
		if (!editor) {
			new Notice("没有活动的编辑器。请先打开一个文件。");
			return "";
		}

		const content = editor.getValue();
		// 使用正则表达式匹配所有 %% ... %% 注释块（包括多行）
		// [\s\S] 匹配包括换行符在内的所有字符，*? 是非贪婪匹配
		const commentBlockRegex = /%%[\s\S]*?%%/g;
		const cleanedContent = content.replace(commentBlockRegex, "");

		return cleanedContent;
	}

	/**
	 * 在当前打开的笔记所在的位置创建一个新的笔记
	 * 新笔记的名字为当前笔记的名字加上后缀 "-withoutComments"
	 * 新笔记的内容为 removeCommentBlocks 返回的内容
	 */
	async createNoteWithoutComments(): Promise<void> {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || !(activeFile instanceof TFile)) {
			new Notice("没有活动的笔记。请先打开一个文件。");
			return;
		}

		// 获取文件名（不含扩展名）和文件夹路径
		const basename = activeFile.basename;
		const folderPath = activeFile.parent?.path || "";

		// 获取清理后的内容
		const contentWithoutComments = await this.removeCommentBlocks();
		const cleanedContent = this.removeTrailingSpaces(
			contentWithoutComments
		);

		// 构建新文件路径
		const newFileName = `${basename}-${t("WithoutComments")}.md`;
		const newFilePath = folderPath
			? `${folderPath}/${newFileName}`
			: newFileName;

		try {
			const existingFile =
				this.app.vault.getAbstractFileByPath(newFilePath);
			if (existingFile && existingFile instanceof TFile) {
				// 文件已存在，覆盖写入内容
				await this.app.vault.modify(existingFile, cleanedContent);
				new Notice(`${t("NoteUpdated")}${newFileName}`);
			} else {
				// 不存在则创建新文件
				const newFile = await this.app.vault.create(
					newFilePath,
					cleanedContent
				);
				new Notice(`${t("NoteCreated")}${newFileName}`);
			}
		} catch (error) {
			new Notice(`${t("FailedToCreateOrUpdateNote")}${error}`);
		}
	}

	/**
	 * 移除提供的内容中每一行的 trailing space（行尾空格）
	 * @param content 要处理的内容
	 * @returns 移除行尾空格后的内容
	 */
	removeTrailingSpaces(content: string): string {
		// 使用正则表达式匹配每行末尾的空白字符（包括空格和制表符）
		// $ 表示行尾，m 标志表示多行模式
		return content.replace(/[ \t]+$/gm, "");
	}
}
