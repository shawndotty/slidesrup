/**
 * `src/transformers/gridTransformer.ts` 的行为用例。
 *
 * grid 属性是用户在设计稿里手写的那部分（`<grid drag="70 140" drop="-32 0">`），
 * 它决定每个块的坐标与对齐。这里**不构造 Properties**：`Properties` 的构造会跑全量
 * transformer 链，其中 FragmentTransformer / BackgroundTransformer 存在已记录的递归缺陷
 * （见 Plan-20261026-092649 §6），会让「只想测网格」的用例被无关缺陷带崩。
 * 所以给 transform() 传一个**只记录副作用**的假元素，断言它写出的 style / class。
 *
 * 依赖 `tests/helpers/setup.mjs` 种下的画布尺寸（1920×1080、center），
 * GridTransformer 构造时就读 YamlStore 的这三个值。
 */

import './helpers/setup.mjs';

import assert from 'node:assert/strict';
import test from 'node:test';

import { load } from './helpers/jiti.mjs';

const { GridTransformer } = await load('transformers/gridTransformer');
const { YamlStore } = await load('yamlStore');

/**
 * 假的 Properties：只实现 GridTransformer 会调用的四个方法，把结果记在 Map/Set 里。
 * 读取语义与真实实现一致：`getAttribute` 缺失时返回空串（**不是 undefined**）。
 */
function fakeElement(attrs = {}) {
	const attributes = new Map(Object.entries(attrs));
	const styles = new Map();
	const classes = new Set();

	const element = {
		getAttribute: (key) => attributes.get(key) ?? '',
		addStyle: (key, value) => {
			styles.set(key, value);
			return element;
		},
		addClass: (name) => {
			classes.add(name);
			return element;
		},
		addAttribute: (key, value) => {
			attributes.set(key, value);
			return element;
		},
		deleteAttribute: (key) => {
			attributes.delete(key);
			return element;
		},
		style: (key) => styles.get(key),
		hasClass: (name) => classes.has(name),
		hasAttribute: (key) => attributes.has(key),
	};

	return element;
}

function transform(attrs) {
	const element = fakeElement(attrs);
	new GridTransformer().transform(element);
	return element;
}

/* ── 相对模式（默认） ──────────────────────────────────── */

test('grid: drag 是块尺寸，drop 是左上角坐标（单位 %）', () => {
	const element = transform({ drag: '5 12', drop: '10 20' });

	assert.equal(element.style('position'), 'absolute');
	assert.equal(element.style('width'), '5%');
	assert.equal(element.style('height'), '12%');
	assert.equal(element.style('left'), '10%');
	assert.equal(element.style('top'), '20%');
	// 相对模式不写 min-height
	assert.equal(element.style('min-height'), undefined);
});

test('grid: 相对模式下 px 输入按画布尺寸折算成百分比', () => {
	// 画布 1920×1080：960px→50%，540px→50%，480px→25%
	const element = transform({
		drag: '960px 540px',
		drop: '480px 540px',
	});

	assert.equal(element.style('width'), '50%');
	assert.equal(element.style('height'), '50%');
	assert.equal(element.style('left'), '25%');
	assert.equal(element.style('top'), '50%');
});

test('grid: drop 用方位词时按剩余空间居中/贴边', () => {
	const element = transform({ drag: '5 40', drop: 'center' });

	// (100-5)/2 = 47.5，(100-40)/2 = 30
	assert.equal(element.style('left'), '47.5%');
	assert.equal(element.style('top'), '30%');
});

test('grid: 缺 drag 时不写任何定位样式（默认值走不到）', () => {
	// 现状：`element.getAttribute("drag") ?? defaultDrop` 里的 defaultDrop 永远用不上——
	// getAttribute 缺失时返回空串（不是 undefined），`"" ?? x` 仍是 ""，
	// 于是 readValues 拿不到宽高、直接返回 undefined。这属于 Plan-20261026-092649 §6
	// 同一族的「空串 vs undefined」问题，此处只锁住现状。
	const element = transform({ drop: '0 0' });

	assert.equal(element.style('width'), undefined);
	assert.equal(element.hasAttribute('drop'), true);
});

test('grid: 非法 drop 不写任何定位样式，属性原样保留', () => {
	const element = transform({ drag: '5 5', drop: 'abc' });

	assert.equal(element.style('position'), undefined);
	assert.equal(element.hasAttribute('drop'), true);
});

test('grid: 解析成功后会删掉 drag / drop 属性', () => {
	const element = transform({ drag: '5 5', drop: '1 1' });

	assert.equal(element.hasAttribute('drag'), false);
	assert.equal(element.hasAttribute('drop'), false);
});

/* ── 绝对模式（absolute="true"） ────────────────────────── */

test('grid: absolute 模式用 px，且补 min-height', () => {
	const element = transform({
		absolute: 'true',
		drag: '300px 400px',
		drop: '100px 200px',
	});

	assert.equal(element.style('width'), '300px');
	assert.equal(element.style('height'), '400px');
	assert.equal(element.style('left'), '100px');
	assert.equal(element.style('top'), '200px');
	assert.equal(element.style('min-height'), '400px');
});

test('grid: absolute 模式下负坐标按「贴另一侧」换算', () => {
	// left = 1920 - 100 - 200 = 1620
	const element = transform({
		absolute: 'true',
		drag: '200px 100px',
		drop: '-100px 0px',
	});

	assert.equal(element.style('left'), '1620px');
});

/* ── 对齐 ─────────────────────────────────────────────── */

test('grid: 有 drop 时默认按列 flex，但 justify-content 被写成空串（已知缺陷）', () => {
	const element = transform({ drag: '5 5', drop: '1 1' });

	assert.equal(element.style('display'), 'flex');
	assert.equal(element.style('flex-direction'), 'column');
	assert.equal(element.style('align-items'), 'center');
	// `getAttribute("justify-content") ?? justifyContent` 中左侧恒为空串（不是 undefined），
	// 于是推导出的 justifyContent 被覆盖成 ""。样式表里这条声明是无效值，会被浏览器丢弃，
	// 表现为「align 推导出的纵向对齐不生效」。与 §6 同源，此处锁住现状。
	assert.equal(element.style('justify-content'), '');
});

test('grid: flow="row" 走横向 flex 并加 flex-even', () => {
	const element = transform({
		drag: '5 5',
		drop: '1 1',
		align: 'left',
		flow: 'row',
	});

	assert.equal(element.style('flex-direction'), 'row');
	assert.equal(element.hasClass('flex-even'), true);
	assert.equal(element.getAttribute('align'), 'left');
});

test('grid: stretch 默认落到 stretch-row，只有显式 flow="col" 才是 stretch-column', () => {
	// 现状：getAlignment 里 `direction = flow ?? "col"`，而缺失流式属性时 flow 是空串，
	// `"" ?? "col"` 仍是 ""，于是所有 `direction == "col"` 分支都进不去，默认走横向语义。
	const withoutFlow = transform({ align: 'stretch' });
	assert.equal(withoutFlow.hasClass('stretch-row'), true);
	assert.equal(withoutFlow.hasClass('stretch-column'), false);

	const withCol = transform({ align: 'stretch', flow: 'col' });
	assert.equal(withCol.hasClass('stretch-column'), true);
});

test('grid: flow="col" 时 align 推导的 align-items 生效', () => {
	const element = transform({ align: 'left', flow: 'col' });

	assert.equal(element.style('flex-direction'), 'column');
	assert.equal(element.style('align-items'), 'flex-start');
	// justify-content 仍被空串覆盖（同上一条缺陷）
	assert.equal(element.style('justify-content'), '');
});

test('grid: 解析后删掉 flow / justify-content 属性', () => {
	const element = transform({
		align: 'left',
		flow: 'row',
		'justify-content': 'space-between',
	});

	assert.equal(element.hasAttribute('flow'), false);
	assert.equal(element.hasAttribute('justify-content'), false);
	// 显式 justify-content 优先于 align 推导出的值
	assert.equal(element.style('justify-content'), 'space-between');
});

/* ── getAlignment 表 ──────────────────────────────────── */

test('getAlignment: 四角在 col / row 下语义不同', () => {
	const transformer = new GridTransformer();

	assert.deepEqual(transformer.getAlignment('topleft', 'col'), [
		'left',
		'flex-start',
		'flex-start',
		undefined,
	]);
	assert.deepEqual(transformer.getAlignment('topleft', 'row'), [
		'left',
		'flex-start',
		'space-evenly',
		undefined,
	]);
	assert.deepEqual(transformer.getAlignment('bottomright', undefined), [
		'right',
		'flex-end',
		'flex-end',
		undefined,
	]);
});

test('getAlignment: stretch / block / 缺省', () => {
	const transformer = new GridTransformer();

	assert.deepEqual(transformer.getAlignment('stretch', 'col'), [
		undefined,
		'center',
		'space-evenly',
		'stretch-column',
	]);
	assert.deepEqual(transformer.getAlignment('block', 'col'), [
		'justify',
		'center',
		'space-evenly',
		undefined,
	]);
	assert.deepEqual(transformer.getAlignment(undefined, 'col'), [
		undefined,
		'center',
		'center',
		undefined,
	]);
});

/* ── 画布不居中（设置项） ──────────────────────────────── */

test('grid: 设置 center=false 时 align-items 被改成 start', () => {
	const original = YamlStore.getInstance().options;
	try {
		YamlStore.getInstance().options = {
			width: 1920,
			height: 1080,
			center: false,
		};
		const element = transform({ drag: '5 5', drop: '1 1' });
		assert.equal(element.style('align-items'), 'start');
	} finally {
		YamlStore.getInstance().options = original;
	}
});
