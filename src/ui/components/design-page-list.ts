import { t } from "src/lang/helpers";
import { DesignDraft, DesignPageType } from "src/types/design-maker";

export function renderDesignPageList(options: {
	container: HTMLElement;
	draft: DesignDraft;
	activePageType: DesignPageType;
	onSelect: (pageType: DesignPageType) => void;
}): void {
	const { container, draft, activePageType, onSelect } = options;
	container.empty();

	container.createEl("h3", {
		text: `${t("Design Pages")} - ${draft.designName}`,
		cls: "slides-rup-design-maker-section-title",
	});

	Object.values(draft.pages).forEach((page) => {
		const button = container.createEl("button", {
			text: page.label,
			cls: "slides-rup-design-maker-page-item",
		});
		if (page.type === activePageType) {
			button.addClass("is-active");
		}
		if (page.hasUnsupportedContent) {
			button.addClass("has-warning");
			button.setAttr("aria-label", t("Contains source only blocks"));
		}
		button.addEventListener("click", () => onSelect(page.type));
	});
}
