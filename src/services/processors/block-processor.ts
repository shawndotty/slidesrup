export class BlockProcessor {
	process(markdown: string) {
		return this.transformBlock(markdown);
	}

	transformBlock(markdown: string) {
		// 预编译正则表达式以提高性能
		const blockPatterns = {
			block: new RegExp(":::\\sblock\\s*", "g"),
			cblock: new RegExp(":::\\scblock\\s*", "g"),
			rblock: new RegExp(":::\\srblock\\s*", "g"),
			close: new RegExp(":::", "g"),
		};

		// 使用链式替换减少循环和内存开销
		return markdown
			.replace(blockPatterns.block, '<div class="block">\n\n')
			.replace(blockPatterns.cblock, '<div class="block center">\n\n')
			.replace(blockPatterns.rblock, '<div class="block right">\n\n')
			.replace(blockPatterns.close, "</div>\n\n");
	}

	transformSpecialBlock(markdown: string): string {
		// 预编译正则表达式以提高性能
		const patterns = {
			left: /:::\slblock\s*/g,
			center: /:::\scblock\s*/g,
			right: /:::\srblock\s*/g,
		};

		// 使用链式替换减少循环次数
		return markdown
			.replace(
				patterns.left,
				'::: block <!-- element: class="block left" -->\n\n'
			)
			.replace(
				patterns.center,
				'::: block <!-- element: class="block center" -->\n\n'
			)
			.replace(
				patterns.right,
				'::: block <!-- element: class="block right" -->\n\n'
			);
	}
}
