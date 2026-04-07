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

export interface UnsplashAspectRatio {
	label: string;
	width: number;
	height: number;
}

export interface UnsplashSearchOptions {
	aspectRatio?: string;
	baseCropWidth?: number;
	baseCropHeight?: number;
}

interface UnsplashApiPhoto {
	id?: string;
	alt_description?: string;
	urls?: {
		raw?: string;
		regular?: string;
		full?: string;
		small?: string;
		thumb?: string;
	};
	user?: {
		name?: string;
	};
}

interface UnsplashSearchResponse {
	results?: UnsplashApiPhoto[];
}

export class UnsplashApiError extends Error {
	statusCode?: number;

	constructor(message: string, statusCode?: number) {
		super(message);
		this.name = "UnsplashApiError";
		this.statusCode = statusCode;
	}
}

export const DEFAULT_UNSPLASH_CROP_WIDTH = 1920;
export const DEFAULT_UNSPLASH_CROP_HEIGHT = 1080;
const DEFAULT_ASPECT_RATIO = "16:9";
const DEFAULT_RATIO_PRESETS = "16:9,4:3,1:1,3:2,21:9,9:16";

export function buildMarkdownImageFromUrl(url: string): string {
	return `![](${url.trim()})`;
}

function normalizePositiveInt(
	value: number,
	fallback: number,
	min = 1,
	max = 8192,
): number {
	if (!Number.isFinite(value)) return fallback;
	const next = Math.round(value);
	if (next < min || next > max) return fallback;
	return next;
}

function splitRatioValue(input: string): [string, string] | null {
	const trimmed = (input || "").trim();
	if (!trimmed) return null;
	const separator = trimmed.includes(":") ? ":" : "/";
	const parts = trimmed.split(separator).map((part) => part.trim());
	if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
	return [parts[0], parts[1]];
}

export function parseAspectRatio(input: string): UnsplashAspectRatio | null {
	const parts = splitRatioValue(input);
	if (!parts) return null;
	const width = Number(parts[0]);
	const height = Number(parts[1]);
	if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
	if (width <= 0 || height <= 0) return null;
	return {
		label: `${Math.round(width)}:${Math.round(height)}`,
		width: Math.round(width),
		height: Math.round(height),
	};
}

export function resolveUnsplashAspectRatio(
	input: string,
	fallback: string = DEFAULT_ASPECT_RATIO,
): UnsplashAspectRatio {
	return parseAspectRatio(input) || parseAspectRatio(fallback)!;
}

export function parseAspectRatioPresetList(input: string): string[] {
	const source = (input || "").trim() || DEFAULT_RATIO_PRESETS;
	const seen = new Set<string>();
	return source
		.split(",")
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
		.map((item) => resolveUnsplashAspectRatio(item).label)
		.filter((item) => {
			if (seen.has(item)) return false;
			seen.add(item);
			return true;
		});
}

export function resolveCropDimensions(
	options?: UnsplashSearchOptions,
): { width: number; height: number; ratioLabel: string } {
	const baseWidth = normalizePositiveInt(
		Number(options?.baseCropWidth ?? DEFAULT_UNSPLASH_CROP_WIDTH),
		DEFAULT_UNSPLASH_CROP_WIDTH,
	);
	const baseHeight = normalizePositiveInt(
		Number(options?.baseCropHeight ?? DEFAULT_UNSPLASH_CROP_HEIGHT),
		DEFAULT_UNSPLASH_CROP_HEIGHT,
	);
	const ratio = resolveUnsplashAspectRatio(options?.aspectRatio || "");
	const ratioValue = ratio.width / ratio.height;
	const baseRatio = baseWidth / baseHeight;
	if (ratioValue >= baseRatio) {
		return {
			width: baseWidth,
			height: Math.max(1, Math.round(baseWidth / ratioValue)),
			ratioLabel: ratio.label,
		};
	}
	return {
		width: Math.max(1, Math.round(baseHeight * ratioValue)),
		height: baseHeight,
		ratioLabel: ratio.label,
	};
}

export function buildUnsplashCroppedImageUrl(
	rawOrUrl: string,
	crop: { width: number; height: number },
): string {
	const source = (rawOrUrl || "").trim();
	if (!source) return "";
	try {
		const url = new URL(source);
		url.searchParams.set("auto", "format");
		url.searchParams.set("fit", "crop");
		url.searchParams.set("crop", "entropy");
		url.searchParams.set("w", `${crop.width}`);
		url.searchParams.set("h", `${crop.height}`);
		url.searchParams.set("q", "80");
		return url.toString();
	} catch {
		return source;
	}
}

export function buildUnsplashRandomUrl(
	keyword: string,
	options?: UnsplashSearchOptions,
): string {
	const crop = resolveCropDimensions(options);
	const pool = [
		"https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
		"https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
		"https://images.unsplash.com/photo-1469474968028-56623f02e42e",
		"https://images.unsplash.com/photo-1501785888041-af3ef285b470",
		"https://images.unsplash.com/photo-1447752875215-b2761acb3c5d",
	];
	const normalized = (keyword || "").trim().toLowerCase();
	const hash = normalized
		.split("")
		.reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);
	return buildUnsplashCroppedImageUrl(pool[hash % pool.length], crop);
}

function normalizeBaseUrl(baseUrl: string): string {
	const trimmed = (baseUrl || "").trim();
	if (!trimmed) {
		throw new UnsplashApiError("Unsplash API Base URL is empty");
	}
	try {
		const parsed = new URL(trimmed);
		if (!/^https?:$/.test(parsed.protocol)) {
			throw new UnsplashApiError("Unsplash API Base URL protocol is invalid");
		}
		return parsed.toString().replace(/\/+$/, "");
	} catch (error) {
		if (error instanceof UnsplashApiError) throw error;
		throw new UnsplashApiError("Unsplash API Base URL is invalid");
	}
}

function getErrorMessage(error: unknown): string {
	if (error instanceof UnsplashApiError) {
		return error.message;
	}
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

export class UnsplashImageService {
	constructor(
		private settings: SlidesRupSettings,
		private secretStoreService: SecretStoreService,
	) {}

	private async getAccessKey(): Promise<string> {
		return this.secretStoreService.getUnsplashAccessKey();
	}

	getAspectRatioPresets(): string[] {
		const defaultPreset = parseAspectRatioPresetList(
			this.settings.unsplashAspectRatioPresets || DEFAULT_RATIO_PRESETS,
		);
		const custom = parseAspectRatio(
			this.settings.unsplashAspectRatioCustom || "",
		);
		const next = custom ? [...defaultPreset, custom.label] : defaultPreset;
		if (!next.includes(DEFAULT_ASPECT_RATIO)) {
			next.unshift(DEFAULT_ASPECT_RATIO);
		}
		return Array.from(new Set(next));
	}

	getRecentAspectRatio(): string {
		const current = resolveUnsplashAspectRatio(
			this.settings.unsplashRecentAspectRatio || "",
		).label;
		const available = this.getAspectRatioPresets();
		if (available.includes(current)) return current;
		return available[0] || DEFAULT_ASPECT_RATIO;
	}

	async saveRecentAspectRatio(ratio: string): Promise<void> {
		const resolved = resolveUnsplashAspectRatio(ratio).label;
		this.settings.unsplashRecentAspectRatio = resolved;
	}

	async searchImages(
		keyword: string,
		options?: UnsplashSearchOptions,
	): Promise<UnsplashImageItem[]> {
		const query = (keyword || "").trim();
		if (!query) return [];
		const crop = resolveCropDimensions({
			aspectRatio: options?.aspectRatio || this.getRecentAspectRatio(),
			baseCropWidth:
				options?.baseCropWidth || this.settings.unsplashCropBaseWidth,
			baseCropHeight:
				options?.baseCropHeight || this.settings.unsplashCropBaseHeight,
		});
		const accessKey = await this.getAccessKey();
		if (!accessKey) {
			if (!this.settings.unsplashUseRandomFallbackWithoutKey) return [];
			const randomUrl = buildUnsplashRandomUrl(query, {
				aspectRatio: crop.ratioLabel,
				baseCropWidth: crop.width,
				baseCropHeight: crop.height,
			});
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
		const endpointBase = normalizeBaseUrl(
			this.settings.unsplashApiBaseUrl || "https://api.unsplash.com",
		);
		const endpoint = `${endpointBase}/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape&content_filter=high`;
		try {
			const response = await requestUrl({
				url: endpoint,
				method: "GET",
				headers: {
					Authorization: `Client-ID ${accessKey}`,
					"Accept-Version": "v1",
				},
			});
			if (
				typeof response.status === "number" &&
				(response.status < 200 || response.status >= 300)
			) {
				throw new UnsplashApiError(
					`Unsplash API request failed (${response.status})`,
					response.status,
				);
			}
			const json = (response.json || {}) as UnsplashSearchResponse;
			const rows = json.results || [];
			return rows
				.map((row) => {
					const rawUrl = row?.urls?.raw || row?.urls?.regular || "";
					const regular = buildUnsplashCroppedImageUrl(rawUrl, crop);
					const thumbSource =
						row?.urls?.small ||
						row?.urls?.thumb ||
						row?.urls?.regular ||
						rawUrl;
					return {
						id: row.id || "",
						url: regular,
						thumb: buildUnsplashCroppedImageUrl(thumbSource, crop),
						alt: row?.alt_description || query,
						author: row?.user?.name || "Unsplash",
					};
				})
				.filter((item) => item.url);
		} catch (error) {
			throw new UnsplashApiError(getErrorMessage(error));
		}
	}
}
