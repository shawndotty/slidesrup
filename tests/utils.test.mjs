/**
 * `src/utils/index.ts` 的纯函数用例。
 *
 * 这个模块是「外部输入的闸门」：API Key / 邮箱校验决定能不能发起请求，
 * buildFieldNames 决定同步到外部数据库时用哪套列名，getTimeStamp 决定文件名。
 * 三者都是纯计算，不碰 vault、不碰 DOM，所以本文件不需要任何行为桩。
 */

import './helpers/setup.mjs';

import assert from 'node:assert/strict';
import test from 'node:test';

import { load } from './helpers/jiti.mjs';

const { moment } = await import('./stubs/obsidian.mjs');
const utils = await load('utils/index');
const { TFile, TFolder } = await import('./stubs/obsidian.mjs');

/* ── isValidApiKey ─────────────────────────────────────── */

test('isValidApiKey: 恰好 82 字符且含 pat 与点号时通过', () => {
	const key = `pat.${'x'.repeat(78)}`; // 3 + 1 + 78 = 82
	assert.equal(key.length, 82);
	assert.equal(utils.isValidApiKey(key), true);
});

test('isValidApiKey: 长度不足 82 一律拒绝', () => {
	const key = `pat.${'x'.repeat(77)}`; // 81
	assert.equal(key.length, 81);
	assert.equal(utils.isValidApiKey(key), false);
});

test('isValidApiKey: 缺 pat 或缺点号都拒绝', () => {
	assert.equal(utils.isValidApiKey(`abc.${'x'.repeat(79)}`), false);
	assert.equal(utils.isValidApiKey(`pat${'x'.repeat(80)}`), false);
});

test('isValidApiKey: 空值返回 false 而不是抛错', () => {
	assert.equal(utils.isValidApiKey(''), false);
});

/* ── isValidEmail ──────────────────────────────────────── */

test('isValidEmail: 常规邮箱通过', () => {
	assert.equal(utils.isValidEmail('johnny@example.com'), true);
	assert.equal(utils.isValidEmail('user@sub.example.com'), true);
});

test('isValidEmail: 缺 @ 或缺 @ 后的点号都拒绝', () => {
	assert.equal(utils.isValidEmail('no-at-sign.com'), false);
	assert.equal(utils.isValidEmail('abcdefg@abcdefg'), false);
});

test('isValidEmail: 长度小于 10 直接拒绝（代码里的硬下限）', () => {
	assert.equal('a@b.co'.length < 10, true);
	assert.equal(utils.isValidEmail('a@b.co'), false);
});

test('isValidEmail: 顶级域名不足两位拒绝', () => {
	assert.equal(utils.isValidEmail('user@example.c'), false);
});

/* ── getTimeStamp ──────────────────────────────────────── */

test('getTimeStamp: 输出 14 位 YYYYMMDDHHmmSS', () => {
	const stamp = utils.getTimeStamp();
	assert.match(stamp, /^\d{14}$/);
	assert.equal(stamp.slice(0, 4), String(new Date().getFullYear()));
});

/* ── buildFieldNames ───────────────────────────────────── */

test('buildFieldNames: forceDefault 优先于语言设置', () => {
	assert.deepEqual(utils.buildFieldNames(true, 'zh-tw'), {
		title: 'Title',
		subFolder: 'SubFolder',
		content: 'MD',
	});
});

test('buildFieldNames: 显式语言取对应词表', () => {
	assert.deepEqual(utils.buildFieldNames(false, 'zh-tw'), {
		title: 'TitleTW',
		subFolder: 'SubFolderTW',
		content: 'MDTW',
	});
});

test('buildFieldNames: 未知语言回落到 en', () => {
	assert.deepEqual(utils.buildFieldNames(false, 'de'), {
		title: 'TitleEN',
		subFolder: 'SubFolderEN',
		content: 'MDEN',
	});
});

test('buildFieldNames: ob 模式跟随 moment.locale()', () => {
	const original = moment.locale();
	try {
		moment.locale('en');
		assert.equal(utils.buildFieldNames(false, 'ob').title, 'TitleEN');

		moment.locale('zh-cn');
		assert.equal(utils.buildFieldNames(false, 'ob').title, 'Title');
	} finally {
		moment.locale(original);
	}
});

/* ── compareVersions ───────────────────────────────────── */

test('compareVersions: 三段比较与缺失段补 0', () => {
	assert.equal(utils.compareVersions('1.2.3', '1.2.4'), -1);
	assert.equal(utils.compareVersions('1.2.4', '1.2.3'), 1);
	assert.equal(utils.compareVersions('1.2', '1.2.0'), 0);
	assert.equal(utils.compareVersions('2.0.0', '1.9.9'), 1);
});

/* ── 需要 app 桩的两个读取函数 ──────────────────────────── */

test('get_list_items_from_note: 只收列表行并去掉缩进', async () => {
	const app = {
		vault: {
			read: async () => '正文\n- 第一项\n  * 第二项\n1. 第三项\n结尾',
		},
	};
	const items = await utils.get_list_items_from_note(app, new TFile('a.md'));
	assert.deepEqual(items, ['- 第一项', '* 第二项', '1. 第三项']);
});

test('get_tfiles_from_folder: 递归收集并按键路径排序', () => {
	const root = new TFolder('deck');
	const b = new TFile('deck/b.md');
	const a = new TFile('deck/a.md');
	const sub = new TFolder('deck/sub');
	const c = new TFile('deck/sub/c.md');
	sub.children = [c];
	root.children = [b, a, sub];

	const app = {
		vault: {
			getAbstractFileByPath: (path) => (path === 'deck' ? root : null),
		},
	};

	const files = utils.get_tfiles_from_folder(app, 'deck');
	assert.deepEqual(
		files.map((f) => f.path),
		['deck/a.md', 'deck/b.md', 'deck/sub/c.md'],
	);
});
