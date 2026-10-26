// obsidian 只提供 .d.ts（"main" 是空串），没有运行时代码，所以单测必须自己给一份。
// 原则（与仓库内 text-popup / ioto-tasks-center 一致）：**只替边界，不模拟行为**——
// 这里的类不开真实渲染 / 布局 / 事件，用例断言的都是插件自己的纯逻辑。
//
// 必须放在插件目录内：下面的 `moment` 是重导出的真实包，模块解析基准是「本文件所在目录」，
// 放到插件外会解析不到 node_modules/moment。

// Obsidian 运行环境始终有 window；源码里按 lint 规则写 window.xxx，Node 下补一个最小实现。
if (typeof globalThis.window === 'undefined') {
	globalThis.window = globalThis;
}

// 重导出**真实** moment：`utils/index.ts` 用 moment() 打时间戳，`lang/helpers.ts` 用
// moment.locale() 选词典。换成假 moment 会让语言分支与时间戳格式整体失真。
import moment from 'moment';

export { moment };

/* ── 基类 ─────────────────────────────────────────────── */

export class App {}

export class Component {
	constructor() {
		this._children = [];
	}
	addChild(child) {
		this._children.push(child);
		return child;
	}
	removeChild(child) {
		this._children = this._children.filter((c) => c !== child);
	}
	registerEvent() {}
	registerDomEvent() {}
	registerInterval() {}
}

export class Plugin extends Component {}

export class PluginSettingTab {}

export class View extends Component {
	constructor(leaf) {
		super();
		this.leaf = leaf;
	}
	getViewType() {
		return '';
	}
}

export class ItemView extends View {}
export class FileView extends View {}
export class MarkdownView extends View {}

export class Scope {
	register() {}
	unregister() {}
}

export class WorkspaceLeaf extends Component {}

export class Modal {
	constructor(app) {
		this.app = app;
	}
	open() {}
	close() {}
	onOpen() {}
	onClose() {}
}

export class Setting {
	constructor(containerEl) {
		this.containerEl = containerEl;
	}
	setName() {
		return this;
	}
	setDesc() {
		return this;
	}
	setHeading() {
		return this;
	}
	addText() {
		return this;
	}
	addTextArea() {
		return this;
	}
	addToggle() {
		return this;
	}
	addDropdown() {
		return this;
	}
	addButton() {
		return this;
	}
	addExtraButton() {
		return this;
	}
	addSlider() {
		return this;
	}
}

export class Menu {
	addItem() {
		return this;
	}
	addSeparator() {
		return this;
	}
	showAtMouseEvent() {}
	showAtPosition() {}
}

// 源码里 base-suggester.ts 继承 FuzzySuggestModal；缺了这个类会让 slides-maker /
// marp-maker / command-service / design-maker 一连串模块 import 直接抛
// `Class extends value undefined`。（本插件最容易漏的一条）
export class SuggestModal extends Modal {
	setPlaceholder() {}
	getSuggestions() {
		return [];
	}
	renderSuggestion() {}
	onChooseSuggestion() {}
}

export class FuzzySuggestModal extends SuggestModal {
	getItems() {
		return [];
	}
	getItemText() {
		return '';
	}
	onChooseItem() {}
}

/* ── 文件对象 ─────────────────────────────────────────── */

export class TAbstractFile {
	constructor(path = '') {
		this.path = path;
		this.name = path.split('/').pop() ?? '';
		this.parent = null;
	}
}

export class TFile extends TAbstractFile {
	constructor(path = '') {
		super(path);
		this.extension = path.split('.').pop() ?? '';
		this.basename = this.name.replace(/\.[^.]+$/, '');
	}
}

export class TFolder extends TAbstractFile {
	constructor(path = '') {
		super(path);
		this.children = [];
	}
}

export class Vault {
	/** utils/index.ts 的 get_tfiles_from_folder 用它递归；只做遍历，不模拟文件系统。 */
	static recurseChildren(folder, cb) {
		for (const child of folder.children ?? []) {
			cb(child);
			if (child instanceof TFolder) Vault.recurseChildren(child, cb);
		}
	}
}

export class FileSystemAdapter {
	getBasePath() {
		return '';
	}
}

/* ── 编辑器相关（只给类型占位，本批用例不触发） ────────── */

export class Editor {}
export class EditorSuggest {}
export class Command {}
export class Notice {
	constructor(message) {
		this.message = message;
	}
}

/* ── 函数边界 ─────────────────────────────────────────── */

export const Platform = { isMobile: false };

export function setIcon() {}
export function setTooltip() {}

/** 真实实现只处理分隔符；测试不依赖平台的路径规范化细节。 */
export function normalizePath(path) {
	return String(path ?? '')
		.replace(/\\/g, '/')
		.replace(/\/+/g, '/')
		.replace(/^\/+|\/+$/g, '');
}

export function debounce(fn) {
	let timer = null;
	const wrapped = (...args) => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => fn(...args), 0);
	};
	wrapped.cancel = () => {
		if (timer) clearTimeout(timer);
		timer = null;
	};
	return wrapped;
}

export async function requestUrl() {
	throw new Error('requestUrl is not stubbed for tests');
}

export function getAllTags() {
	return null;
}

export function prepareFuzzySearch() {
	return () => null;
}

export function resolveSubpath() {
	return null;
}

export const MarkdownRenderer = {
	render: async () => {},
	renderMarkdown: async () => {},
};
