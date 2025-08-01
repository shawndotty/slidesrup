// Solution inspired by obsidian-kanban and optimized for robustness and clarity.

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

// Cache for the fully resolved locale object and language string.
let cachedLocale: typeof en | null = null;
let cachedLang: string | null = null;

/**
 * Determines the current language from plugin settings or Obsidian's locale.
 */
function _get_current_lang(): string {
	try {
		const app = getAppInstance();
		// Use plugin settings for language, fallback to Obsidian's moment.locale()
		const obasRunningLanguage =
			app.plugins.plugins["obas-assistant"]?.settings
				?.obasRunningLanguage ?? "ob";
		return obasRunningLanguage === "ob"
			? moment.locale()
			: obasRunningLanguage;
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
function _get_locale(): typeof en {
	const lang = _get_current_lang();

	// Return cached locale if language hasn't changed.
	if (cachedLocale && cachedLang === lang) {
		return cachedLocale;
	}

	const baseLocale = en;
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
	// With the improved _get_locale, t() is now simpler and more direct.
	// It just looks up the key in the guaranteed-to-be-complete locale object.
	return _get_locale()[str];
}
