// 用例文件的第一条 import 写 `import '../helpers/setup.mjs';` 即可拿到这里的环境：
// 1) 全局 app 桩（lang/helpers 的 getAppInstance 需要它有东西可拿）；
// 2) YamlStore 的单例种子——等价于插件 onload 里写入的画布尺寸。
//
// 为什么必须种子：GridTransformer / Comment / Properties 都在构造时读
// YamlStore.getInstance().options.width|height|center，而 options 只有 onload 才写。
import { load } from './jiti.mjs';

globalThis.window ??= globalThis;
globalThis.app ??= {
	plugins: { plugins: {} },
	vault: { getAbstractFileByPath: () => null },
};

const { YamlStore } = await load('yamlStore');
YamlStore.getInstance().options = { width: 1920, height: 1080, center: true };
