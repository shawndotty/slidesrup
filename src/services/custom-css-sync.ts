import SlidesRup from "src/main";

type CustomCssChangeListener = (value: string) => void;

const customCssChangeListeners = new Set<CustomCssChangeListener>();

export const subscribeCustomCssChange = (listener: CustomCssChangeListener) => {
	customCssChangeListeners.add(listener);
	return () => {
		customCssChangeListeners.delete(listener);
	};
};

export const notifyCustomCssChange = (value: string) => {
	customCssChangeListeners.forEach((listener) => listener(value));
};

export const saveUserCustomCss = async (
	plugin: SlidesRup,
	newCss: string,
): Promise<void> => {
	plugin.settings.customCss = newCss;
	await plugin.saveSettings();
	await plugin.services.slidesRupStyleService.modifyStyleSection("userStyle");
	notifyCustomCssChange(newCss);
};
