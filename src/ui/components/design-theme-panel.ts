import { t } from "src/lang/helpers";
import { DESIGN_THEME_PANEL_SHOW_EXTENDED_FIELDS } from "src/constants";
import { ThemeStyleDraft } from "src/types/design-maker";

export function renderDesignThemePanel(options: {
	container: HTMLElement;
	theme: ThemeStyleDraft;
	showTitle?: boolean;
	onChange: (patch: Partial<ThemeStyleDraft>) => void;
}): void {
	const { container, theme, onChange, showTitle = true } = options;
	container.empty();

	if (showTitle) {
		container.createEl("h3", {
			text: t("Design Theme"),
			cls: "slides-rup-design-maker-section-title",
		});
	}

	const primaryField: Array<{
		key: keyof ThemeStyleDraft;
		label: string;
		type: "color" | "text" | "number";
		value: string | number;
		step?: string;
	}> = [
		{
			key: "primaryColor",
			label: "Primary Color",
			type: "color",
			value: theme.primaryColor,
		},
	];
	const extendedFields: Array<{
		key: keyof ThemeStyleDraft;
		label: string;
		type: "color" | "text" | "number";
		value: string | number;
		step?: string;
	}> = [
		{
			key: "secondaryColor",
			label: "Secondary Color",
			type: "color",
			value: theme.secondaryColor,
		},
		{
			key: "backgroundColor",
			label: "Background Color",
			type: "color",
			value: theme.backgroundColor,
		},
		{
			key: "textColor",
			label: "Text Color",
			type: "color",
			value: theme.textColor,
		},
		{
			key: "headingFont",
			label: "Heading Font",
			type: "text",
			value: theme.headingFont,
		},
		{
			key: "bodyFont",
			label: "Body Font",
			type: "text",
			value: theme.bodyFont,
		},
		{
			key: "headingScale",
			label: "Heading Scale",
			type: "number",
			value: theme.headingScale,
			step: "0.1",
		},
		{
			key: "bodyScale",
			label: "Body Scale",
			type: "number",
			value: theme.bodyScale,
			step: "0.1",
		},
		{
			key: "borderRadius",
			label: "Border Radius",
			type: "number",
			value: theme.borderRadius,
			step: "1",
		},
		{
			key: "shadowOpacity",
			label: "Shadow Opacity",
			type: "number",
			value: theme.shadowOpacity,
			step: "0.01",
		},
	];

	// 恢复完整主题项方式：
	// 将 src/constants.ts 中 DESIGN_THEME_PANEL_SHOW_EXTENDED_FIELDS 改为 true。
	const fields = DESIGN_THEME_PANEL_SHOW_EXTENDED_FIELDS
		? [...primaryField, ...extendedFields]
		: primaryField;

	fields.forEach((field) => {
		const row = container.createDiv("slides-rup-design-maker-field");
		row.createEl("label", { text: t(field.label as any) });
		const input = row.createEl("input", {
			type: field.type,
			value: `${field.value}`,
			cls: "slides-rup-design-maker-input",
		});
		if (field.step) input.step = field.step;
		input.addEventListener("input", () => {
			const rawValue =
				field.type === "number"
					? Number(input.value || 0)
					: input.value;
			onChange({
				[field.key]: rawValue,
			} as Partial<ThemeStyleDraft>);
		});
	});

	if (DESIGN_THEME_PANEL_SHOW_EXTENDED_FIELDS) {
		const modeRow = container.createDiv("slides-rup-design-maker-field");
		modeRow.createEl("label", { text: t("Theme Mode") });
		const modeSelect = modeRow.createEl("select", {
			cls: "slides-rup-design-maker-input",
		});
		[
			{ value: "light", label: t("Light Mode") },
			{ value: "dark", label: t("Dark Mode") },
		].forEach((option) => {
			const el = modeSelect.createEl("option", {
				text: option.label,
				value: option.value,
			});
			el.selected = option.value === theme.mode;
		});
		modeSelect.addEventListener("change", () => {
			onChange({
				mode: modeSelect.value === "dark" ? "dark" : "light",
			});
		});
	}
}
