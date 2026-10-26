/**
 * `src/transformers/index.ts`（Properties + transformer 链）的用例。
 *
 * 这一组补的是之前最大的验收空缺：`grid-transformer.test.mjs` 用的是**假元素**，
 * 从来没有用例构造过真实的 `Properties`，所以「getAttribute 缺失返回空串」这条语义
 * 缺陷一直没有门禁。这里的期望值对应 Plan-20261026-094800 §2 的修复：缺失即 `undefined`，
 * 于是 `if (value != undefined)` 的守卫、`??` 的兜底、以及「空声明不再写进 style」同时成立。
 *
 * 反向验证（改回 `return this.attributes.get(name) || ""` 应变红）：本文件的
 * 「缺失返回 undefined」「空属性表不写声明」「frag / bg / border / pad / rotate …」会整片挂掉。
 */

import './helpers/setup.mjs';

import assert from 'node:assert/strict';
import test from 'node:test';

import { load } from './helpers/jiti.mjs';

const { Properties } = await load('transformers/index');
const { Comment } = await load('comment');

/** 用属性表构造一次真实 Properties（构造即跑全量 transformer 链）。 */
function build(attrs = {}) {
	return new Properties(new Map(Object.entries(attrs)));
}

test('getAttribute: 缺失时严格等于 undefined（不是空串）', () => {
	const element = build();

	assert.equal(element.getAttribute('missing'), undefined);
	assert.notEqual(element.getAttribute('missing'), '');
	assert.equal(element.hasAttribute('missing'), false);
});

test('getAttribute: 有值时原样返回，空串仍是空串（不发散成 undefined）', () => {
	// 用 transformer 链不认识的自定义属性，避免被消费掉
	const element = build({ foo: 'bar', empty: '' });

	assert.equal(element.getAttribute('foo'), 'bar');
	assert.equal(element.getAttribute('empty'), '');
	// 空串在 hasAttribute 上仍是「有」，语义不被改写
	assert.equal(element.hasAttribute('empty'), true);
});

test('Properties: 空属性表不抛错，且不写任何空声明', () => {
	const element = build();

	assert.equal(element.getClasses(), '');
	assert.equal(element.getStyles(), '');
	assert.equal(element.getAttributes(), '');
});

test('class: 按空格拆成多个类，并删掉原属性', () => {
	const element = build({ class: 'a b' });

	assert.equal(element.getClasses(), 'a b');
	assert.equal(element.hasClass('a'), true);
	assert.equal(element.hasAttribute('class'), false);
});

test('style: 逐条解析成内部 style，再序列化回样式串', () => {
	const element = build({ style: 'color: red; font-size: 20px' });

	assert.equal(element.getStyles(), 'color: red; font-size: 20px');
	assert.equal(element.hasAttribute('style'), false);
});

test('frag: 加 fragment 类并写 data-fragment-index', () => {
	const element = build({ frag: '1' });

	assert.equal(element.hasClass('fragment'), true);
	assert.equal(element.getAttribute('data-fragment-index'), '1');
	assert.equal(element.hasAttribute('frag'), false);
});

test('bg: 浅色 / 深色各挂对应背景类，不写 onTarget 时落 background-color', () => {
	const light = build({ bg: '#ffffff' });
	assert.equal(light.hasClass('has-light-background'), true);
	assert.equal(light.hasClass('has-dark-background'), false);
	assert.equal(light.getStyles(), 'background-color: #ffffff');

	const dark = build({ bg: '#000000' });
	assert.equal(dark.hasClass('has-dark-background'), true);
	assert.equal(dark.hasClass('has-light-background'), false);
});

test('bg + onTarget="slide": 写 data-background-color，且不写内联背景', () => {
	const element = build({ bg: '#ffffff', onTarget: 'slide' });

	assert.equal(element.getAttribute('data-background-color'), '#ffffff');
	assert.equal(element.getStyles(), '');
	// onTarget 是内部标记，不参与序列化
	assert.equal(element.getAttributes(), 'data-background-color="#ffffff"');
});

test('border / pad: 各自落样式并统一补 box-sizing', () => {
	const element = build({ border: '1px solid red', pad: '8px' });

	assert.equal(element.getStyles(), 'padding: 8px; box-sizing: border-box; border: 1px solid red');
	assert.equal(element.hasAttribute('border'), false);
	assert.equal(element.hasAttribute('pad'), false);
});

test('rotate: 无单位自动补 deg，已带deg 不重复补', () => {
	assert.equal(build({ rotate: '45' }).getStyles(), 'transform: rotate(45deg)');
	assert.equal(build({ rotate: '90deg' }).getStyles(), 'transform: rotate(90deg)');
});

test('opacity / filter: 原样映射成同名 CSS 声明', () => {
	const element = build({ opacity: '0.5', filter: 'blur(2px)' });

	assert.equal(element.getStyles(), 'opacity: 0.5; filter: blur(2px)');
	assert.equal(element.hasAttribute('opacity'), false);
	assert.equal(element.hasAttribute('filter'), false);
});

test('animate: 按空格拆成动画类', () => {
	const element = build({ animate: 'fade-in zoom-in' });

	assert.equal(element.hasClass('fade-in'), true);
	assert.equal(element.hasClass('zoom-in'), true);
	assert.equal(element.hasAttribute('animate'), false);
});

test('Comment: 继承 Properties 后类型与 onTarget 标记都成立', () => {
	const comment = new Comment('slide', new Map([['bg', '#000000']]));

	assert.equal(comment.type, 'slide');
	assert.equal(comment.getAttribute('onTarget'), 'slide');
	assert.equal(comment.hasClass('has-dark-background'), true);
});

test('deleteAttribute: 删掉后 getAttribute 回到 undefined', () => {
	const element = build({ 'justify-content': 'center' });

	element.deleteAttribute('justify-content');

	assert.equal(element.getAttribute('justify-content'), undefined);
	assert.equal(element.hasAttribute('justify-content'), false);
});
