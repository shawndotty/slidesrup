import { CommentParser } from "src/comment";
import { ObsidianUtils } from "../../utils/obsidianUtils";
import { Options } from "../../types";
import { FootnoteProcessor } from "./footnote-processor";
import { MultipleFileProcessor } from "./multiple-file-processor";

export class TemplateProcessor {
	private multipleFileProcessor: MultipleFileProcessor;
	private footnoteProcessor: FootnoteProcessor;

	private emptySlideCommentRegex = /<!--\s*(?:\.)?slide(?::)?\s*-->/g;
	private templateCommentRegex =
		/<!--\s*(?:\.)?slide.*(template="\[\[([^\]]+)\]\]"\s*).*-->/;
	private propertyRegex = /:::\s([^\n]+)\s*([\s\S]*?:::[^\n]*)/g;

	// 这个正则表达式用于匹配HTML注释格式的slide标记
	// 可以匹配如下格式:
	// <!-- slide -->
	// <!-- .slide -->
	// <!-- slide something -->
	// <!-- .slide something -->
	private slideCommentRegex = /<!--\s*(?:\.)?slide.*-->/;

	private optionalRegex = /<%\?.*%>/g;

	private utils: ObsidianUtils;
	private parser = new CommentParser();

	constructor(utils: ObsidianUtils) {
		this.utils = utils;
		this.multipleFileProcessor = new MultipleFileProcessor(utils);
		this.footnoteProcessor = new FootnoteProcessor();
	}

	process(markdown: string, options: Options) {
		let input = markdown;

		if (options.defaultTemplate != null) {
			markdown
				.split(new RegExp(options.separator, "gmi"))
				.map((slidegroup) => {
					return slidegroup
						.split(new RegExp(options.verticalSeparator, "gmi"))
						.map((slide) => {
							if (this.slideCommentRegex.test(slide)) {
								const [slideAnnotation] =
									this.slideCommentRegex.exec(slide)!;
								const comment =
									this.parser.parseLine(slideAnnotation);
								if (
									comment &&
									!comment.hasAttribute("template")
								) {
									comment.addAttribute(
										"template",
										options.defaultTemplate,
										false
									);
								}
								input = input
									.split(slide)
									.join(
										slide
											.split(slideAnnotation)
											.join(
												comment
													? this.parser.commentToString(
															comment
													  )
													: slideAnnotation
											)
									);
							} else {
								input = input
									.split(slide)
									.join(
										`<!-- slide template="${options.defaultTemplate}" -->\n` +
											slide
									);
							}
							return slide;
						})
						.join(options.verticalSeparator);
				})
				.join(options.separator);
		}

		let output = input;

		input
			.split(new RegExp(options.separator, "gmi"))
			.map((slidegroup) => {
				return slidegroup
					.split(new RegExp(options.verticalSeparator, "gmi"))
					.map((slide) => {
						if (this.templateCommentRegex.test(slide)) {
							try {
								// eslint-disable-next-line prefer-const
								let [md, notes] = this.extractNotes(
									slide,
									options
								);

								let circuitCounter = 0;
								while (this.templateCommentRegex.test(md)) {
									circuitCounter++;
									md = this.transformSlide(md);

									if (circuitCounter > 9) {
										console.log(
											"WARNING: Circuit in template hierarchy detected!"
										);
										break;
									}
								}
								md = md.replace(
									this.emptySlideCommentRegex,
									""
								);
								md = md.trim();
								md = this.computeVariables(md);
								if (notes.length > 0) {
									md += "\n\n" + notes;
								}
								output = output.split(slide).join(md);
								return md;
							} catch (error) {
								console.log(
									"Cannot process template: " + error
								);
								return slide;
							}
						}
						return slide;
					})
					.join(options.verticalSeparator);
			})
			.join(options.separator);
		return output;
	}

	extractNotes(input: string, options: Options): [string, string] {
		let noteSeparator = "note:";
		if (options.notesSeparator && options.notesSeparator.length > 0) {
			noteSeparator = options.notesSeparator;
		}

		const spliceIdx = input.indexOf(noteSeparator);
		if (spliceIdx > 0) {
			return [input.substring(0, spliceIdx), input.substring(spliceIdx)];
		} else {
			return [input, ""];
		}
	}

	transformSlide(slide: string) {
		if (this.templateCommentRegex.test(slide)) {
			const [, templateProperty, file] =
				this.templateCommentRegex.exec(slide)!;
			let fileWithExtension = file;
			if (!fileWithExtension.endsWith(".md")) {
				fileWithExtension = fileWithExtension + ".md";
			}
			let templateContent = this.utils.parseFileSync(
				fileWithExtension,
				null
			);
			if (templateContent == null) {
				return slide;
			}
			templateContent =
				this.multipleFileProcessor.processSync(templateContent);
			templateContent = templateContent
				.split("<% content %>")
				.join(slide.split(templateProperty).join(""));
			return templateContent;
		} else {
			return slide;
		}
	}

	computeVariables(slide: string): string {
		let result = slide;
		this.propertyRegex.lastIndex = 0;

		let m;
		while ((m = this.propertyRegex.exec(slide)) !== null) {
			if (m.index === this.propertyRegex.lastIndex) {
				this.propertyRegex.lastIndex++;
			}

			// eslint-disable-next-line prefer-const
			let [match, name, content] = m;

			if (name.includes("<!--")) {
				name = name.substring(0, name.indexOf("<!--"));
			}

			if (name.trim() == "block") continue;

			content = "::: block\n" + content;
			const optionalName = "<%? " + name.trim() + " %>";
			name = "<% " + name.trim() + " %>";
			result = result
				.split(optionalName)
				.join(content + "\n" + optionalName);
			result = result.split(name).join(content);
			result = result.split(match).join("");
		}
		result = this.footnoteProcessor.transformFootNotes(result);
		//Remove optional template variables
		while ((m = this.optionalRegex.exec(result)) !== null) {
			if (m.index === this.optionalRegex.lastIndex) {
				this.optionalRegex.lastIndex++;
			}
			result = result.split(m[0]).join("");
		}
		return result;
	}
}
