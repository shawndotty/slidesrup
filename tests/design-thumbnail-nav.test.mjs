/**
 * `src/ui/components/design-thumbnail-nav.ts` 的索引/虚拟窗口用例。
 *
 * 缩略图导航有两件事必须在单测里锁住：
 * 1. 键盘索引的**边界语义**——到头是夹住还是环绕，取决于 wrap 参数，错了就是「按一次跳两页」；
 * 2. 虚拟窗口的**区间计算**——页数过阈值后只渲染窗口内的项，算错就会白屏或漏页。
 *
 * 已知口径：`formatThumbnailBlockCount` 输出的是硬编码英文 "N blocks"，没有走 i18n。
 */

import './helpers/setup.mjs';

import assert from 'node:assert/strict';
import test from 'node:test';

import { load } from './helpers/jiti.mjs';

const nav = await load('ui/components/design-thumbnail-nav');

/* ── getNextThumbnailIndex ─────────────────────────────── */

test('getNextThumbnailIndex: 常规前后移动', () => {
	assert.equal(
		nav.getNextThumbnailIndex({ currentIndex: 2, direction: 1, total: 5 }),
		3,
	);
	assert.equal(
		nav.getNextThumbnailIndex({ currentIndex: 2, direction: -1, total: 5 }),
		1,
	);
});

test('getNextThumbnailIndex: 不环绕时在两端夹住', () => {
	assert.equal(
		nav.getNextThumbnailIndex({ currentIndex: 4, direction: 1, total: 5 }),
		4,
	);
	assert.equal(
		nav.getNextThumbnailIndex({ currentIndex: 0, direction: -1, total: 5 }),
		0,
	);
});

test('getNextThumbnailIndex: 环绕时从两端反向跳', () => {
	assert.equal(
		nav.getNextThumbnailIndex({
			currentIndex: 4,
			direction: 1,
			total: 5,
			wrap: true,
		}),
		0,
	);
	assert.equal(
		nav.getNextThumbnailIndex({
			currentIndex: 0,
			direction: -1,
			total: 5,
			wrap: true,
		}),
		4,
	);
});

test('getNextThumbnailIndex: total 非法返回 -1', () => {
	assert.equal(
		nav.getNextThumbnailIndex({ currentIndex: 0, direction: 1, total: 0 }),
		-1,
	);
});

test('getNextThumbnailIndex: 越界索引按方向归位到首/尾', () => {
	assert.equal(
		nav.getNextThumbnailIndex({ currentIndex: 9, direction: 1, total: 5 }),
		0,
	);
	assert.equal(
		nav.getNextThumbnailIndex({ currentIndex: -1, direction: -1, total: 5 }),
		4,
	);
});

/* ── computeThumbnailVirtualWindow ─────────────────────── */

test('computeThumbnailVirtualWindow: total 为 0 返回空窗口', () => {
	assert.deepEqual(
		nav.computeThumbnailVirtualWindow({
			total: 0,
			containerWidth: 600,
			scrollLeft: 0,
		}),
		{ virtualized: false, start: 0, end: 0, totalWidth: 0 },
	);
});

test('computeThumbnailVirtualWindow: 未过阈值时全量渲染', () => {
	const result = nav.computeThumbnailVirtualWindow({
		total: 10,
		containerWidth: 600,
		scrollLeft: 0,
	});

	assert.equal(result.virtualized, false);
	assert.equal(result.start, 0);
	assert.equal(result.end, 10);
	// 10 × 140 + 9 × 8
	assert.equal(result.totalWidth, 1472);
});

test('computeThumbnailVirtualWindow: 过阈值后按可视区 + overscan 取窗口', () => {
	const result = nav.computeThumbnailVirtualWindow({
		total: 100,
		containerWidth: 600,
		scrollLeft: 0,
	});

	assert.equal(result.virtualized, true);
	assert.equal(result.start, 0);
	// stride 148 → ceil(600/148) = 5 项可视 + 4 项 overscan
	assert.equal(result.end, 9);
	// 100 × 140 + 99 × 8
	assert.equal(result.totalWidth, 14792);
});

test('computeThumbnailVirtualWindow: 滚动后窗口前移并保留前置 overscan', () => {
	const result = nav.computeThumbnailVirtualWindow({
		total: 100,
		containerWidth: 600,
		scrollLeft: 1480, // 第 10 项起始
	});

	assert.equal(result.start, 6); // 10 - overscan(4)
	assert.equal(result.end, 19); // 10 + 5 + 4
});

test('computeThumbnailVirtualWindow: 负 scrollLeft 与非法宽度按 0 处理', () => {
	const negative = nav.computeThumbnailVirtualWindow({
		total: 100,
		containerWidth: 600,
		scrollLeft: -100,
	});
	assert.equal(negative.start, 0);

	const noWidth = nav.computeThumbnailVirtualWindow({
		total: 100,
		containerWidth: Number.NaN,
		scrollLeft: 0,
	});
	// 可视数至少 1（Math.max(1, ...)）
	assert.equal(noWidth.end, 5);
});

test('computeThumbnailVirtualWindow: 自定义阈值与尺寸生效', () => {
	const result = nav.computeThumbnailVirtualWindow({
		total: 4,
		containerWidth: 300,
		scrollLeft: 0,
		threshold: 3,
		itemWidth: 100,
		gap: 0,
		overscan: 0,
	});

	assert.equal(result.virtualized, true);
	assert.equal(result.start, 0);
	assert.equal(result.end, 3); // ceil(300/100) = 3
	assert.equal(result.totalWidth, 400);
});

/* ── formatThumbnailBlockCount ─────────────────────────── */

test('formatThumbnailBlockCount: 正常计数', () => {
	assert.equal(nav.formatThumbnailBlockCount(5), '5 blocks');
	assert.equal(nav.formatThumbnailBlockCount(0), '0 blocks');
});

test('formatThumbnailBlockCount: 负数与非数字归零，小数取整', () => {
	assert.equal(nav.formatThumbnailBlockCount(-3), '0 blocks');
	assert.equal(nav.formatThumbnailBlockCount(3.7), '3 blocks');
	assert.equal(nav.formatThumbnailBlockCount(Number.NaN), '0 blocks');
});
