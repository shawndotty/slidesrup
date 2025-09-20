import { ObsidianUtils } from "src/utils/obsidianUtils";

export class ImageProcessor {
	private util: ObsidianUtils;

	private markdownImageRegex =
		/^[ ]{0,3}!\[([^\]]*)\]\((.*(?:jpg|png|jpeg|gif|bmp|webp|svg)?)\)/g;
	private obsidianImageRegex =
		/!\[\[(.*?(?:jpg|png|jpeg|gif|bmp|webp|svg))\s*\|?\s*([^\]]*)??\]\]/g;

	constructor(util: ObsidianUtils) {
		this.util = util;
	}

	async process(markdown: string): Promise<string> {
		return markdown
			.split("\n")
			.map((line) => {
				if (this.obsidianImageRegex.test(line)) {
					return this._transformObsidianImage(line);
				}
				if (this.markdownImageRegex.test(line)) {
					return this._transformMarkdownImage(line);
				}
				return line;
			})
			.join("\n");
	}

	private _transformObsidianImage(line: string): string {
		return line + "<!-- obsidian image -->";
	}

	private _transformMarkdownImage(line: string): string {
		return line + "<!-- markdown image -->";
	}
}
