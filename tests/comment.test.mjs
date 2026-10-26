/**
 * `src/comment.ts` 的用例。
 *
 * 历史背景（Plan-20261026-092649 §6 / Plan-20261026-094800 §2）：`.element:` / `.slide:` 注释
 * 曾经**一条都解析不出来**——`Properties.getAttribute()` 缺失时返回空串（不是 undefined），
 * 而各 transformer 的守卫写的是 `if (value != undefined)`，`"" != undefined` 恒真 →
 * FragmentTransformer 反复 addAttribute → 重新跑整条链 → RangeError 被 parseComment 的
 * try/catch 吞成 null，表现为「注释静默失效」。
 *
 * `getAttribute` 已改为缺失返回 undefined，下面三条注释解析 / 构造 / 往返用例因此转正，
 * 同时充当这次语义修复的回归门禁（改回 `|| ""` 会立刻变红）。
 */

import './helpers/setup.mjs';

import assert from 'node:assert/strict';
import test from 'node:test';

import { load } from './helpers/jiti.mjs';

const { Comment, CommentParser } = await load('comment');

const parser = new CommentParser();

/* ── 可稳定断言：注释识别 ──────────────────────────────── */

test('lineHasComment: 认识 .element / .slide 两种目标', () => {
	assert.equal(parser.lineHasComment('<!-- .element: class="x" -->'), true);
	assert.equal(parser.lineHasComment('<!-- .slide: bg="red" -->'), true);
	// 点号可省略
	assert.equal(parser.lineHasComment('<!-- element: class="x" -->'), true);
});

test('lineHasComment: 普通文字与其它注释不认', () => {
	assert.equal(parser.lineHasComment('普通文字'), false);
	assert.equal(parser.lineHasComment('<!-- 只是一句备注 -->'), false);
});

test('parseComment: 非法格式返回 null 而不是抛错', () => {
	assert.equal(parser.parseComment('<!-- 只是一句备注 -->'), null);
	assert.equal(parser.parseComment(''), null);
});

/* ── 解析与往返 ───────────────────────────────────────── */

test('parseComment: 解析出 class 属性与目标类型', () => {
	const comment = parser.parseComment('<!-- .element: class="my-class" -->');

	assert.notEqual(comment, null);
	assert.equal(comment.getClasses(), 'my-class');
	assert.equal(comment.type, 'element');
});

test('Comment: 空属性表构造不应抛错', () => {
	const comment = new Comment('element', new Map());

	assert.equal(comment.type, 'element');
});

test('commentToString ⇄ parseComment 往返', () => {
	const original = Comment.of('element', [], ['a', 'b']);
	const text = parser.commentToString(original);
	const reParsed = parser.parseComment(text);

	assert.notEqual(reParsed, null);
	assert.equal(reParsed.getClasses(), 'a b');
});
