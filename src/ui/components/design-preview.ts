import { t } from "src/lang/helpers";
import { DesignPageDraft, ThemeStyleDraft } from "src/types/design-maker";

export function renderDesignPreview(options: {
	container: HTMLElement;
	page: DesignPageDraft;
	theme: ThemeStyleDraft;
	selectedBlockId: string | null;
}): void {
	const { container, page, theme, selectedBlockId } = options;
	container.empty();

	container.createEl("h3", {
		text: t("Live Preview"),
		cls: "slides-rup-design-maker-section-title",
	});

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
			raw.setText(block.raw);
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
		el.setText(block.content);
	});
}
