import { OBASAssistantSettings } from "src/types";
import { t } from "src/lang/helpers";

export const DEFAULT_SETTINGS: OBASAssistantSettings = {
	updateAPIKey: "",
	updateAPIKeyIsValid: false,
	obasFrameworkFolder: "",
	userEmail: "",
	userChecked: false,
	newSlideLocationOption: "current",
	assignedNewSlideLocation: "",
	defaultDesign: "none",
	templatesFolder: "",
	demoFolder: "",
	userSlideTemplate: "",
	userChapterTemplate: "",
	userChapterAndPagesTemplate: "",
	userPageTemplate: "",
	userBaseLayoutTemplate: "",
	userTocTemplate: "",
	presenter: "Johnny",
	tagline: "OBAS",
	slogan: t("Keep is simple but elegant"),
	dateFormat: "",
	enableUserTemplates: true,
	customizeSlideFolderName: true,
	addChapterWithSubPages: true,
	updateIDs: {
		style: {
			baseID: "",
			tableID: "",
			viewID: "",
		},
		templates: {
			baseID: "",
			tableID: "",
			viewID: "",
		},
		demo: {
			baseID: "",
			tableID: "",
			viewID: "",
		},
		reveal: {
			baseID: "",
			tableID: "",
			viewID: "",
		},
	},
	obasHue: 225,
	obasSaturation: 100,
	obasLightness: 50,
};
