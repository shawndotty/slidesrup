import { t } from "src/lang/helpers";
import { DesignPageDraft, ThemeStyleDraft } from "src/types/design-maker";
import { renderBlockContent } from "./design-block-renderer";

export function renderDesignPreview(options: {
	container: HTMLElement;
	page: DesignPageDraft;
	theme: ThemeStyleDraft;
	selectedBlockId: string | null;
	showTitle?: boolean;
}): void {
	const { container, page, theme, selectedBlockId, showTitle = true } = options;
	container.empty();

	if (showTitle) {
		container.createEl("h3", {
			text: t("Live Preview"),
			cls: "slides-rup-design-maker-section-title",
		});
	}

	const preview = container.createDiv("slides-rup-design-maker-preview");
	preview.style.setProperty("--sr-dm-primary", theme.primaryColor);
	preview.style.setProperty("--sr-dm-secondary", theme.secondaryColor);
	preview.style.setProperty("--sr-dm-background", theme.backgroundColor);
	preview.style.setProperty("--sr-dm-text", theme.textColor);
	preview.style.setProperty("--sr-dm-heading-font", theme.headingFont);
	preview.style.setProperty("--sr-dm-body-font", theme.bodyFont);
	preview.classList.toggle("is-dark", theme.mode === "dark");

	page.blocks.forEach((block) => {
		if (block.type === "raw") {
			const raw = preview.createDiv("slides-rup-design-maker-preview-raw");
			const result = renderBlockContent(raw, block.raw);
			if (result.hidden) {
				raw.remove();
				return;
			}
			if (!result.rendered) {
				raw.setText(result.textContent);
			}
			return;
		}
		const el = preview.createDiv("slides-rup-design-maker-preview-block");
		if (block.id === selectedBlockId) el.addClass("is-selected");
		el.style.left = `${block.rect.x}%`;
		el.style.top = `${block.rect.y}%`;
		el.style.width = `${block.rect.width}%`;
		el.style.height = `${block.rect.height}%`;
		if (block.className.trim()) el.addClass(...block.className.trim().split(/\s+/));
		if (block.style.trim()) el.style.cssText += `;${block.style}`;
		const result = renderBlockContent(el, block.content);
		if (result.hidden) {
			el.remove();
			return;
		}
		if (!result.rendered) {
			el.setText(result.textContent);
		}
	});
}
