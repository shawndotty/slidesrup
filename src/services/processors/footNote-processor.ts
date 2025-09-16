export class FootnoteProcessor {
	private regex = /\[\^([^\]]*)]/im;

	process(
		markdown: string,
		options: { separator: string; verticalSeparator: string }
	) {
		let output = markdown;

		markdown
			.split(new RegExp(options.separator, "gmi"))
			.map((slidegroup, index) => {
				return slidegroup
					.split(new RegExp(options.verticalSeparator, "gmi"))
					.map((slide, index) => {
						if (this.regex.test(slide)) {
							const newSlide = this.transformFootNotes(slide);
							output = output.replace(slide, newSlide);
							return newSlide;
						}
						return slide;
					})
					.join(options.verticalSeparator);
			})
			.join(options.separator);
		return output;
	}

	transformFootNotes(markdown: string) {
		if (!this.regex.test(markdown)) {
			return markdown;
		}

		let input = markdown;
		let noteIdx = 1;

		const footNotes = new Map();

		let reResult: RegExpExecArray | null;
		while ((reResult = this.regex.exec(input)) !== null) {
			const match = reResult;
			input = input
				.split("\n")
				.map((line, index) => {
					if (line.includes(match[0])) {
						if (line.includes(match[0] + ": ")) {
							if (!footNotes.has(match[1])) {
								footNotes.set(
									match[1],
									line.split(match[0] + ": ")[1]
								);
							}
							return "";
						} else {
							const split = line.split(match[0]);

							let result = split[0].trim();
							result +=
								'<sup id="fnref:' +
								match[1] +
								'" role="doc-noteref">' +
								noteIdx +
								"</sup>";
							result += split[1].trim();

							noteIdx = noteIdx + 1;

							return result;
						}
					}
					return line;
				})
				.join("\n");
		}

		let footNotesBlock = "";
		footNotesBlock += '<div class="footnotes" role="doc-endnotes">\n';
		footNotesBlock += "<ol>\n";

		footNotes.forEach((value, key) => {
			footNotesBlock +=
				'<li id="fn:' +
				key +
				'" role="doc-endnote" class="footnote"><p>\n\n' +
				value +
				"\n\n</p></li>";
		});

		footNotesBlock += "</ol>\n";
		footNotesBlock += "</div>\n\n";

		const footnotePlaceholder = "<%? footnotes %>";

		if (input.includes(footnotePlaceholder)) {
			return input.replace(footnotePlaceholder, footNotesBlock);
		} else {
			return input + "\n" + footNotesBlock;
		}
	}
}
