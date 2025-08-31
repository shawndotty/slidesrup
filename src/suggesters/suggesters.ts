import { App } from "obsidian";
import { BaseSuggester, SuggesterOption } from "./base-suggester";
import { t } from "../lang/helpers";

export class SlideDesignSuggester extends BaseSuggester {
	constructor(app: App, options: SuggesterOption[] = []) {
		super(app);
		this.setOptions(options);
	}
}

export class SlideLocationSuggester extends BaseSuggester {
	constructor(app: App, currentFolder: string, assignedFolder: string) {
		super(app);
		this.setOptions([
			{
				id: "current",
				name: t("Current Folder") + ": " + (currentFolder || "/"),
				value: currentFolder || "/",
			},
			{
				id: "assigned",
				name: t("User Assigned Folder") + ": " + assignedFolder,
				value: assignedFolder,
			},
		]);
	}
}

export class SlideModeSuggester extends BaseSuggester {
	constructor(app: App) {
		super(app);
		this.setOptions([
			{
				id: "light",
				name: t("Light Mode"),
				value: "light",
			},
			{
				id: "dark",
				name: t("Dark Mode"),
				value: "dark",
			},
		]);
	}
}
