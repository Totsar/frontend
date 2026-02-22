const getItemTitle = (item) =>
    item?.title || item?.itemTitle || item?.item_title || item?.name || "";

const getItemLocation = (item) =>
    item?.location || item?.locationText || item?.location_text || "";

const getItemCreatedAt = (item) =>
    item?.createdAt || item?.created_at || item?.created || "";

const getItemTags = (item) =>
    Array.isArray(item?.tags) ? item.tags : [];

const ItemCardsGrid = ({
    items = [],
    onSelectItem,
    resolveImageUrl,
    formatDateTime,
    emptyText = "No items found.",
    showEmpty = true,
}) => {
    return (
        <div className="items-grid">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="item-card"
                    onClick={() => onSelectItem?.(item)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            onSelectItem?.(item);
                        }
                    }}
                    role="button"
                    tabIndex={0}
                >
                    <div className="item-thumb">
                        {item.image ? (
                            <img
                                src={resolveImageUrl(item.image)}
                                alt={getItemTitle(item) || `Item ${item.id}`}
                                className="item-thumb-image"
                            />
                        ) : (
                            "?"
                        )}
                    </div>
                    <div className="item-body">
                        <div className="item-title-row">
                            <h3>{getItemTitle(item) || `Item #${item.id}`}</h3>
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
                            <span>{formatDateTime ? formatDateTime(getItemCreatedAt(item)) : "-"}</span>
                        </div>
                    </div>
                </div>
            ))}

            {showEmpty && items.length === 0 ? (
                <div className="empty-state">{emptyText}</div>
            ) : null}
        </div>
    );
};

export default ItemCardsGrid;
