/**
 * `src/ui/components/design-canvas.ts` 的缩放/平移数学用例。
 *
 * 这几个函数是画布交互的全部「计算」部分，纯数字进出，不碰 DOM；只要它们对，
 * 缩放倍数、光标锚点、坐标变换的字符串就一定是对的（DOM 之外的部分无法用单测保证，
 * 那部分按仓库约定走真机验证）。
 *
 * 常量口径（来自实现）：zoom 夹取 25%–400%，baseline 取 frame 与 slide 的**较小**缩放比。
 */

import './helpers/setup.mjs';

import assert from 'node:assert/strict';
import test from 'node:test';

import { load } from './helpers/jiti.mjs';

const canvas = await load('ui/components/design-canvas');

const FRAME = { frameWidth: 960, frameHeight: 540 };
const BASE = { baseWidth: 1920, baseHeight: 1080 };

/* ── clampCanvasZoomPercent ────────────────────────────── */

test('clampCanvasZoomPercent: 夹在 25–400 之间', () => {
	assert.equal(canvas.clampCanvasZoomPercent(10), 25);
	assert.equal(canvas.clampCanvasZoomPercent(500), 400);
	assert.equal(canvas.clampCanvasZoomPercent(200), 200);
});

test('clampCanvasZoomPercent: 结果取整', () => {
	assert.equal(canvas.clampCanvasZoomPercent(100.4), 100);
	assert.equal(canvas.clampCanvasZoomPercent(100.6), 101);
});

test('clampCanvasZoomPercent: 非有限值回落到 100', () => {
	assert.equal(canvas.clampCanvasZoomPercent(Number.NaN), 100);
	assert.equal(canvas.clampCanvasZoomPercent(Number.POSITIVE_INFINITY), 100);
});

/* ── computeBaselineScale ──────────────────────────────── */

test('computeBaselineScale: 取 frame/slide 两个方向的较小比', () => {
	// 960/1920 = 0.5，540/1080 = 0.5
	assert.equal(canvas.computeBaselineScale({ ...FRAME, ...BASE }), 0.5);
	// 宽屏时高度成为瓶颈：min(2, 1) = 1
	assert.equal(
		canvas.computeBaselineScale({
			frameWidth: 3840,
			frameHeight: 1080,
			baseWidth: 1920,
			baseHeight: 1080,
		}),
		1,
	);
});

test('computeBaselineScale: 任一尺寸为 0 时退回 1', () => {
	assert.equal(
		canvas.computeBaselineScale({
			frameWidth: 0,
			frameHeight: 540,
			baseWidth: 1920,
			baseHeight: 1080,
		}),
		1,
	);
});

/* ── computeCanvasTransform ────────────────────────────── */

test('computeCanvasTransform: scale = baseline × zoom，并输出 transform 串', () => {
	const result = canvas.computeCanvasTransform({
		...FRAME,
		...BASE,
		zoomPercent: 200,
		panX: 10,
		panY: 20,
	});

	assert.equal(result.scale, 1);
	assert.equal(result.transform, 'translate(10px, 20px) scale(1)');
});

test('computeCanvasTransform: zoom 先夹取再参与计算', () => {
	const result = canvas.computeCanvasTransform({
		...FRAME,
		...BASE,
		zoomPercent: 10, // 被夹到 25
		panX: 0,
		panY: 0,
	});

	assert.equal(result.scale, 0.125);
});

test('computeCanvasTransform: pan 非有限值按 0 处理', () => {
	const result = canvas.computeCanvasTransform({
		...FRAME,
		...BASE,
		zoomPercent: 100,
		panX: Number.NaN,
		panY: Number.POSITIVE_INFINITY,
	});

	assert.equal(result.transform, 'translate(0px, 0px) scale(0.5)');
});

/* ── computePanForZoom ─────────────────────────────────── */

test('computePanForZoom: 以光标为锚点放大，光标下的点保持不动', () => {
	// 放大 2 倍：pan' = cursor - 2 × (cursor - pan)
	const result = canvas.computePanForZoom({
		cursorX: 100,
		cursorY: 100,
		panX: 0,
		panY: 0,
		currentScale: 1,
		nextScale: 2,
	});

	assert.deepEqual(result, { panX: -100, panY: -100 });
});

test('computePanForZoom: 比例不变时 pan 不变', () => {
	const result = canvas.computePanForZoom({
		cursorX: 100,
		cursorY: 50,
		panX: 7,
		panY: 9,
		currentScale: 2,
		nextScale: 2,
	});

	assert.deepEqual(result, { panX: 7, panY: 9 });
});

test('computePanForZoom: currentScale 非法时原样返回', () => {
	const result = canvas.computePanForZoom({
		cursorX: 100,
		cursorY: 100,
		panX: 3,
		panY: 4,
		currentScale: 0,
		nextScale: 2,
	});

	assert.deepEqual(result, { panX: 3, panY: 4 });
});

/* ── resolveHostDocument ───────────────────────────────── */

test('resolveHostDocument: 优先用容器的 ownerDocument', () => {
	const doc = { name: 'popout' };
	assert.equal(canvas.resolveHostDocument({ ownerDocument: doc }), doc);
});

test('resolveHostDocument: 容器没有 ownerDocument 时回落全局 document', () => {
	// 测试环境没有全局 document，此时返回空对象而不是抛错
	const fallback = canvas.resolveHostDocument({});
	assert.equal(typeof fallback, 'object');
});
