import { ObsidianUtils } from "../../utils/obsidianUtils";

export class MultipleFileProcessor {
	private utils: ObsidianUtils;

	private regex = /!\[\[(.*)\]\]/gm;
	private obsidianImageRegex =
		/!\[\[(.*(?:jpg|png|jpeg|gif|bmp|webp|svg))\s*\|?\s*([^\]]*)??\]\]\s?(<!--.*-->)?/i;
	private excalidrawRegex = /(.*\.excalidraw)/i;

	constructor(utils: ObsidianUtils) {
		this.utils = utils;
	}

	async process(markdown: string): Promise<string> {
		const lines = markdown.split("\n");
		const processedLines = await Promise.all(
			lines.map(async (line, index) => {
				if (
					this.regex.test(line) &&
					!this.obsidianImageRegex.test(line)
				) {
					return await this.transformLine(line);
				}
				return line;
			})
		);
		return processedLines.join("\n");
	}

	processSync(markdown: string): string {
		const lines = markdown.split("\n");
		const processedLines = lines.map((line) => {
			if (this.regex.test(line) && !this.obsidianImageRegex.test(line)) {
				return this.transformLineSync(line);
			}
			return line;
		});
		return processedLines.join("\n");
	}

	private transformLineSync(line: string): string {
		let comment = "";
		if (line.includes("<!--")) {
			comment = line.substring(line.indexOf("<!--"));
		}

		let link: string = line
			.replace("![[", "")
			.replace("]]", "")
			.replace(comment, "")
			.trim();
		let header: string = "";

		if (link.includes("#")) {
			const split = link.split("#");
			link = split[0];
			header = split[1];
		}

		const fileName = this.getMarkdownFile(link);

		if (fileName === null) {
			return line;
		}

		const content = this.utils.parseFileSync(fileName, header);

		if (!content) {
			return line;
		}

		return this.processSync(comment ? content + comment : content);
	}

	private async transformLine(line: string) {
		let comment = "";
		if (line.includes("<!--")) {
			comment = line.substring(line.indexOf("<!--"));
		}

		let link: string = line
			.replace("![[", "")
			.replace("]]", "")
			.replace(comment, "")
			.trim();
		let header: string = "";

		if (link.includes("#")) {
			const split = link.split("#");
			link = split[0];
			header = split[1];
		}

		const fileName = this.getMarkdownFile(link);

		if (fileName === null) {
			return line;
		}

		const content = await this.utils.parseFile(fileName, header);

		if (!content) {
			return line;
		}

		// 如果有注释，将注释添加到内容后面再处理
		return await this.process(comment ? content + comment : content);
	}

	private getMarkdownFile(line: string) {
		if (this.excalidrawRegex.test(line)) {
			return null; // Do not import excalidraw files
		}

		let file = line;
		if (!line.toLowerCase().endsWith(".md")) {
			file = file + ".md";
		}
		return file;
	}
}
