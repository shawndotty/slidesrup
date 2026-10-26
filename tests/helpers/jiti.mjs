// 统一的 jiti 实例：所有用例文件都从这里 load 源码，保证**同一个模块实例**。
//
// 两个必须写死的配置，改动前先看 docs/plan（Plan-20261026-092649 §3）：
// - `extensions` 把 .ts 排在 .js 前面：src/ 下有 20 个与 .ts 同名的陈旧 .js，
//   jiti 默认 .js 优先，会加载到导出不全的副本（parseThemeDraft 等直接是 undefined）。
// - `alias.src`：源码之间用 baseUrl 绝对路径互相引用（import ... from "src/utils"），
//   jiti 不读 tsconfig，不配 alias 会报 Cannot find module。
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));
const STUB = fileURLToPath(new URL('../stubs/obsidian.mjs', import.meta.url));

// moduleCache 保持默认（true），**不要照抄 text-popup 的 moduleCache: false**：
// YamlStore 是单例，GridTransformer 构造时读它的 options；关掉缓存会让种好的 options
// 落在另一个实例上（options undefined → 构造即抛错）。同一文件共享状态不会污染其它文件，
// 因为 node --test 是一个文件一个子进程。
export const jiti = createJiti(import.meta.url, {
	extensions: ['.ts', '.js', '.mjs', '.cjs', '.json'],
	alias: {
		obsidian: STUB,
		src: SRC,
	},
});

/** 按 src 相对路径加载模块（省略 .ts），例如 load('utils/index')。 */
export const load = (path) => jiti.import(`${SRC}${path}.ts`);
