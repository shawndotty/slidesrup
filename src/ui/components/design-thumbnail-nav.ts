import { t } from "src/lang/helpers";
import { DesignPageDraft, DesignPageId } from "src/types/design-maker";

const THUMBNAIL_ITEM_WIDTH = 140;
const THUMBNAIL_ITEM_HEIGHT = 64;
const THUMBNAIL_ITEM_GAP = 8;
const THUMBNAIL_VIRTUALIZE_THRESHOLD = 50;
const THUMBNAIL_OVERSCAN = 4;

export function getNextThumbnailIndex(options: {
	currentIndex: number;
	direction: -1 | 1;
	total: number;
	wrap?: boolean;
}): number {
	const { currentIndex, direction, total, wrap = false } = options;
	if (!Number.isFinite(total) || total <= 0) return -1;
	if (
		!Number.isFinite(currentIndex) ||
		currentIndex < 0 ||
		currentIndex >= total
	) {
		return direction > 0 ? 0 : total - 1;
	}
	const nextIndex = currentIndex + direction;
	if (wrap) {
		return (nextIndex + total) % total;
	}
	if (nextIndex < 0) return 0;
	if (nextIndex >= total) return total - 1;
	return nextIndex;
}

export function computeThumbnailVirtualWindow(options: {
	total: number;
	containerWidth: number;
	scrollLeft: number;
	itemWidth?: number;
	gap?: number;
	overscan?: number;
	threshold?: number;
}): {
	virtualized: boolean;
	start: number;
	end: number;
	totalWidth: number;
} {
	const {
		total,
		containerWidth,
		scrollLeft,
		itemWidth = THUMBNAIL_ITEM_WIDTH,
		gap = THUMBNAIL_ITEM_GAP,
		overscan = THUMBNAIL_OVERSCAN,
		threshold = THUMBNAIL_VIRTUALIZE_THRESHOLD,
	} = options;

	if (!Number.isFinite(total) || total <= 0) {
		return { virtualized: false, start: 0, end: 0, totalWidth: 0 };
	}
	const stride = Math.max(1, itemWidth + gap);
	const safeWidth = Number.isFinite(containerWidth)
		? Math.max(0, containerWidth)
		: 0;
	const safeScrollLeft = Number.isFinite(scrollLeft)
		? Math.max(0, scrollLeft)
		: 0;
	const totalWidth = total * itemWidth + Math.max(0, total - 1) * gap;
	const shouldVirtualize = total > threshold;
	if (!shouldVirtualize) {
		return {
			virtualized: false,
			start: 0,
			end: total,
			totalWidth,
		};
	}

	const visibleStart = Math.floor(safeScrollLeft / stride);
	const visibleCount = Math.max(1, Math.ceil(safeWidth / stride));
	const start = Math.max(0, visibleStart - overscan);
	const end = Math.min(total, visibleStart + visibleCount + overscan);

	return {
		virtualized: true,
		start,
		end,
		totalWidth,
	};
}

export function formatThumbnailBlockCount(blockCount: number): string {
	const safeCount = Number.isFinite(blockCount)
		? Math.max(0, Math.floor(blockCount))
		: 0;
	return `${safeCount} blocks`;
}

function createThumbnailItem(options: {
	parent: HTMLElement;
	page: DesignPageDraft;
	index: number;
	isActive: boolean;
	onSelect: (pageType: DesignPageId) => void;
	virtualized: boolean;
	itemWidth: number;
	gap: number;
}): void {
	const {
		parent,
		page,
		index,
		isActive,
		onSelect,
		virtualized,
		itemWidth,
		gap,
	} = options;
	const button = parent.createEl("button", {
		cls: "slides-rup-design-maker-thumbnail-item",
	});
	button.setAttr("data-page-type", page.type);
	button.setAttr("role", "tab");
	button.setAttr("aria-selected", isActive ? "true" : "false");
	button.setAttr(
		"aria-label",
		`${t("Switch to page" as any)}: ${page.label}`,
	);
	button.style.width = `${itemWidth}px`;
	if (virtualized) {
		button.style.position = "absolute";
		button.style.left = `${index * (itemWidth + gap)}px`;
	}
	if (isActive) {
		button.addClass("is-active");
	}
	if (page.hasUnsupportedContent) {
		button.addClass("has-warning");
	}

	const frame = button.createDiv("slides-rup-design-maker-thumbnail-frame");
	frame
		.createDiv("slides-rup-design-maker-thumbnail-label")
		.setText(page.label);
	frame
		.createDiv("slides-rup-design-maker-thumbnail-meta")
		.setText(formatThumbnailBlockCount(page.blocks.length));
	button.addEventListener("click", () => onSelect(page.type));
}

function ensureActiveItemVisible(options: {
	viewport: HTMLElement;
	activeIndex: number;
	itemWidth: number;
	gap: number;
	isVertical?: boolean;
}): void {
	const {
		viewport,
		activeIndex,
		itemWidth,
		gap,
		isVertical = false,
	} = options;
	if (activeIndex < 0) return;
	if (isVertical) {
		const top = activeIndex * (THUMBNAIL_ITEM_HEIGHT + gap);
		const bottom = top + THUMBNAIL_ITEM_HEIGHT;
		const viewportTop = viewport.scrollTop;
		const viewportBottom = viewportTop + viewport.clientHeight;
		if (top < viewportTop) {
			viewport.scrollTop = Math.max(0, top - gap);
			return;
		}
		if (bottom > viewportBottom) {
			viewport.scrollTop = Math.max(
				0,
				bottom - viewport.clientHeight + gap,
			);
		}
		return;
	}
	const left = activeIndex * (itemWidth + gap);
	const right = left + itemWidth;
	const viewportLeft = viewport.scrollLeft;
	const viewportRight = viewportLeft + viewport.clientWidth;
	if (left < viewportLeft) {
		viewport.scrollLeft = Math.max(0, left - gap);
		return;
	}
	if (right > viewportRight) {
		viewport.scrollLeft = Math.max(0, right - viewport.clientWidth + gap);
	}
}

export function renderDesignThumbnailNav(options: {
	container: HTMLElement;
	pages: DesignPageDraft[];
	activePageType: DesignPageId;
	onSelect: (pageType: DesignPageId) => void;
	initialScrollLeft?: number;
	onScrollLeftChange?: (scrollLeft: number) => void;
}): void {
	const {
		container,
		pages,
		activePageType,
		onSelect,
		initialScrollLeft = 0,
		onScrollLeftChange,
	} = options;
	const previousResizeObserver = (
		container as {
			_srThumbnailResizeObserver?: ResizeObserver;
		}
	)._srThumbnailResizeObserver;
	previousResizeObserver?.disconnect();
	container.empty();
	if (pages.length === 0) return;

	const header = container.createDiv(
		"slides-rup-design-maker-thumbnail-header",
	);
	header
		.createDiv("slides-rup-design-maker-thumbnail-title")
		.setText(t("Slide Thumbnails" as any));
	const controls = header.createDiv(
		"slides-rup-design-maker-thumbnail-controls",
	);
	const prevButton = controls.createEl("button", {
		cls: "slides-rup-design-maker-thumbnail-arrow",
		text: "◀",
		attr: { type: "button", "aria-label": t("Previous thumbnails" as any) },
	});
	const nextButton = controls.createEl("button", {
		cls: "slides-rup-design-maker-thumbnail-arrow",
		text: "▶",
		attr: { type: "button", "aria-label": t("Next thumbnails" as any) },
	});
	const viewport = container.createDiv(
		"slides-rup-design-maker-thumbnail-viewport",
	);
	viewport.setAttr("role", "tablist");
	const track = viewport.createDiv("slides-rup-design-maker-thumbnail-track");
	const isVertical = window.innerWidth <= 640;
	viewport.classList.toggle("is-vertical", isVertical);
	track.classList.toggle("is-vertical", isVertical);
	const activeIndex = pages.findIndex((page) => page.type === activePageType);
	viewport.scrollLeft = Number.isFinite(initialScrollLeft)
		? Math.max(0, initialScrollLeft)
		: 0;

	let rafId: number | null = null;
	const renderItems = () => {
		track.empty();
		const window = computeThumbnailVirtualWindow({
			total: pages.length,
			containerWidth: isVertical
				? Number.MAX_SAFE_INTEGER
				: viewport.clientWidth,
			scrollLeft: viewport.scrollLeft,
		});
		if (isVertical) {
			window.virtualized = false;
			window.start = 0;
			window.end = pages.length;
		}
		track.style.width = `${window.totalWidth}px`;
		track.classList.toggle("is-virtualized", window.virtualized);
		for (let i = window.start; i < window.end; i++) {
			createThumbnailItem({
				parent: track,
				page: pages[i],
				index: i,
				isActive: pages[i].type === activePageType,
				onSelect,
				virtualized: window.virtualized,
				itemWidth: THUMBNAIL_ITEM_WIDTH,
				gap: THUMBNAIL_ITEM_GAP,
			});
		}
	};

	renderItems();
	ensureActiveItemVisible({
		viewport,
		activeIndex,
		itemWidth: THUMBNAIL_ITEM_WIDTH,
		gap: THUMBNAIL_ITEM_GAP,
		isVertical,
	});

	prevButton.addEventListener("click", () => {
		if (isVertical) {
			viewport.scrollBy({ top: -220, behavior: "smooth" });
			return;
		}
		viewport.scrollBy({
			left: -(THUMBNAIL_ITEM_WIDTH + THUMBNAIL_ITEM_GAP) * 3,
			behavior: "smooth",
		});
	});
	nextButton.addEventListener("click", () => {
		if (isVertical) {
			viewport.scrollBy({ top: 220, behavior: "smooth" });
			return;
		}
		viewport.scrollBy({
			left: (THUMBNAIL_ITEM_WIDTH + THUMBNAIL_ITEM_GAP) * 3,
			behavior: "smooth",
		});
	});

	let isDragging = false;
	let dragStartX = 0;
	let dragStartY = 0;
	let dragStartScrollLeft = 0;
	let dragStartScrollTop = 0;
	viewport.addEventListener("pointerdown", (event) => {
		const target = event.target as HTMLElement;
		if (target.closest(".slides-rup-design-maker-thumbnail-item")) return;
		isDragging = true;
		dragStartX = event.clientX;
		dragStartY = event.clientY;
		dragStartScrollLeft = viewport.scrollLeft;
		dragStartScrollTop = viewport.scrollTop;
		viewport.addClass("is-dragging");
		viewport.setPointerCapture(event.pointerId);
	});
	viewport.addEventListener("pointermove", (event) => {
		if (!isDragging) return;
		if (isVertical) {
			viewport.scrollTop =
				dragStartScrollTop - (event.clientY - dragStartY);
			return;
		}
		viewport.scrollLeft =
			dragStartScrollLeft - (event.clientX - dragStartX);
	});
	const endDrag = (event: PointerEvent) => {
		if (!isDragging) return;
		isDragging = false;
		viewport.removeClass("is-dragging");
		if (viewport.hasPointerCapture(event.pointerId)) {
			viewport.releasePointerCapture(event.pointerId);
		}
	};
	viewport.addEventListener("pointerup", endDrag);
	viewport.addEventListener("pointercancel", endDrag);

	viewport.addEventListener("scroll", () => {
		onScrollLeftChange?.(viewport.scrollLeft);
		if (rafId !== null) return;
		rafId = requestAnimationFrame(() => {
			rafId = null;
			if (pages.length > THUMBNAIL_VIRTUALIZE_THRESHOLD) {
				renderItems();
			}
		});
	});

	const resizeObserver = new ResizeObserver(() => renderItems());
	resizeObserver.observe(viewport);
	(
		container as { _srThumbnailResizeObserver?: ResizeObserver }
	)._srThumbnailResizeObserver = resizeObserver;
}
