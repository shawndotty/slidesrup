import { App } from "obsidian";
import { SlidesRupSettings } from "src/types";

type KeychainLike = {
	getPassword: (service: string, account: string) => Promise<string | null>;
	setPassword: (
		service: string,
		account: string,
		password: string,
	) => Promise<void>;
	deletePassword?: (service: string, account: string) => Promise<void>;
};

export type SecretStorageMode = "keychain" | "fallback";

const SERVICE_NAME = "slides-rup";
const AI_ACCOUNT = "ai-openai-compatible";

export class SecretStoreService {
	constructor(
		private app: App,
		private settings: SlidesRupSettings,
		private saveSettings: () => Promise<void>,
	) {}

	private getKeychain(): KeychainLike | null {
		const appAny = this.app as any;
		const candidates = [
			appAny?.keychain,
			appAny?.passwordManager,
			appAny?.credentialManager,
		];
		for (const candidate of candidates) {
			if (
				candidate &&
				typeof candidate.getPassword === "function" &&
				typeof candidate.setPassword === "function"
			) {
				return candidate as KeychainLike;
			}
		}
		return null;
	}

	getStorageMode(): SecretStorageMode {
		return this.getKeychain() ? "keychain" : "fallback";
	}

	async getAIProviderApiKey(): Promise<string> {
		const keychain = this.getKeychain();
		if (keychain) {
			const value = await keychain.getPassword(SERVICE_NAME, AI_ACCOUNT);
			return value || "";
		}
		return this.settings.aiProviderApiKeyFallback || "";
	}

	async setAIProviderApiKey(value: string): Promise<void> {
		const keychain = this.getKeychain();
		if (keychain) {
			if (!value.trim() && keychain.deletePassword) {
				await keychain.deletePassword(SERVICE_NAME, AI_ACCOUNT);
				return;
			}
			await keychain.setPassword(SERVICE_NAME, AI_ACCOUNT, value.trim());
			return;
		}
		this.settings.aiProviderApiKeyFallback = value.trim();
		await this.saveSettings();
	}
}

