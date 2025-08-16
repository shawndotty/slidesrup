import { App } from "obsidian";
import { BaseSuggester, SuggesterOption } from "./base-suggester";
import { t } from "../lang/helpers";

export class SlideDesignSuggester extends BaseSuggester {
	constructor(app: App) {
		super(app);
		this.setOptions([
			{ id: "A", name: `1. ${t("Slide Design A")}`, value: "A" },
			{ id: "B", name: `2. ${t("Slide Design B")}`, value: "B" },
			{ id: "C", name: `3. ${t("Slide Design C")}`, value: "C" },
			{ id: "D", name: `4. ${t("Slide Design D")}`, value: "D" },
			{ id: "E", name: `5. ${t("Slide Design E")}`, value: "E" },
			{ id: "F", name: `6. ${t("Slide Design F")}`, value: "F" },
			{ id: "G", name: `7. ${t("Slide Design G")}`, value: "G" },
			{ id: "H", name: `8. ${t("Slide Design H")}`, value: "H" },
		]);
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
