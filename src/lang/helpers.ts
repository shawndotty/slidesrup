//Solution copied from obsidian-kanban: https://github.com/mgmeyers/obsidian-kanban/blob/44118e25661bff9ebfe54f71ae33805dc88ffa53/src/lang/helpers.ts

import { moment } from "obsidian";
import { getAppInstance } from "src/utils";
import en from "./locale/en";
import zhCN from "./locale/zh-cn";
import zhTW from "./locale/zh-tw";

const localeMap: { [k: string]: Partial<typeof en> } = {
	en,
	"zh-cn": zhCN,
	"zh-tw": zhTW,
};

// 优化语言选择逻辑，简化变量声明与判断
const app = getAppInstance();
const iotoRunningLanguage =
	app.plugins.plugins["obas-assistant"]?.settings?.obasRunningLanguage ??
	"ob";

const lang =
	iotoRunningLanguage === "ob" ? moment.locale() : iotoRunningLanguage;
const locale = localeMap[lang] ?? en;

export function t(str: keyof typeof en): string {
	if (!locale) {
		console.dir({
			where: "helpers.t",
			message: "Error: Language file not found",
			locale: moment.locale(),
		});
	}

	return (locale && locale[str]) || en[str];
}
