/**
 * `src/ui/components/design-inspector.ts` 的辅助函数用例。
 *
 * 目前只有 popout 窗口安全的宿主解析（`resolvePickerHost`）。这类函数不碰真实布局，
 * 只决定「弹层挂到哪个 document / 哪个 window」——在 popout 窗口里挂错宿主，
 * 拾色器和下拉面板会跑到主窗口上，表现为「点了没反应」。
 *
 * 后续 B2b 会在这里追加 rect 输入框实时同步、opacity / 背景色 / 边框 / 内边距合成、
 * inspector 词典完整性等用例。
 */

import './helpers/setup.mjs';

import assert from 'node:assert/strict';
import test from 'node:test';

import { load } from './helpers/jiti.mjs';

const inspector = await load('ui/components/design-inspector');

/* ── resolvePickerHost ─────────────────────────────────── */

test('resolvePickerHost: 优先用触发元素的 ownerDocument 及其 defaultView', () => {
	const ownerDocument = { body: {}, defaultView: { innerWidth: 800 } };
	const resolved = inspector.resolvePickerHost({ ownerDocument });

	assert.equal(resolved.hostDocument, ownerDocument);
	assert.equal(resolved.hostWindow, ownerDocument.defaultView);
});
