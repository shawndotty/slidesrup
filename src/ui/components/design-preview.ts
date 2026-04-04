import { App } from "obsidian";
import { t } from "src/lang/helpers";
import { DesignPageDraft, ThemeStyleDraft } from "src/types/design-maker";
import { renderBlockContent } from "./design-block-renderer";

const DESIGN_MAKER_SLIDE_WIDTH = 1920;
const DESIGN_MAKER_SLIDE_HEIGHT = 1080;

function applySlideBaselineScale(
	slideEl: HTMLElement,
	frameEl: HTMLElement,
	baseWidth: number,
	baseHeight: number,
): void {
	const frameRect = frameEl.getBoundingClientRect();
	if (!frameRect.width || !frameRect.height) return;
	const scale = Math.min(
		frameRect.width / baseWidth,
		frameRect.height / baseHeight,
	);
	slideEl.style.transform = `scale(${scale})`;
	slideEl.style.transformOrigin = "top left";
}

export function renderDesignPreview(options: {
	app: App;
	container: HTMLElement;
	page: DesignPageDraft;
	theme: ThemeStyleDraft;
	presentationCss?: string;
	selectedBlockId: string | null;
	showTitle?: boolean;
	previewScale?: number;
	slideBaseWidth?: number;
	slideBaseHeight?: number;
}): void {
	const {
		app,
		container,
		page,
		theme,
		presentationCss = "",
		selectedBlockId,
		showTitle = true,
		previewScale = 100,
		slideBaseWidth = DESIGN_MAKER_SLIDE_WIDTH,
		slideBaseHeight = DESIGN_MAKER_SLIDE_HEIGHT,
	} = options;
	container.empty();

	if (showTitle) {
		container.createEl("h3", {
			text: t("Live Preview"),
			cls: "slides-rup-design-maker-section-title",
		});
	}

	const frame = container.createDiv("slides-rup-design-maker-preview-frame");
	frame.style.aspectRatio = `${slideBaseWidth} / ${slideBaseHeight}`;
	const preview = frame.createDiv("slides-rup-design-maker-preview");
	preview.style.width = `${slideBaseWidth}px`;
	preview.style.height = `${slideBaseHeight}px`;
	preview.style.setProperty("--sr-dm-primary", theme.primaryColor);
	preview.style.setProperty("--sr-dm-secondary", theme.secondaryColor);
	preview.style.setProperty("--sr-dm-background", theme.backgroundColor);
	preview.style.setProperty("--sr-dm-text", theme.textColor);
	preview.style.setProperty("--sr-dm-heading-font", theme.headingFont);
	preview.style.setProperty("--sr-dm-body-font", theme.bodyFont);
	preview.classList.toggle("is-dark", theme.mode === "dark");
	if (presentationCss.trim()) {
		const styleEl = preview.createEl("style");
		styleEl.textContent = presentationCss;
	}
	if (theme.rawCss.trim()) {
		const styleEl = preview.createEl("style");
		styleEl.textContent = theme.rawCss;
	}

	page.blocks.forEach((block) => {
		if (block.type === "raw") {
			const raw = preview.createDiv("slides-rup-design-maker-preview-raw");
			const result = renderBlockContent(raw, block.raw, {
				app,
				sourcePath: page.filePath,
			});
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
		el.setAttr("data-block-id", block.id);
		if (block.id === selectedBlockId) el.addClass("is-selected");
		el.style.left = `${block.rect.x}%`;
		el.style.top = `${block.rect.y}%`;
		el.style.width = `${block.rect.width}%`;
		el.style.height = `${block.rect.height}%`;
		if (block.className.trim()) el.addClass(...block.className.trim().split(/\s+/));
		if (block.style.trim()) el.style.cssText += `;${block.style}`;
		const result = renderBlockContent(el, block.content, {
			app,
			sourcePath: page.filePath,
		});
		if (result.hidden) {
			el.remove();
			return;
		}
		if (!result.rendered) {
			el.setText(result.textContent);
		}
	});
	applySlideBaselineScale(preview, frame, slideBaseWidth, slideBaseHeight);
	const appliedScale = Number.isFinite(previewScale) ? previewScale / 100 : 1;
	preview.style.transform += ` scale(${appliedScale})`;
}
