import { t } from "src/lang/helpers";
import { DesignPageId, DesignPageType } from "src/types/design-maker";

export interface DesignPageDefinition {
	type: DesignPageType;
	labelKey: string;
	getFileName: (designName: string) => string;
}

export const DESIGN_PAGE_DEFINITIONS: DesignPageDefinition[] = [
	{
		type: "cover",
		labelKey: "Cover",
		getFileName: (designName) => `${t("Cover")}-${designName}.md`,
	},
	{
		type: "toc",
		labelKey: "TOC",
		getFileName: (designName) => `${t("TOC")}-${designName}.md`,
	},
	{
		type: "chapter",
		labelKey: "Chapter",
		getFileName: (designName) => `${t("Chapter")}-${designName}.md`,
	},
	{
		type: "content",
		labelKey: "ContentPage",
		getFileName: (designName) => `${t("ContentPage")}-${designName}.md`,
	},
	{
		type: "contentWithoutNav",
		labelKey: "ContentPage",
		getFileName: (designName) =>
			`${t("ContentPage")}-${t("WithoutNav")}-${designName}.md`,
	},
	{
		type: "blank",
		labelKey: "BlankPage",
		getFileName: (designName) => `${t("BlankPage")}-${designName}.md`,
	},
	{
		type: "backCover",
		labelKey: "BackCover",
		getFileName: (designName) => `${t("BackCover")}-${designName}.md`,
	},
];

export function getDesignPageDefinition(type: DesignPageType) {
	return DESIGN_PAGE_DEFINITIONS.find((item) => item.type === type);
}

export function getDesignPageLabel(type: DesignPageType): string {
	return t((getDesignPageDefinition(type)?.labelKey || "Slide") as any);
}

export function isDesignMarkdownFile(fileName: string): boolean {
	return /\.md$/i.test(fileName);
}

export function buildAdditionalPageDraftMeta(
	fileName: string,
	filePath: string,
): {
	type: DesignPageId;
	label: string;
	fileName: string;
	filePath: string;
} {
	return {
		type: `extra:${fileName}`,
		label: getDesignPageDisplayName(fileName),
		fileName,
		filePath,
	};
}

export function getDesignPageDisplayName(fileName: string): string {
	const normalizedFileName = fileName.replace(/\.[^/.]+$/, "");
	const lastHyphenIndex = normalizedFileName.lastIndexOf("-");
	if (lastHyphenIndex === -1) {
		return normalizedFileName;
	}
	return normalizedFileName.slice(0, lastHyphenIndex);
}

export function getDesignPageFileName(
	type: DesignPageType,
	designName: string,
): string {
	return getDesignPageDefinition(type)?.getFileName(designName) || "";
}

export function getDesignThemeFileName(designName: string): string {
	return `sr-design-${designName.toLowerCase()}.css`;
}

export function inferDesignNameFromPath(path: string): string {
	const lastPart = path.split("/").pop() || "";
	return lastPart.startsWith("Design-")
		? lastPart.split("-").slice(1).join("-")
		: lastPart;
}

export function normalizeDesignName(input: string): string {
	return input.trim().replace(/[\\/:*?"<>|]/g, "-");
}
