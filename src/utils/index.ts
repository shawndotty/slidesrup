import {
	App,
	normalizePath,
	TAbstractFile,
	TFile,
	TFolder,
	Vault,
	moment,
} from "obsidian";

/**
 * 验证API密钥是否有效
 * @param apiKey - 要验证的API密钥
 * @returns 如果API密钥有效返回true，否则返回false
 */
export function isValidApiKey(apiKey: string): boolean {
	return Boolean(
		apiKey &&
			apiKey.length >= 82 &&
			apiKey.includes("pat") &&
			apiKey.includes(".")
	);
}

export function getAppInstance(): App {
	if (typeof window !== "undefined" && (window as any).obsidianApp) {
		return (window as any).obsidianApp as App;
	} else if (typeof window !== "undefined" && (window as any).app) {
		// 兼容旧版本
		return (window as any).app as App;
	} else {
		throw new Error(
			"无法获取 Obsidian App 实例：window.obsidianApp 和 window.app 均未定义"
		);
	}
}

/**
 * 验证邮箱格式是否有效
 * @param email - 要验证的邮箱地址
 * @returns 如果邮箱格式有效返回true，否则返回false
 */
export function isValidEmail(email: string): boolean {
	// 基础格式检查：非空、包含@符号、@后包含点号
	if (
		!email ||
		email.indexOf("@") === -1 ||
		email.indexOf(".", email.indexOf("@")) === -1 ||
		email.length < 10
	) {
		return false;
	}

	// 正则表达式验证（符合RFC 5322标准）
	const emailRegex =
		/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

	return emailRegex.test(email);
}

/**
 * 构建字段名称映射
 * @param forceDefaultFetchFields - 是否强制使用默认获取字段
 * @returns 根据当前语言环境返回相应的字段名称映射
 */
export function buildFieldNames(
	forceDefaultFetchFields: boolean = false,
	obasRunningLanguage = "ob"
) {
	if (forceDefaultFetchFields) {
		return {
			title: "Title",
			subFolder: "SubFolder",
			content: "MD",
		};
	}

	const locale = moment.locale();
	const fieldNamesMap: {
		[key: string]: {
			title: string;
			subFolder: string;
			content: string;
		};
	} = {
		"zh-cn": { title: "Title", subFolder: "SubFolder", content: "MD" },
		en: { title: "TitleEN", subFolder: "SubFolderEN", content: "MDEN" },
		"zh-tw": {
			title: "TitleTW",
			subFolder: "SubFolderTW",
			content: "MDTW",
		},
	};

	if (obasRunningLanguage === "ob") {
		return fieldNamesMap[locale] || fieldNamesMap["en"];
	} else {
		return fieldNamesMap[obasRunningLanguage] || fieldNamesMap["en"];
	}
}

export function resolve_tfolder(app: App, folder_str: string): TFolder {
	folder_str = normalizePath(folder_str);

	const folder = app.vault.getAbstractFileByPath(folder_str);
	if (!folder) {
		throw new Error(`Folder "${folder_str}" doesn't exist`);
	}
	if (!(folder instanceof TFolder)) {
		throw new Error(`${folder_str} is a file, not a folder`);
	}

	return folder;
}

/**
 * 获取当前激活的笔记（TFile）
 * @param app Obsidian 的 App 实例
 * @returns 当前激活的笔记（TFile），如果没有则返回 null
 */
export function get_active_note(app: App): TFile | null {
	const activeFile = app.workspace.getActiveFile();
	if (activeFile instanceof TFile) {
		return activeFile;
	}
	return null;
}

/**
 * 获取当前激活笔记所在的文件夹路径
 * @param app Obsidian 的 App 实例
 * @returns 当前激活笔记所在的文件夹路径，如果没有激活笔记则返回 null
 */
export function get_active_note_folder_path(app: App): string | null {
	const activeNote = get_active_note(app);
	if (!activeNote) {
		return null;
	}
	const parent = app.vault.getAbstractFileByPath(
		activeNote.parent?.path || ""
	);
	if (parent && parent.path) {
		return parent.path;
	}
	return null;
}

/**
 * 获取指定笔记中的所有列表项（如 -、*、1. 开头的行）
 * @param app Obsidian 的 App 实例
 * @param file TFile 实例，表示要读取的笔记
 * @returns 返回一个字符串数组，每个元素为一个列表项内容
 */
export async function get_list_items_from_note(
	app: App,
	file: TFile
): Promise<string[]> {
	const content = await app.vault.read(file);
	const lines = content.split("\n");
	const listItems: string[] = [];

	for (const line of lines) {
		// 匹配无序列表（-、*、+）或有序列表（数字.）
		if (/^\s*([-*+]|[0-9]+\.)\s+/.test(line)) {
			listItems.push(line.trim());
		}
	}

	return listItems;
}

export function get_tfiles_from_folder(
	app: App,
	folder_str: string
): Array<TFile> {
	const folder = resolve_tfolder(app, folder_str);

	const files: Array<TFile> = [];
	Vault.recurseChildren(folder, (file: TAbstractFile) => {
		if (file instanceof TFile) {
			files.push(file);
		}
	});

	files.sort((a, b) => {
		return a.path.localeCompare(b.path);
	});

	return files;
}

export function getTimeStamp() {
	return moment().format("YYYYMMDDHHmmSS");
}

export async function createPathIfNeeded(folderPath: string): Promise<void> {
	const { vault } = this.app;
	const directoryExists = await vault.exists(folderPath);
	if (!directoryExists) {
		await vault.createFolder(normalizePath(folderPath));
	}
}
