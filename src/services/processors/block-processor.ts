export class BlockProcessor {
	process(markdown: string) {
		return this.transformBlock(markdown);
	}

	transformBlock(markdown: string) {
		markdown = markdown.replace(
			/:::\sblock\s*/g,
			'<div class="block">\n\n'
		);
		markdown = markdown.replace(/:::/g, "</div>\n\n");
		return markdown;
	}
}
