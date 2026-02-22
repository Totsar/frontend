import { clampPreviewY } from "../../utils/imageCrop";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const getItemTitle = (item) =>
    item?.title || item?.itemTitle || item?.item_title || item?.name || "";

const getItemLocation = (item) =>
    item?.location || item?.locationText || item?.location_text || "";

const getItemCreatedAt = (item) =>
    item?.createdAt || item?.created_at || item?.created || "";

const getItemTags = (item) =>
    Array.isArray(item?.tags) ? item.tags : [];

const getItemImage = (item) => item?.image || "";
const getItemPreviewY = (item) => {
    const rawValue = item?.imagePreviewY ?? item?.image_preview_y;
    return clampPreviewY(rawValue);
};

const formatRelativeTime = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";

    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 1000));
    if (elapsedSeconds < 60) return "just now";

    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
};

const getItemType = (item) => {
    const normalized = String(item?.itemType || item?.item_type || "lost").toLowerCase();
    if (normalized === "lost" || normalized === "found") {
        return normalized;
    }
    return "lost";
};

const getItemTypeLabel = (itemType) => {
    if (itemType === "lost") return "Lost";
    return "Found";
};

const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
    return `${API_BASE}${imageUrl}`;
};

const CroppedItemImage = ({ src, alt, previewY }) => {
    const focusY = clampPreviewY(previewY);
    return (
        <div className="item-thumb-image-frame">
            <img
                src={src}
                alt={alt}
                className="item-thumb-image-positioned"
                style={{
                    top: `${focusY}%`,
                    transform: `translateY(-${focusY}%)`,
                }}
            />
        </div>
    );
};

const ItemCardsGrid = ({
    items = [],
    onSelectItem,
    emptyText = "No items found.",
    showEmpty = true,
}) => {
    return (
        <div className="items-grid">
            {items.map((item) => {
                const itemType = getItemType(item);
                const typeLabel = getItemTypeLabel(itemType);
                const placeholderSymbol = itemType === "found" ? "!" : "?";
                const imageUrl = getItemImage(item);
                const previewY = getItemPreviewY(item);

                return (
                    <div
                        key={item.id}
                        className={`item-card ${itemType}`}
                        onClick={() => onSelectItem?.(item)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                onSelectItem?.(item);
                            }
                        }}
                        role="button"
                        tabIndex={0}
                    >
                        <div className={`item-thumb ${itemType}`}>
                            {imageUrl ? (
                                <CroppedItemImage
                                    src={resolveImageUrl(imageUrl)}
                                    alt={getItemTitle(item) || `Item ${item.id}`}
                                    previewY={previewY}
                                />
                            ) : (
                                <span className="item-thumb-placeholder" aria-hidden="true">
                                    {placeholderSymbol}
                                </span>
                            )}
                        </div>
                        <div className="item-body">
                            <div className="item-title-row">
                                <h3>{getItemTitle(item) || `Item #${item.id}`}</h3>
                                <span className={`status ${itemType}`}>{typeLabel}</span>
                            </div>
                            <div className="item-tags">
                                {getItemTags(item).length ? (
                                    getItemTags(item).map((tag) => (
                                        <span key={`${item.id}-${tag}`} className="tag">
                                            {tag}
                                        </span>
                                    ))
                                ) : (
                                    <span className="tag">untagged</span>
                                )}
                            </div>
                            <div className="item-meta">
                                <span>{getItemLocation(item) || "-"}</span>
                                <span className="item-time">
                                    {formatRelativeTime(getItemCreatedAt(item))}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}

            {showEmpty && items.length === 0 ? (
                <div className="empty-state">{emptyText}</div>
            ) : null}
        </div>
    );
};

export default ItemCardsGrid;
