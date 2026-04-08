import { DesignGridBlock } from "src/types/design-maker";

export function createDuplicatedGridBlock(options: {
	target: DesignGridBlock;
	offset: number;
	idFactory?: () => string;
}): DesignGridBlock {
	const { target, offset, idFactory } = options;
	const nextBlock: DesignGridBlock = {
		...target,
		id: idFactory
			? idFactory()
			: `grid-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
		rect: {
			...target.rect,
			x: Math.min(100 - target.rect.width, target.rect.x + offset),
			y: Math.min(100 - target.rect.height, target.rect.y + offset),
		},
		extraAttributes: {
			...(target.extraAttributes || {}),
		},
	};
	nextBlock.children = [];
	return nextBlock;
}
