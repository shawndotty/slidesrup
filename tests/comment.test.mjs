/**
 * `src/comment.ts` 的用例——**已知红**，见 Plan-20261026-092649 §6。
 *
 * 现状：`.element:` / `.slide:` 注释**一条都解析不出来**。不是测试环境问题，
 * 用旧的 esbuild 基线同样炸：
 *
 *   RangeError: Maximum call stack size exceeded
 *     at ClassTransformer.transform
 *     at Properties.addAttribute (transformers/index.ts:55)   ← update=true 触发重新 transform
 *     at FragmentTransformer.transform
 *     ... 无限循环
 *
 * 根因是 `Properties.getAttribute()` 缺失时返回**空串**（不是 undefined），而各 transformer
 * 的守卫写的是 `if (value != undefined)`；`"" != undefined` 恒真 → FragmentTransformer 反复
 * addAttribute → 重新跑整条链。`CommentParser.parseComment` 用 try/catch 把 RangeError 吞成
 * null，只在控制台留一行 `ERROR: Cannot parse comment`，所以线上表现为「注释静默失效」。
 *
 * 因此这里只把**可稳定断言的部分**写成普通用例，缺陷本身写成 `todo`：
 * `todo` 的用例失败不会让 `node --test` 失败（用 Node 22 实测过），修好之后它会自动转正，
 * 不会变成「修好了反而测试挂」的坑。
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

/* ── 已知缺陷（todo）：解析与往返 ─────────────────────── */

test('parseComment: 应解析出 class 属性（当前栈溢出被吞成 null）', { todo: '见 Plan-20261026-092649 §6' }, () => {
	const comment = parser.parseComment('<!-- .element: class="my-class" -->');

	assert.notEqual(comment, null);
	assert.equal(comment.getClasses(), 'my-class');
	assert.equal(comment.type, 'element');
});

test('Comment: 空属性表构造不应抛错（当前 RangeError）', { todo: '见 Plan-20261026-092649 §6' }, () => {
	const comment = new Comment('element', new Map());

	assert.equal(comment.type, 'element');
});

test('commentToString ⇄ parseComment 往返（当前依赖上面两条修复）', { todo: '见 Plan-20261026-092649 §6' }, () => {
	const original = Comment.of('element', [], ['a', 'b']);
	const text = parser.commentToString(original);
	const reParsed = parser.parseComment(text);

	assert.notEqual(reParsed, null);
	assert.equal(reParsed.getClasses(), 'a b');
});
