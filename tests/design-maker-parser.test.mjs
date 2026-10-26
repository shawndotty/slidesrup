/**
 * `src/services/design-maker-parser.ts` 的解析/序列化用例。
 *
 * 这层是「设计稿 Markdown ⇄ 结构化 page 数据」的唯一出入口：解析错一个坐标，
 * 画布上就会整体错位，而且用户改过的设计稿会原样存回文件，错一次就是持久化错误。
 * 所以这里优先守两类不变量：
 * 1. 坐标串/输入框的**单位语义**（无单位按 px 补齐、px 与 % 不能互换）；
 * 2. 嵌套 grid 的**解析 → 生成 → 再解析**往返一致（等价旧 harness 的 testNestedGridSerialization）。
 */

import './helpers/setup.mjs';

import assert from 'node:assert/strict';
import test from 'node:test';

import { load } from './helpers/jiti.mjs';

const parser = await load('services/design-maker-parser');
const generator = await load('services/design-maker-generator');

/* ── normalizeCoordinateString ─────────────────────────── */

test('normalizeCoordinateString: 无单位数字补 px', () => {
	assert.equal(parser.normalizeCoordinateString('10 20'), '10px 20px');
	assert.equal(parser.normalizeCoordinateString('-5 0'), '-5px 0px');
});

test('normalizeCoordinateString: 已带单位与小数保持原样', () => {
	assert.equal(parser.normalizeCoordinateString('10px 20%'), '10px 20%');
	assert.equal(parser.normalizeCoordinateString('1.5 2'), '1.5px 2px');
});

test('normalizeCoordinateString: 空串原样返回', () => {
	assert.equal(parser.normalizeCoordinateString(''), '');
});

/* ── formatRectInputValue ──────────────────────────────── */

test('formatRectInputValue: px 带后缀、percent 不带，均四舍五入', () => {
	assert.equal(parser.formatRectInputValue(10.4, 'px'), '10px');
	assert.equal(parser.formatRectInputValue(10.6, 'percent'), '11');
	assert.equal(parser.formatRectInputValue(0, 'percent'), '0');
});

/* ── parseRectInputValue ───────────────────────────────── */

test('parseRectInputValue: 显式单位优先', () => {
	assert.deepEqual(parser.parseRectInputValue('100px'), {
		value: 100,
		rectUnit: 'px',
	});
	assert.deepEqual(parser.parseRectInputValue('50%'), {
		value: 50,
		rectUnit: 'percent',
	});
	// 大小写不敏感
	assert.deepEqual(parser.parseRectInputValue('12PX'), {
		value: 12,
		rectUnit: 'px',
	});
});

test('parseRectInputValue: 无单位时用传入的默认单位', () => {
	assert.deepEqual(parser.parseRectInputValue('42'), {
		value: 42,
		rectUnit: 'percent',
	});
	assert.deepEqual(parser.parseRectInputValue('42', 'px'), {
		value: 42,
		rectUnit: 'px',
	});
});

test('parseRectInputValue: 负数与空白容错', () => {
	assert.deepEqual(parser.parseRectInputValue(' -10px '), {
		value: -10,
		rectUnit: 'px',
	});
});

test('parseRectInputValue: 非法输入返回 null', () => {
	assert.equal(parser.parseRectInputValue('abc'), null);
	assert.equal(parser.parseRectInputValue(''), null);
	assert.equal(parser.parseRectInputValue('   '), null);
});

/* ── parseThemeDraft ───────────────────────────────────── */

test('parseThemeDraft: 读取主题变量并剔除头部指令行', () => {
	const css = [
		'/* @theme my-theme */',
		'@import url("base.css");',
		'.slide {',
		'  --sr-dm-primary: #ff0000;',
		'  --sr-dm-secondary: #00ff00;',
		'  --sr-dm-background: #ffffff;',
		'  --sr-dm-mode: dark;',
		'  --sr-dm-heading-scale: 1.25;',
		'  --sr-dm-radius: 12px;',
		'}',
	].join('\n');

	const draft = parser.parseThemeDraft('MyTheme', css);

	assert.equal(draft.themeName, 'sr-design-mytheme');
	assert.equal(draft.primaryColor, '#ff0000');
	assert.equal(draft.secondaryColor, '#00ff00');
	assert.equal(draft.mode, 'dark');
	assert.equal(draft.headingScale, 1.25);
	// readNumberValue 会去掉单位
	assert.equal(draft.borderRadius, 12);
	assert.deepEqual(draft.headerDirectives, [
		'/* @theme my-theme */',
		'@import url("base.css");',
	]);
	assert.equal(draft.rawCss.includes('@theme'), false);
});

test('parseThemeDraft: 缺变量时用默认值，主色跟随设置', () => {
	const draft = parser.parseThemeDraft('plain', '.slide { color: red; }', {
		slidesRupThemeColor: '#123456',
	});

	assert.equal(draft.primaryColor, '#123456');
	assert.equal(draft.secondaryColor, '#7c3aed');
	assert.equal(draft.textColor, '#111111');
	assert.equal(draft.headingFont, 'inherit');
	assert.equal(draft.headingScale, 1);
	assert.equal(draft.shadowOpacity, 0.18);
	assert.equal(draft.borderRadius, 24);
	assert.equal(draft.mode, 'light');
});

/* ── parseDesignPageDraft：嵌套 grid 往返 ───────────────── */

test('parseDesignPageDraft: 嵌套 grid 的解析 → 生成 → 再解析往返一致', () => {
	const markdown = `<grid drag="70 140" drop="-32 0" class="bg-with-front-color" style="margin-top: -216px" rotate="350">

<grid drag="5 40" drop="97 36" class="bg-with-back-color">

</grid>
</grid>`;

	const draft = parser.parseDesignPageDraft('cover', 'test', 'test.md', markdown);
	assert.equal(draft.blocks.length, 1);

	const outer = draft.blocks[0];
	assert.equal(outer.type, 'grid');
	assert.equal(outer.children.length, 1);

	const inner = outer.children[0];
	assert.deepEqual(inner.rect, { x: 97, y: 36, width: 5, height: 40 });

	const generated = generator.generatePageMarkdown(draft);
	const reParsed = parser.parseDesignPageDraft(
		'cover',
		'test',
		'test.md',
		generated,
	);
	assert.equal(reParsed.blocks.length, 1);
	assert.deepEqual(reParsed.blocks[0].children[0].rect, inner.rect);
});

test('parseDesignPageDraft: 纯文本段落不产生 grid 块（走 raw 分支）', () => {
	const draft = parser.parseDesignPageDraft(
		'content',
		'test',
		'pages/content.md',
		'# 标题\n\n正文段落',
	);

	assert.equal(draft.fileName, 'content.md');
	assert.equal(draft.rectUnit, 'percent');
	assert.equal(
		draft.blocks.every((block) => block.type !== 'grid'),
		true,
	);
});
