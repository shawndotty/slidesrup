import { DesignMakerViewState } from "src/types/design-maker";

export function createDesignMakerViewState(
	designPath: string,
	designName: string,
): DesignMakerViewState {
	return {
		designPath,
		designName,
	};
}
