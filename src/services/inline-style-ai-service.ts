import { requestUrl } from "obsidian";
import { SlidesRupSettings } from "src/types";
import { SecretStoreService } from "./secret-store-service";

export function sanitizeInlineStyleAiOutput(raw: string): string {
	const text = raw
		.replace(/```css/gi, "")
		.replace(/```/g, "")
		.trim();
	if (!text) return "";
	if (/[{}]/.test(text) || /@[a-z-]+/i.test(text)) {
		throw new Error("AI output contains non-inline CSS syntax");
	}
	const declarations = text
		.split(";")
		.map((part) => part.trim())
		.filter(Boolean)
		.filter((part) => /^[a-zA-Z-][\w-]*\s*:\s*.+$/.test(part));
	if (!declarations.length) {
		throw new Error("AI output does not contain valid declarations");
	}
	return `${declarations.join(";\n")};`;
}

export function sanitizeFilterAiOutput(raw: string): string {
	const text = raw
		.replace(/```css/gi, "")
		.replace(/```/g, "")
		.trim()
		.replace(/\s+/g, " ");
	if (!text) {
		throw new Error("AI output does not contain valid filter value");
	}
	if (/[{}@;]/.test(text)) {
		throw new Error("AI output contains invalid filter syntax");
	}
	const normalized = text.replace(/^filter\s*:\s*/i, "").trim();
	if (!normalized) {
		throw new Error("AI output does not contain valid filter value");
	}
	const functionPattern =
		/(blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\(([^()]*)\)/gi;
	const matches = [...normalized.matchAll(functionPattern)];
	if (!matches.length) {
		throw new Error("AI output does not contain valid filter value");
	}
	const rebuilt = matches
		.map((match) => `${match[1]}(${(match[2] || "").trim()})`)
		.join(" ");
	if (!rebuilt.trim() || rebuilt.length !== normalized.length) {
		throw new Error("AI output contains invalid filter syntax");
	}
	return rebuilt;
}

export function sanitizeSvgAiOutput(raw: string): string {
	const text = raw
		.replace(/```svg/gi, "")
		.replace(/```xml/gi, "")
		.replace(/```/g, "")
		.trim();
	if (!text) {
		throw new Error("AI output does not contain valid SVG");
	}
	const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
	if (!svgMatch) {
		throw new Error("AI output does not contain valid SVG");
	}
	const svg = svgMatch[0].trim();
	if (/<script[\s>]/i.test(svg)) {
		throw new Error("AI output contains unsafe SVG content");
	}
	if (/on[a-z]+\s*=/i.test(svg)) {
		throw new Error("AI output contains unsafe SVG content");
	}
	if (/<foreignObject[\s>]/i.test(svg)) {
		throw new Error("AI output contains unsafe SVG content");
	}
	return svg;
}

export class InlineStyleAIService {
	constructor(
		private settings: SlidesRupSettings,
		private secretStoreService: SecretStoreService,
	) {}

	private buildSystemPrompt(): string {
		const customPrompt = (
			this.settings.aiInlineStyleSystemPrompt || ""
		).trim();
		if (customPrompt) return customPrompt;
		return [
			"You are a CSS assistant for inline style declarations.",
			"Return ONLY valid inline CSS declarations, no selectors, no braces, no @rules, no markdown.",
			"Use semicolon-separated declarations.",
			"Include modern CSS when helpful (var(), calc()).",
		].join(" ");
	}

	private buildFilterSystemPrompt(): string {
		const customPrompt = (this.settings.aiFilterSystemPrompt || "").trim();
		if (customPrompt) return customPrompt;
		return [
			"You generate CSS filter values only.",
			"Return ONLY filter value text, no 'filter:' prefix, no semicolon, no markdown, no explanation.",
			"Allow single or combined functions, e.g. blur(2px) saturate(120%).",
		].join(" ");
	}

	private buildSvgSystemPrompt(): string {
		const customPrompt = (this.settings.aiSvgSystemPrompt || "").trim();
		if (customPrompt) return customPrompt;
		return [
			"You generate inline SVG only.",
			"Return ONLY one complete <svg>...</svg>, no markdown, no explanation.",
			"SVG must adapt to Grid container size by using a valid viewBox and width='100%' height='100%'.",
			"SVG must inherit Grid color settings; prefer currentColor for fill/stroke unless user explicitly asks another color.",
			"Do not output script, foreignObject, or any event handler attributes.",
		].join(" ");
	}

	private async callModel(
		systemPrompt: string,
		userPrompt: string,
	): Promise<string> {
		const baseUrl = (this.settings.aiProviderBaseUrl || "").trim();
		const model = (this.settings.aiProviderModel || "").trim();
		if (!baseUrl || !model) {
			throw new Error("AI provider base URL or model is not configured");
		}
		const apiKey = await this.secretStoreService.getAIProviderApiKey();
		if (!apiKey) {
			throw new Error("AI provider API Key is not configured");
		}
		const endpoint = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
		const response = await requestUrl({
			url: endpoint,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				temperature: 0.2,
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: userPrompt },
				],
			}),
		});
		const content =
			response.json?.choices?.[0]?.message?.content?.toString() || "";
		if (!content.trim()) {
			throw new Error("AI returned empty response");
		}
		return content;
	}

	async generateInlineStyle(
		prompt: string,
		currentStyle: string,
	): Promise<string> {
		if (!this.settings.aiInlineStyleEnabled) {
			throw new Error("AI inline style feature is disabled");
		}
		const content = await this.callModel(
			this.buildSystemPrompt(),
			[
				`Current inline style:\n${currentStyle || "(empty)"}`,
				`Requested effect:\n${prompt}`,
			].join("\n\n"),
		);
		return sanitizeInlineStyleAiOutput(content);
	}

	async generateFilterValue(
		prompt: string,
		currentFilter: string,
	): Promise<string> {
		if (!this.settings.aiInlineStyleEnabled) {
			throw new Error("AI inline style feature is disabled");
		}
		const content = await this.callModel(
			this.buildFilterSystemPrompt(),
			[
				`Current filter value:\n${currentFilter || "(empty)"}`,
				`Requested visual effect:\n${prompt}`,
			].join("\n\n"),
		);
		return sanitizeFilterAiOutput(content);
	}

	async generateSvg(prompt: string, currentContent: string): Promise<string> {
		if (!this.settings.aiInlineStyleEnabled) {
			throw new Error("AI inline style feature is disabled");
		}
		const content = await this.callModel(
			this.buildSvgSystemPrompt(),
			[
				`Current block content:\n${currentContent || "(empty)"}`,
				`Requested SVG shape:\n${prompt}`,
			].join("\n\n"),
		);
		return sanitizeSvgAiOutput(content);
	}
}
