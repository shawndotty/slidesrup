import { moment } from "obsidian";

/**
 * 验证API密钥是否有效
 * @param apiKey - 要验证的API密钥
 * @returns 如果API密钥有效返回true，否则返回false
 */
export function isValidApiKey(apiKey: string): boolean {
	return Boolean(
		apiKey &&
			apiKey.length >= 82 &&
			apiKey.includes("pat") &&
			apiKey.includes(".")
	);
}

/**
 * 验证邮箱格式是否有效
 * @param email - 要验证的邮箱地址
 * @returns 如果邮箱格式有效返回true，否则返回false
 */
export function isValidEmail(email: string): boolean {
	// 基础格式检查：非空、包含@符号、@后包含点号
	if (
		!email ||
		email.indexOf("@") === -1 ||
		email.indexOf(".", email.indexOf("@")) === -1 ||
		email.length < 10
	) {
		return false;
	}

	// 正则表达式验证（符合RFC 5322标准）
	const emailRegex =
		/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

	return emailRegex.test(email);
}

/**
 * 构建字段名称映射
 * @param forceDefaultFetchFields - 是否强制使用默认获取字段
 * @returns 根据当前语言环境返回相应的字段名称映射
 */
export function buildFieldNames(forceDefaultFetchFields: boolean = false) {
	const local = moment.locale();
	if (forceDefaultFetchFields) {
		return {
			title: "Title",
			subFolder: "SubFolder",
			content: "MD",
		};
	}
	const fieldNames = {
		zhCN: {
			title: "Title",
			subFolder: "SubFolder",
			content: "MD",
		},
		en: {
			title: "TitleEN",
			subFolder: "SubFolderEN",
			content: "MDEN",
		},
		zhTW: {
			title: "TitleTW",
			subFolder: "SubFolderTW",
			content: "MDTW",
		},
	};
	switch (local) {
		case "zh-cn":
			return fieldNames.zhCN;
		case "en":
			return fieldNames.en;
		case "zh-tw":
			return fieldNames.zhTW;
		default:
			return fieldNames.en;
	}
}
