import { requestUrl } from "obsidian";
import { AIRTABLE_CONFIG } from "../airtable-config";
import { SlidesRupSettings } from "../types";
import { DEFAULT_SETTINGS } from "../models/default-settings";

export class ApiService {
	constructor(private settings: SlidesRupSettings) {}

	async getUpdateIDs(): Promise<void> {
		const userEmail = this.settings.userEmail.trim();
		const config = AIRTABLE_CONFIG.GET_UPDATE_IDS;
		const getUpdateIDsUrl = `https://api.airtable.com/v0/${
			config.BASE_ID
		}/${config.TABLE_ID}?view=${
			config.VIEW_ID
		}&maxRecords=1&filterByFormula=${encodeURI(
			"{Email} = '" + userEmail + "'"
		)}&fields%5B%5D=${config.FIELD_NAME}`;

		const response = await requestUrl({
			url: getUpdateIDsUrl,
			method: "GET",
			headers: { Authorization: "Bearer " + config.TOKEN },
		});

		if (
			response.json.records.length &&
			response.json.records[0].fields[config.FIELD_NAME]
		) {
			this.settings.updateIDs = JSON.parse(
				response.json.records[0].fields[config.FIELD_NAME].first()
			);
			this.settings.userChecked = true;
		} else {
			this.settings.updateIDs = DEFAULT_SETTINGS.updateIDs;
			this.settings.userChecked = DEFAULT_SETTINGS.userChecked;
		}
	}

	async checkApiKey(): Promise<void> {
		const updateUUID = crypto.randomUUID();
		const config = AIRTABLE_CONFIG.CHECK_API_KEY;
		const checkApiValidUrl = `https://api.airtable.com/v0/${
			config.BASE_ID
		}/${config.TABLE_ID}?maxRecords=1&view=${
			config.VIEW_ID
		}&filterByFormula=${encodeURI(
			"{UUID} = '" + updateUUID + "'"
		)}&fields%5B%5D=${config.FIELD_NAME}`;
		let validKey = 0;
		try {
			await requestUrl({
				url: config.WEBHOOK_URL,
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					uuid: updateUUID,
					userApiKey: this.settings.updateAPIKey,
				}),
			});

			await new Promise((r) => setTimeout(r, 1500));

			try {
				const matchRes = await requestUrl({
					url: checkApiValidUrl,
					method: "GET",
					headers: { Authorization: "Bearer " + config.TOKEN },
				});
				validKey = matchRes.json.records[0].fields[config.FIELD_NAME];
			} catch (error) {
				console.log(error);
			}
		} catch (error) {
			console.log(error);
		}

		if (validKey) {
			this.settings.updateAPIKeyIsValid = true;
		} else {
			this.settings.updateAPIKeyIsValid = false;
		}
	}
}
