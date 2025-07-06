import { Notice } from "obsidian";
import { NocoDBTable } from "../../types";
import { NocoDBSync } from "./nocodb-sync";
import { t } from "../../lang/helpers";

export class MyObsidian {
	app: any;
	vault: any;
	nocoDBSyncer: NocoDBSync;

	constructor(app: any, nocoDBSyncer: NocoDBSync) {
		this.app = app;
		this.vault = app.vault;
		this.nocoDBSyncer = nocoDBSyncer;
	}

	async onlyFetchFromNocoDB(
		sourceTable: NocoDBTable,
		updateAPIKeyIsValid: boolean = false
	): Promise<string | undefined> {
		if (!updateAPIKeyIsValid) {
			new Notice(
				this.buildFragment(
					t("Your API Key was expired. Please get a new one."),
					"#ff0000"
				),
				4000
			);
			return;
		}

		await this.nocoDBSyncer.createOrUpdateNotesInOBFromSourceTable(
			sourceTable
		);
	}

	/**
	 * 创建一个带有指定文本内容和颜色的文档片段
	 * @param {string} content - 要显示的文本内容
	 * @param {string} color - 文本颜色，支持CSS颜色值（如'#ff0000'、'red'等）
	 * @returns {DocumentFragment} 返回包含样式化文本的文档片段
	 */
	buildFragment(content: string, color: string): DocumentFragment {
		const fragment = document.createDocumentFragment();
		const div = document.createElement("div");
		div.textContent = content;
		div.style.color = color;
		fragment.appendChild(div);
		return fragment;
	}
}
