import { ObsidianUtils } from "src/utils/obsidianUtils";

export class ImageProcessor {
	private util: ObsidianUtils;

	private markdownImageRegex =
		/^[ ]{0,3}!\[([^\]]*)\]\((.*(?:jpg|png|jpeg|gif|bmp|webp|svg)?)\)/g;

	// 这个正则表达式用于匹配Obsidian格式的图片链接，具体分析如下：
	// !\\[\\[ - 匹配Obsidian图片语法的开始标记
	// (.*?(?:jpg|png|jpeg|gif|bmp|webp|svg)) - 捕获组1：匹配图片路径和文件名，文件必须是指定格式
	// (?:#[^\\|\\]]*)?  - 可选的非捕获组：匹配#后面的CSS类名，直到遇到|或]为止
	// (?:\\s*\\|?\\s*([^\\]]*))? - 可选的非捕获组：匹配|后面的替代文本(alt text)
	// \\]\\] - 匹配Obsidian语法的结束标记
	// g - 全局匹配标志
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
					return this._transformMarkdownImage(line, newSlideLocation);
				}
				return line;
			})
			.join("\n");
	}

	private _transformObsidianImage(
		line: string,
		newSlideLocation: string
	): string {
		let result = line;
		console.dir(line);
		// 重置正则表达式的lastIndex,避免多次执行exec时因为lastIndex不为0导致匹配失败
		let m;
		this.obsidianImageRegex.lastIndex = 0;
		while ((m = this.obsidianImageRegex.exec(line)) !== null) {
			if (m.index === this.obsidianImageRegex.lastIndex) {
				this.obsidianImageRegex.lastIndex++;
			}
			const [match, imagePathWithClass, altText] = m;
			// 从图片路径中提取类名和实际路径
			const [imagePath, classText] = imagePathWithClass
				.split("#")
				.map((s) => s.split("|")[0]);
			console.log("imagePath:", imagePath);
			console.log("classText:", classText);
			console.log("altText:", altText);
			result = result.replace(match, match + "<!-- obsidian image -->");
		}
		return result;
	}

	private _transformMarkdownImage(
		line: string,
		newSlideLocation: string
	): string {
		return line + "<!-- markdown image -->";
	}
}
