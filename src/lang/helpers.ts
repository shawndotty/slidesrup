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

// 使用单例模式优化 locale 获取，避免重复计算
let cachedLocale: Partial<typeof en> | null = null;
let cachedLang: string | null = null;

function _get_locale() {
	// 获取当前语言设置
	const app = getAppInstance();
	const obasRunningLanguage =
		app.plugins.plugins["obas-assistant"]?.settings?.obasRunningLanguage ??
		"ob";
	const lang =
		obasRunningLanguage === "ob" ? moment.locale() : obasRunningLanguage;

	// 如果缓存命中，直接返回
	if (cachedLocale && cachedLang === lang) {
		return cachedLocale;
	}

	// 重新计算并缓存
	const locale = localeMap[lang] ?? en;
	cachedLocale = locale;
	cachedLang = lang;
	return locale;
}

export function t(str: keyof typeof en): string {
	const locale = _get_locale();
	if (!locale) {
		console.dir({
			where: "helpers.t",
			message: "Error: Language file not found",
			locale: moment.locale(),
		});
	}

	return (locale && locale[str]) || en[str];
}
