export class FragmentProcessor {
	process(markdown: string) {
		return this.transformFragment(markdown);
	}

	transformFragment(markdown: string) {
		// 将所有以+开头的列表项替换为以*开头的列表项
		const lines = markdown.split("\n");
		const processedLines = lines.map((line) => {
			// 匹配以任意数量空格后跟+的行
			const match = line.match(/^(\s*)\+\s/);
			if (match) {
				// 保持原有缩进，将+替换为*
				return `${match[1]}* ${line.slice(match[0].length)}`;
			}
			return line;
		});
		markdown = processedLines.join("\n");
		return markdown;
	}
}
