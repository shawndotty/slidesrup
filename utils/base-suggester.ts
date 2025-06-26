import { App, FuzzySuggestModal, FuzzyMatch } from "obsidian";

export interface SuggesterOption {
	id: string;
	name: string;
	value: string;
}

export class BaseSuggester extends FuzzySuggestModal<SuggesterOption> {
	protected options: SuggesterOption[] = [];

	constructor(app: App) {
		super(app);
	}

	getItems(): SuggesterOption[] {
		return this.options;
	}

	getItemText(item: SuggesterOption): string {
		return item.name;
	}

	onChooseItem(
		item: SuggesterOption,
		evt: MouseEvent | KeyboardEvent
	): SuggesterOption {
		return item;
	}

	renderSuggestion(
		item: FuzzyMatch<SuggesterOption>,
		el: HTMLElement
	): void {
		el.createEl("div", { text: item.item.name, cls: "suggester-title" });
	}

	setOptions(options: SuggesterOption[]): void {
		this.options = options;
	}
}