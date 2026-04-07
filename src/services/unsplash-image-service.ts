import { requestUrl } from "obsidian";
import { SlidesRupSettings } from "src/types";
import { SecretStoreService } from "./secret-store-service";

export interface UnsplashImageItem {
	id: string;
	url: string;
	thumb: string;
	alt: string;
	author: string;
}

export function buildMarkdownImageFromUrl(url: string): string {
	return `![](${url.trim()})`;
}

export function buildUnsplashRandomUrl(keyword: string): string {
	const pool = [
		"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
		"https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=80",
		"https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80",
		"https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80",
		"https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1600&q=80",
	];
	const normalized = (keyword || "").trim().toLowerCase();
	const hash = normalized
		.split("")
		.reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);
	return pool[hash % pool.length];
}

export class UnsplashImageService {
	constructor(
		private settings: SlidesRupSettings,
		private secretStoreService: SecretStoreService,
	) {}

	private async getAccessKey(): Promise<string> {
		return this.secretStoreService.getUnsplashAccessKey();
	}

	async searchImages(keyword: string): Promise<UnsplashImageItem[]> {
		const query = (keyword || "").trim();
		if (!query) return [];
		const accessKey = await this.getAccessKey();
		if (!accessKey) {
			if (!this.settings.unsplashUseRandomFallbackWithoutKey) return [];
			const randomUrl = buildUnsplashRandomUrl(query);
			return [
				{
					id: `random-${Date.now()}`,
					url: randomUrl,
					thumb: randomUrl,
					alt: query,
					author: "Unsplash",
				},
			];
		}
		const endpoint = `${(this.settings.unsplashApiBaseUrl || "https://api.unsplash.com").replace(/\/+$/, "")}/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`;
		const response = await requestUrl({
			url: endpoint,
			method: "GET",
			headers: {
				Authorization: `Client-ID ${accessKey}`,
			},
		});
		const rows = (response.json?.results || []) as any[];
		return rows.map((row) => ({
			id: row.id || "",
			url: row?.urls?.regular || row?.urls?.full || "",
			thumb: row?.urls?.small || row?.urls?.thumb || row?.urls?.regular || "",
			alt: row?.alt_description || query,
			author: row?.user?.name || "Unsplash",
		})).filter((item) => item.url);
	}
}
