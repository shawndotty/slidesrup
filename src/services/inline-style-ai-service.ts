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

	async generateInlineStyle(
		prompt: string,
		currentStyle: string,
	): Promise<string> {
		if (!this.settings.aiInlineStyleEnabled) {
			throw new Error("AI inline style feature is disabled");
		}
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
					{ role: "system", content: this.buildSystemPrompt() },
					{
						role: "user",
						content: [
							`Current inline style:\n${currentStyle || "(empty)"}`,
							`Requested effect:\n${prompt}`,
						].join("\n\n"),
					},
				],
			}),
		});
		const content =
			response.json?.choices?.[0]?.message?.content?.toString() || "";
		if (!content.trim()) {
			throw new Error("AI returned empty response");
		}
		return sanitizeInlineStyleAiOutput(content);
	}
}
