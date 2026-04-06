// Solution inspired by obsidian-kanban and optimized for robustness and clarity.

import { moment } from "obsidian";
import { getAppInstance } from "src/utils";
import en from "./locale/en";
import inspectorEnUS from "./locale/design-inspector/en-US.json";
import inspectorZhCN from "./locale/design-inspector/zh-CN.json";
import zhCN from "./locale/zh-cn";
import zhTW from "./locale/zh-tw";

type LocaleDictionary = Record<string, string>;

const EN_BASE_LOCALE: LocaleDictionary = {
	...(en as LocaleDictionary),
	...(inspectorEnUS as LocaleDictionary),
};

const localeMap: { [k: string]: LocaleDictionary } = {
	en: EN_BASE_LOCALE,
	"zh-cn": {
		...(zhCN as LocaleDictionary),
		...(inspectorZhCN as LocaleDictionary),
	},
	"zh-tw": zhTW as LocaleDictionary,
};

// Cache for the fully resolved locale object and language string.
let cachedLocale: LocaleDictionary | null = null;
let cachedLang: string | null = null;

/**
 * Determines the current language from plugin settings or Obsidian's locale.
 */
function _get_current_lang(): string {
	try {
		const app = getAppInstance();
		// Use plugin settings for language, fallback to Obsidian's moment.locale()
		const slidesRupRunningLanguage =
			app.plugins.plugins["slides-rup"]?.settings
				?.slidesRupRunningLanguage ?? "ob";
		return slidesRupRunningLanguage === "ob"
			? moment.locale()
			: slidesRupRunningLanguage;
	} catch (e) {
		console.error(
			"Failed to get language setting, falling back to 'en'",
			e
		);
		return "en";
	}
}

/**
 * Gets the appropriate locale object.
 * It merges the specific locale with the English fallback to ensure all keys are present.
 * The result is cached to avoid re-computation on subsequent calls.
 */
function _get_locale(): LocaleDictionary {
	const lang = _get_current_lang();

	// Return cached locale if language hasn't changed.
	if (cachedLocale && cachedLang === lang) {
		return cachedLocale;
	}

	const baseLocale = EN_BASE_LOCALE;
	const specificLocale = localeMap[lang];

	// Create a new locale object with 'en' as a fallback for missing keys.
	// This makes the translation lookup more robust.
	const locale =
		specificLocale && specificLocale !== baseLocale
			? { ...baseLocale, ...specificLocale }
			: baseLocale;

	cachedLocale = locale;
	cachedLang = lang;
	return locale;
}

/**
 * Translates a string key into the current language.
 * @param str The key of the string to translate.
 * @returns The translated string.
 */
export function t(str: keyof typeof en): string {
	const locale = _get_locale();
	const key = String(str);
	return locale[key] ?? EN_BASE_LOCALE[key] ?? key;
}
