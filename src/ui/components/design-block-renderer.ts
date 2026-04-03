export interface BlockRenderResult {
	rendered: boolean;
	hidden: boolean;
	textContent: string;
}

interface PlaceholderMeta {
	icon: string;
	className: string;
	label: string;
}

function stripHtmlComments(content: string): string {
	return content.replace(/<!--[\s\S]*?-->/g, "").trim();
}

function stripStyleBlocks(content: string): string {
	return content.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").trim();
}

function extractSvgMarkup(content: string): string | null {
	const matches = content.match(/<svg[\s\S]*?<\/svg>/gi);
	if (!matches || matches.length === 0) return null;
	return matches.join("\n");
}

function extractImageUrl(content: string): string | null {
	const markdownImageMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
	if (markdownImageMatch?.[1]) return markdownImageMatch[1];
	const obsidianImageMatch = content.match(/!\[\[([^|\]]+)/);
	if (obsidianImageMatch?.[1]) return obsidianImageMatch[1];
	return null;
}

function renderSvg(container: HTMLElement, markup: string): boolean {
	const wrapper = container.createDiv("slides-rup-design-maker-rendered-svg");
	wrapper.innerHTML = markup;
	return true;
}

function renderImage(container: HTMLElement, url: string): boolean {
	const img = container.createEl("img", {
		cls: "slides-rup-design-maker-rendered-image",
	});
	img.src = url;
	img.alt = "";
	return true;
}

function extractPlaceholderTokens(content: string): string[] {
	const matches = content.match(/<%[\s\S]*?%>|\{\{[\s\S]*?\}\}/g) || [];
	return matches.map((item) => item.trim()).filter(Boolean);
}

function normalizePlaceholderLabel(token: string): string {
	return token
		.replace(/^<%\??\s*/, "")
		.replace(/\s*%>$/, "")
		.replace(/^\{\{\s*/, "")
		.replace(/\s*\}\}$/, "")
		.replace(/_/g, " ")
		.trim();
}

function toDisplayPlaceholderLabel(label: string): string {
	if (!label) return "";
	const normalized = label.replace(/\s+/g, " ").trim();
	if (normalized.toLowerCase() === "toc") return "TOC";
	return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function getPlaceholderMeta(token: string): PlaceholderMeta {
	const normalized = normalizePlaceholderLabel(token).toLowerCase();
	if (normalized.includes("content")) {
		return {
			icon: "▣",
			className: "is-layout",
			label: toDisplayPlaceholderLabel(normalizePlaceholderLabel(token)),
		};
	}
	if (
		normalized.includes("toc") ||
		normalized.includes("nav") ||
		normalized.includes("chapter") ||
		normalized.includes("page index")
	) {
		return {
			icon: "☰",
			className: "is-navigation",
			label: toDisplayPlaceholderLabel(normalizePlaceholderLabel(token)),
		};
	}
	if (
		normalized.includes("author") ||
		normalized.includes("presenter") ||
		normalized.includes("date")
	) {
		return {
			icon: "◔",
			className: "is-metadata",
			label: toDisplayPlaceholderLabel(normalizePlaceholderLabel(token)),
		};
	}
	if (
		normalized.includes("tagline") ||
		normalized.includes("logo") ||
		normalized.includes("slogan") ||
		normalized.includes("chapter name") ||
		normalized.includes("slide name")
	) {
		return {
			icon: "✦",
			className: "is-branding",
			label: toDisplayPlaceholderLabel(normalizePlaceholderLabel(token)),
		};
	}
	return {
		icon: "◇",
		className: "is-variable",
		label: toDisplayPlaceholderLabel(normalizePlaceholderLabel(token)),
	};
}

function renderPlaceholders(container: HTMLElement, tokens: string[]): boolean {
	const wrapper = container.createDiv(
		"slides-rup-design-maker-placeholder-stack",
	);
	tokens.forEach((token) => {
		const meta = getPlaceholderMeta(token);
		const chip = wrapper.createDiv(
			`slides-rup-design-maker-placeholder-chip ${meta.className}`,
		);
		chip.createDiv({
			cls: "slides-rup-design-maker-placeholder-icon",
			text: meta.icon,
		});
		chip.createDiv({
			cls: "slides-rup-design-maker-placeholder-label",
			text: meta.label,
		});
	});
	return true;
}

export function renderBlockContent(
	container: HTMLElement,
	content: string,
): BlockRenderResult {
	const contentWithoutComments = stripHtmlComments(content);
	if (!contentWithoutComments) {
		return {
			rendered: false,
			hidden: true,
			textContent: "",
		};
	}

	const normalizedContent = stripStyleBlocks(contentWithoutComments);

	const svgMarkup = extractSvgMarkup(contentWithoutComments);
	if (svgMarkup) {
		return {
			rendered: renderSvg(container, svgMarkup),
			hidden: false,
			textContent: normalizedContent || "",
		};
	}

	if (!normalizedContent) {
		return {
			rendered: false,
			hidden: true,
			textContent: "",
		};
	}

	const imageUrl = extractImageUrl(normalizedContent);
	if (imageUrl) {
		return {
			rendered: renderImage(container, imageUrl),
			hidden: false,
			textContent: normalizedContent,
		};
	}

	const tokens = extractPlaceholderTokens(normalizedContent);
	const remainingText = normalizedContent
		.replace(/<%[\s\S]*?%>|\{\{[\s\S]*?\}\}/g, "")
		.trim();
	if (tokens.length > 0 && !remainingText) {
		return {
			rendered: renderPlaceholders(container, tokens),
			hidden: false,
			textContent: normalizedContent,
		};
	}

	return {
		rendered: false,
		hidden: false,
		textContent: normalizedContent,
	};
}
