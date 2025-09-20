import { ObsidianUtils } from "src/utils/obsidianUtils";

export class ImageProcessor {
	private util: ObsidianUtils;

	private markdownImageRegex =
		/^[ ]{0,3}!\[([^\]]*)\]\((https?.*(?:jpg|png|jpeg|gif|bmp|webp|svg)?[^\)]*)\)/g;

	private obsidianImageRegex =
		/!\[\[(.*?(?:jpg|png|jpeg|gif|bmp|webp|svg)(?:#[^\|\]]*)?)(?:\s*\|?\s*([^\]]*))?\]\]/g;

	constructor(util: ObsidianUtils) {
		this.util = util;
	}

	async process(markdown: string, newSlideLocation: string): Promise<string> {
		return markdown
			.split("\n")
			.map((line) => {
				if (this.obsidianImageRegex.test(line)) {
					return this._transformObsidianImage(line, newSlideLocation);
				}
				if (this.markdownImageRegex.test(line)) {
					return this._transformMarkdownImage(line);
				}
				return line;
			})
			.join("\n");
	}

	private _transformObsidianImage(
		line: string,
		newSlideLocation: string
	): string {
		this.obsidianImageRegex.lastIndex = 0;
		let result = line;
		const matches = [...line.matchAll(this.obsidianImageRegex)];
		if (matches.length === 0) {
			return line;
		}
		for (const m of matches) {
			const [fullMatch, imagePathWithClass = "", sizeText = ""] = m;
			// 先分离图片路径和类名
			let imagePath = imagePathWithClass;
			let classText = "";
			const hashIndex = imagePathWithClass.indexOf("#");
			if (hashIndex !== -1) {
				imagePath = imagePathWithClass.substring(0, hashIndex);
				classText = imagePathWithClass
					.substring(hashIndex + 1)
					.split("|")[0]
					.trim();
			}
			// 处理文件路径
			const filePath = this.util.findFile(imagePath.trim());
			const relativePath = this.util.getRelativePathForTarget(
				filePath,
				newSlideLocation
			);

			const sizeControl = this._getSizeControl(sizeText);
			const altControl = [classText, sizeControl]
				.filter(Boolean)
				.join(" ")
				.trim();

			// 替换原始图片语法为标准 Markdown 图片语法
			result = result.replace(
				fullMatch,
				`![${altControl}](${relativePath})`
			);
		}
		return result;
	}

	private _transformMarkdownImage(line: string): string {
		this.markdownImageRegex.lastIndex = 0;
		const m = this.markdownImageRegex.exec(line);
		if (!m) {
			return line;
		}

		const [, altText = "", url = ""] = m;

		// 提取图片名（去除#和|及其后内容）
		const imageName = altText.split("#")[0].split("|")[0].trim();

		// 提取类名（#后到|前）
		let classControl = "";
		const hashIndex = altText.indexOf("#");
		if (hashIndex !== -1) {
			const afterHash = altText.substring(hashIndex + 1);
			classControl = afterHash.split("|")[0].trim();
		}

		// 提取尺寸（|后内容）
		let sizeText = "";
		const pipeIndex = altText.indexOf("|");
		if (pipeIndex !== -1) {
			sizeText = altText.substring(pipeIndex + 1).trim();
		}

		const sizeControl = this._getSizeControl(sizeText);
		const altControl = [classControl, sizeControl]
			.filter(Boolean)
			.join(" ")
			.trim();

		return `![${[imageName, altControl]
			.filter(Boolean)
			.join(" ")}](${url})`;
	}

	private _getSizeControl(sizeText: string): string {
		// 如果 sizeText 是代表整数的字符串，返回 w:sizeText
		// 如果是用 x 连接的两个代表整数的字符串，返回 w:x前的整数 h:x后的整数
		if (!sizeText || typeof sizeText !== "string") {
			return "";
		}
		const intPattern = /^\d+$/;
		const wxhPattern = /^(\d+)x(\d+)$/i;

		if (intPattern.test(sizeText)) {
			return `w:${sizeText}`;
		} else if (wxhPattern.test(sizeText)) {
			const match = sizeText.match(wxhPattern);
			if (match) {
				const w = match[1];
				const h = match[2];
				return `w:${w} h:${h}`;
			}
		}
		return "";
	}
}
