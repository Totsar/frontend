// src/pages/LostPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MapView from "../components/map/MapView";
import ItemCardsGrid from "../components/items/ItemCardsGrid";
import ItemDetailModal from "../components/items/ItemDetailModal";
import { useAuth } from "../context/AuthContext";
import { itemService } from "../services/itemService";
import tagOptions from "../data/tagOptions.json";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const formatDateTime = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
};

const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
    return `${API_BASE}${imageUrl}`;
};

const uniqueTags = (tags) => {
    const out = [];
    for (const tag of tags) {
        const normalized = String(tag || "").trim().toLowerCase();
        if (!normalized || out.includes(normalized)) continue;
        out.push(normalized);
    }
    return out;
};

const LostPage = () => {
    const navigate = useNavigate();
    const { auth, isLoggedIn } = useAuth();
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [tagFilter, setTagFilter] = useState("");
    const [debouncedTagFilter, setDebouncedTagFilter] = useState("");
    const [itemTypeFilter, setItemTypeFilter] = useState("all");
    const [debouncedItemTypeFilter, setDebouncedItemTypeFilter] = useState("all");
    const [ownerFilter, setOwnerFilter] = useState("");
    const [debouncedOwnerFilter, setDebouncedOwnerFilter] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [error, setError] = useState("");
    const [availableTags, setAvailableTags] = useState(() => uniqueTags([...tagOptions, "other"]));

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTagFilter(tagFilter);
            setDebouncedItemTypeFilter(itemTypeFilter);
            setDebouncedOwnerFilter(ownerFilter);
        }, 250);
        return () => clearTimeout(timer);
    }, [itemTypeFilter, ownerFilter, tagFilter]);

    useEffect(() => {
        let cancelled = false;
        const normalizedOwner = debouncedOwnerFilter.trim();

        const loadItems = async () => {
            setError("");
            setIsLoading(true);
            try {
                const data = await itemService.listItems({
                    search: debouncedQuery.trim(),
                    tag: debouncedTagFilter.trim(),
                    itemType: debouncedItemTypeFilter === "all" ? "" : debouncedItemTypeFilter,
                    owner: /^\d+$/.test(normalizedOwner) ? normalizedOwner : "",
                });
                if (!cancelled) {
                    setItems(Array.isArray(data) ? data : []);
                    const backendTags = Array.isArray(data)
                        ? data.flatMap((item) => item.tags || [])
                        : [];
                    setAvailableTags((prev) => uniqueTags([...prev, ...backendTags, "other"]));
                }
            } catch (err) {
                if (cancelled) return;
                const detail = err instanceof Error ? err.message : "Failed to load items";
                setError(detail);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                    setHasLoadedOnce(true);
                }
            }
        };

        loadItems();

        return () => {
            cancelled = true;
        };
    }, [debouncedItemTypeFilter, debouncedOwnerFilter, debouncedQuery, debouncedTagFilter]);

    const filteredItems = useMemo(() => {
        return items.filter((item) =>
            (item.location || "").toLowerCase().includes(locationQuery.toLowerCase())
        );
    }, [items, locationQuery]);

    const canEditSelectedItem =
        !!selectedItem && !!auth?.user?.id && selectedItem.userId === auth.user.id;

    const handleItemUpdated = (latest) => {
        setSelectedItem(latest);
        setItems((prev) => prev.map((item) => (item.id === latest.id ? latest : item)));
    };

    return (
        <div className="page">
            <Header />

            <main className="page-content">
                <div className="container lost-page">
                    <div className="lost-header">
                        <div>
                            <h1 className="page-title">Items</h1>
                            <p className="page-subtitle">
                                Browse the map and cards for lost and found items
                            </p>
                        </div>

                        <div className="lost-actions">
                            <button
                                className="btn primary report-btn report-btn-lost"
                                onClick={() =>
                                    navigate(isLoggedIn ? "/items/new?type=lost" : "/auth")
                                }
                            >
                                <span className="report-btn-icon" aria-hidden="true">?</span>
                                <span className="report-btn-title">Report Lost Item</span>
                                <span className="report-btn-arrow" aria-hidden="true">→</span>
                            </button>
                            <button
                                className="btn ghost report-btn report-btn-found"
                                onClick={() =>
                                    navigate(isLoggedIn ? "/items/new?type=found" : "/auth")
                                }
                            >
                                <span className="report-btn-icon" aria-hidden="true">!</span>
                                <span className="report-btn-title">Report Found Item</span>
                                <span className="report-btn-arrow" aria-hidden="true">→</span>
                            </button>
                        </div>
                    </div>

                    {error ? <div className="page-error">{error}</div> : null}
                    {!hasLoadedOnce && isLoading ? <div className="page-note">Loading items...</div> : null}

                    <div className="lost-controls">
                        <div className="segmented" role="tablist" aria-label="Item type filter">
                            <button
                                className={`seg-btn ${itemTypeFilter === "all" ? "active" : ""}`}
                                type="button"
                                onClick={() => setItemTypeFilter("all")}
                            >
                                All
                            </button>
                            <button
                                className={`seg-btn ${itemTypeFilter === "lost" ? "active" : ""}`}
                                type="button"
                                onClick={() => setItemTypeFilter("lost")}
                            >
                                Lost
                            </button>
                            <button
                                className={`seg-btn ${itemTypeFilter === "found" ? "active" : ""}`}
                                type="button"
                                onClick={() => setItemTypeFilter("found")}
                            >
                                Found
                            </button>
                        </div>

                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Search title, description, location..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>

                        <div className="filter-row">
                            <div className="filter-group">
                                <label>Tag (backend filter)</label>
                                <select
                                    value={tagFilter}
                                    onChange={(e) => setTagFilter(e.target.value)}
                                >
                                    <option value="">All tags</option>
                                    {availableTags.map((tag) => (
                                        <option key={tag} value={tag}>
                                            {tag}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Owner ID (backend filter)</label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="example: 1"
                                    value={ownerFilter}
                                    onChange={(e) => setOwnerFilter(e.target.value)}
                                />
                            </div>

                            <div className="filter-group">
                                <label>Location (client filter)</label>
                                <input
                                    type="text"
                                    placeholder="Search by location..."
                                    value={locationQuery}
                                    onChange={(e) => setLocationQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <MapView items={filteredItems} onSelectItem={setSelectedItem} />

                    <ItemCardsGrid
                        items={filteredItems}
                        onSelectItem={setSelectedItem}
                        resolveImageUrl={resolveImageUrl}
                        showEmpty={!isLoading}
                    />
                </div>
            </main>

            <Footer />

            {selectedItem ? (
                <ItemDetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onItemChange={handleItemUpdated}
                    formatDateTime={formatDateTime}
                    showEditAction={canEditSelectedItem}
                    onEditItem={() => navigate(`/items/${selectedItem.id}/edit`)}
                />
            ) : null}
        </div>
    );
};

export default LostPage;
