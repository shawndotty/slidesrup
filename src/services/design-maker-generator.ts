import {
	DesignDraft,
	DesignGridBlock,
	DesignPageDraft,
	ThemeStyleDraft,
} from "src/types/design-maker";

function formatRectValue(value: number): string {
	return `${Math.round(value)}`;
}

function serializeAttributes(block: DesignGridBlock): string {
	const attrs: Record<string, string> = {
		drag: `${formatRectValue(block.rect.width)} ${formatRectValue(block.rect.height)}`,
		drop: `${formatRectValue(block.rect.x)} ${formatRectValue(block.rect.y)}`,
	};

	if (block.className.trim()) attrs.class = block.className.trim();
	if (block.align.trim()) attrs.align = block.align.trim();
	if (block.pad.trim()) attrs.pad = block.pad.trim();
	if (block.style.trim()) attrs.style = block.style.trim();
	if (block.flow.trim()) attrs.flow = block.flow.trim();
	if (block.filter.trim()) attrs.filter = block.filter.trim();
	if (block.justifyContent.trim()) {
		attrs["justify-content"] = block.justifyContent.trim();
	}

	Object.entries(block.extraAttributes).forEach(([key, value]) => {
		if (!attrs[key] && value.trim()) {
			attrs[key] = value.trim();
		}
	});

	return Object.entries(attrs)
		.map(([key, value]) => `${key}="${value}"`)
		.join(" ");
}

function generateGridBlock(block: DesignGridBlock): string {
	return `<grid ${serializeAttributes(block)}>\n${block.content}\n</grid>`;
}

export function generatePageMarkdown(page: DesignPageDraft): string {
	return page.blocks
		.map((block) =>
			block.type === "grid" ? generateGridBlock(block) : block.raw.trim(),
		)
		.filter(Boolean)
		.join("\n\n")
		.trim();
}

export function generateThemeCss(
	theme: ThemeStyleDraft,
	designName: string,
): string {
	const header =
		theme.headerDirectives.length > 0
			? theme.headerDirectives
			: [`/* @theme sr-design-${designName.toLowerCase()} */`, '@import "sr-base"'];

	const generatedCss = `
:root {
	--sr-dm-primary: ${theme.primaryColor};
	--sr-dm-secondary: ${theme.secondaryColor};
	--sr-dm-background: ${theme.backgroundColor};
	--sr-dm-text: ${theme.textColor};
	--sr-dm-heading-font: ${theme.headingFont};
	--sr-dm-body-font: ${theme.bodyFont};
	--sr-dm-heading-scale: ${theme.headingScale};
	--sr-dm-body-scale: ${theme.bodyScale};
	--sr-dm-radius: ${theme.borderRadius}px;
	--sr-dm-shadow-opacity: ${theme.shadowOpacity};
	--sr-dm-mode: ${theme.mode};
}

section,
.reveal section,
.slides section {
	background: var(--sr-dm-background);
	color: var(--sr-dm-text);
	font-family: var(--sr-dm-body-font);
}

h1,
h2,
h3,
h4,
h5,
h6 {
	font-family: var(--sr-dm-heading-font);
	color: var(--sr-dm-primary);
}

.bg-with-back-color {
	background: var(--sr-dm-primary);
	color: #ffffff;
}

.bg-with-front-color {
	background: color-mix(in srgb, var(--sr-dm-background) 90%, var(--sr-dm-secondary) 10%);
	color: var(--sr-dm-text);
	border-radius: var(--sr-dm-radius);
	box-shadow: 0 18px 40px rgba(15, 23, 42, var(--sr-dm-shadow-opacity));
}

.has-dark-background {
	color: #ffffff;
}

.has-light-background {
	color: var(--sr-dm-text);
}
`.trim();

	return `${header.join("\n")}\n\n${generatedCss}\n\n${theme.rawCss.trim()}\n`;
}

export function syncDraftRawMarkdown(draft: DesignDraft): DesignDraft {
	const nextPages = { ...draft.pages };
	Object.values(nextPages).forEach((page) => {
		page.rawMarkdown = generatePageMarkdown(page);
	});
	return {
		...draft,
		pages: nextPages,
	};
}
