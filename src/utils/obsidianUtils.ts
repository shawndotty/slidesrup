import { readFileSync } from "fs";
import { App, FileSystemAdapter, resolveSubpath, TFile } from "obsidian";
import * as path from "path";
import { SlidesRupSettings } from "../types";

export class ObsidianUtils {
	private app: App;
	private fileSystem: FileSystemAdapter;
	private settings: SlidesRupSettings;

	private yamlRegex = /^---[\s\S]*?---\n([\s\S]*?)(?:$|---)/;

	constructor(app: App, settings: SlidesRupSettings) {
		this.app = app;
		this.fileSystem = this.app.vault.adapter as FileSystemAdapter;
		this.settings = settings;
	}

	getVaultName(): string {
		return this.app.vault.getName();
	}

	getVaultDirectory(): string {
		return this.fileSystem.getBasePath();
	}

	getPluginDirectory(): string {
		return path.join(
			this.getVaultDirectory(),
			this.app.vault.configDir,
			"plugins/slidesrup/"
		);
	}

	getDistDirectory(): string {
		return path.join(this.getPluginDirectory(), "/dist/");
	}

	getSettings(): SlidesRupSettings {
		return this.settings;
	}

	private getTFile(filename: string): TFile | null {
		if (filename.startsWith("[[") && filename.endsWith("]]")) {
			filename = filename.substring(2, filename.length - 2).trim();
		}

		const allFiles = this.app.vault.getFiles();

		const allHits = allFiles.filter((item) => item.path.contains(filename));

		let file: TFile | null = null;

		// Only one match
		if (allHits.length == 1) {
			file = allHits.first() || null;
		}

		// Find file most similar to search term
		if (!file && allHits.length > 1) {
			let score = 0;
			for (const hit of allHits) {
				const currentScore = this.similarity(filename, hit.path);
				if (currentScore > score) {
					score = currentScore;
					file = hit;
				}
			}
		}

		return file;
	}

	getAbsolutePath(relativePath: string): string | null {
		const markdownFile = this.getTFile(relativePath);
		return this.absolute(markdownFile?.path ?? "");
	}

	getRelativePath(path: string): string | null {
		if (path == null) {
			return null;
		}
		const file = this.getTFile(path);
		return file?.path || "";
	}

	getRelativePathForTarget(path: string, target: string): string {
		// path 是文件A的绝对路径，target 是一个文件夹的绝对路径
		// 目标：返回 path 相对于 target 的相对路径
		if (!path || !target) {
			return "";
		}
		// 兼容 Obsidian 的路径分隔符（一般为 /）
		const sep = "/";
		const from = target.endsWith(sep) ? target : target + sep;
		const to = path;

		// 分割路径为数组
		const fromArr = from.split(sep).filter(Boolean);
		const toArr = to.split(sep).filter(Boolean);

		// 找到共同前缀
		let i = 0;
		while (
			i < fromArr.length &&
			i < toArr.length &&
			fromArr[i] === toArr[i]
		) {
			i++;
		}

		// 需要返回的上级目录数
		const upLevels = fromArr.length - i;
		let relPath = "";
		if (upLevels > 0) {
			relPath = Array(upLevels).fill("..").join(sep);
			if (relPath) relPath += sep;
		}
		// 拼接剩余部分
		relPath += toArr.slice(i).join(sep);

		return relPath;
	}

	absolute(relativePath: string) {
		if (relativePath) return this.fileSystem.getFullPath(relativePath);
		else {
			return null;
		}
	}

	findFile(path: string) {
		let base = "";

		const file = this.getTFile(path);
		if (file) {
			return base + file.path;
		} else {
			return path;
		}
	}

	async parseFile(filename: string, header: string) {
		const tfile = this.getTFile(filename);

		if (!tfile) {
			return null;
		}

		// 检查文件是否存在
		if (!tfile) {
			console.error("文件不存在");
			return null;
		}

		// 使用 Obsidian API 获取文件内容
		const fileContent = await this.app.vault.read(tfile);

		if (!header) {
			if (this.yamlRegex.test(fileContent)) {
				const match = this.yamlRegex.exec(fileContent);
				return match ? match[1] : fileContent;
			} else {
				return fileContent;
			}
		} else {
			const cache = this.app.metadataCache.getFileCache(tfile);
			const resolved = cache ? resolveSubpath(cache, header) : null;

			if (resolved && resolved.start && resolved.start.line != null) {
				if (resolved.end && resolved.end.line != null) {
					return this.substring(
						fileContent,
						resolved.start.line,
						resolved.start.col,
						resolved.end.line,
						resolved.end.col
					);
				} else {
					return this.substring(
						fileContent,
						resolved.start.line,
						resolved.start.col,
						-1,
						-1
					);
				}
			} else {
				return "![[" + filename + "#" + header + "]]";
			}
		}
	}

	parseFileSync(filename: string, header: string | null) {
		const tfile = this.getTFile(filename);

		if (!tfile) {
			return null;
		}

		// 通过适配器获取绝对路径并同步读取
		const abs = this.fileSystem.getFullPath(tfile.path);
		const fileContent = readFileSync(abs, { encoding: "utf-8" });

		if (!header) {
			if (this.yamlRegex.test(fileContent)) {
				const match = this.yamlRegex.exec(fileContent);
				return match ? match[1] : fileContent;
			} else {
				return fileContent;
			}
		} else {
			const cache = this.app.metadataCache.getFileCache(tfile);
			const resolved = cache ? resolveSubpath(cache, header) : null;

			if (resolved && resolved.start && resolved.start.line != null) {
				if (resolved.end && resolved.end.line != null) {
					return this.substring(
						fileContent,
						resolved.start.line,
						resolved.start.col,
						resolved.end.line,
						resolved.end.col
					);
				} else {
					return this.substring(
						fileContent,
						resolved.start.line,
						resolved.start.col,
						-1,
						-1
					);
				}
			} else {
				return "[[" + filename + (header ? "#" + header : "") + "]]";
			}
		}
	}

	substring(
		input: string,
		startLine: number,
		startColumn: number,
		endLine: number,
		endColumn: number
	): string {
		let result = "";
		const lines = input.split("\n");

		let eline = lines.length;
		if (endLine > -1) {
			eline = endLine;
		}

		for (let index = startLine; index <= eline; index++) {
			const line = lines[index];
			if (line != null) {
				if (index == startLine) {
					result += line.substring(startColumn) + "\n";
				} else if (index == eline) {
					let endLine = line;
					if (endColumn > -1) {
						endLine = line.substring(0, endColumn);
					}
					if (endLine.includes("^")) {
						endLine = endLine.substring(
							0,
							endLine.lastIndexOf("^")
						);
					}
					result += endLine + "\n";
				} else {
					result += line + "\n";
				}
			}
		}

		return result;
	}

	similarity(s1: string, s2: string): number {
		let longer = s1;
		let shorter = s2;
		if (s1.length < s2.length) {
			longer = s2;
			shorter = s1;
		}
		const longerLength = longer.length;
		if (longerLength == 0) {
			return 1.0;
		}
		return (
			(longerLength - this.editDistance(longer, shorter)) / longerLength
		);
	}

	editDistance(s1: string, s2: string): number {
		s1 = s1.toLowerCase();
		s2 = s2.toLowerCase();

		const costs = [];
		for (let i = 0; i <= s1.length; i++) {
			let lastValue = i;
			for (let j = 0; j <= s2.length; j++) {
				if (i == 0) costs[j] = j;
				else {
					if (j > 0) {
						let newValue = costs[j - 1];
						if (s1.charAt(i - 1) != s2.charAt(j - 1))
							newValue =
								Math.min(
									Math.min(newValue, lastValue),
									costs[j]
								) + 1;
						costs[j - 1] = lastValue;
						lastValue = newValue;
					}
				}
			}
			if (i > 0) costs[s2.length] = lastValue;
		}
		return costs[s2.length];
	}
}
