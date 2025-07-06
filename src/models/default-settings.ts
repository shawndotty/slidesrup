import { OBASAssistantSettings } from "src/types";

export const DEFAULT_SETTINGS: OBASAssistantSettings = {
	updateAPIKey: "",
	updateAPIKeyIsValid: false,
	obasFrameworkFolder: "",
	userEmail: "",
	userChecked: false,
	newSlideLocationOption: "current",
	assignedNewSlideLocation: "",
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
	},
};
