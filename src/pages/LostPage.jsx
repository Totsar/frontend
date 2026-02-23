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

const DEFAULT_CENTER = [35.7036, 51.3515];
const MAP_REPORT_LONG_PRESS_MS = 700;

const formatCoordinate = (value) =>
    Number.isFinite(Number(value)) ? Number(value).toFixed(6) : "-";

const formatDateTime = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
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
    const [selectedMapPosition, setSelectedMapPosition] = useState(null);
    const [reportPromptPosition, setReportPromptPosition] = useState(null);
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [mapZoom, setMapZoom] = useState(15);
    const [isLocatingMap, setIsLocatingMap] = useState(false);
    const [mapLocationError, setMapLocationError] = useState("");
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

    const buildCreatePath = (itemType, position = null) => {
        const query = new URLSearchParams();
        query.set("type", itemType);
        const sourcePosition = position || selectedMapPosition;
        if (sourcePosition) {
            query.set("latitude", Number(sourcePosition.latitude).toFixed(6));
            query.set("longitude", Number(sourcePosition.longitude).toFixed(6));
        }
        return `/items/new?${query.toString()}`;
    };

    const handleUseMyLocationOnMap = () => {
        if (!navigator.geolocation) {
            setMapLocationError("Geolocation is not supported in this browser.");
            return;
        }

        setMapLocationError("");
        setIsLocatingMap(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                setMapCenter([latitude, longitude]);
                setMapZoom(17);
                setSelectedMapPosition({ latitude, longitude });
                setIsLocatingMap(false);
            },
            (locationError) => {
                const message =
                    locationError?.message || "Could not access your current location.";
                setMapLocationError(message);
                setIsLocatingMap(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000,
            }
        );
    };

    const handleItemUpdated = (latest) => {
        setSelectedItem(latest);
        setItems((prev) => prev.map((item) => (item.id === latest.id ? latest : item)));
    };

    const handleMapLongPress = (coords) => {
        setSelectedMapPosition(coords);
        setMapLocationError("");
        setReportPromptPosition(coords);
    };

    const closeReportPrompt = () => {
        setReportPromptPosition(null);
    };

    const handlePromptReport = (itemType) => {
        const position = reportPromptPosition || selectedMapPosition;
        closeReportPrompt();
        navigate(isLoggedIn ? buildCreatePath(itemType, position) : "/auth");
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
                                    navigate(isLoggedIn ? buildCreatePath("lost") : "/auth")
                                }
                            >
                                <span className="report-btn-icon" aria-hidden="true">?</span>
                                <span className="report-btn-title">Report Lost Item</span>
                                <span className="report-btn-arrow" aria-hidden="true">→</span>
                            </button>
                            <button
                                className="btn ghost report-btn report-btn-found"
                                onClick={() =>
                                    navigate(isLoggedIn ? buildCreatePath("found") : "/auth")
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

                        <div className="map-tools">
                            <button
                                className="btn ghost"
                                type="button"
                                onClick={handleUseMyLocationOnMap}
                                disabled={isLocatingMap}
                            >
                                {isLocatingMap ? "Locating..." : "Use my location on map"}
                            </button>
                            <button
                                className="btn ghost"
                                type="button"
                                onClick={() => setSelectedMapPosition(null)}
                                disabled={!selectedMapPosition}
                            >
                                Clear selected report point
                            </button>
                            <span className="map-tools-hint">
                                Long-press the map to open a report prompt for that location.
                            </span>
                        </div>
                        {mapLocationError ? <div className="inline-error">{mapLocationError}</div> : null}

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

                    <MapView
                        items={filteredItems}
                        center={mapCenter}
                        zoom={mapZoom}
                        onSelectItem={setSelectedItem}
                        selectable
                        selectedPosition={selectedMapPosition}
                        selectOnClick={false}
                        onLongPressPosition={handleMapLongPress}
                        longPressDurationMs={MAP_REPORT_LONG_PRESS_MS}
                        recenterOnCenterChange
                    />

                    <ItemCardsGrid
                        items={filteredItems}
                        onSelectItem={setSelectedItem}
                        showEmpty={!isLoading}
                    />
                </div>
            </main>

            <Footer />

            {reportPromptPosition ? (
                <div className="modal-backdrop" onClick={closeReportPrompt}>
                    <div className="report-prompt-card" onClick={(event) => event.stopPropagation()}>
                        <h3>Report item at this location?</h3>
                        <p className="report-prompt-text">
                            A long press selected this point for reporting.
                        </p>
                        <div className="report-prompt-coords">
                            <div>Latitude: {formatCoordinate(reportPromptPosition.latitude)}</div>
                            <div>Longitude: {formatCoordinate(reportPromptPosition.longitude)}</div>
                        </div>
                        <div className="report-prompt-actions">
                            <button
                                className="btn report-choice-btn report-choice-lost"
                                type="button"
                                onClick={() => handlePromptReport("lost")}
                            >
                                Report Lost Item
                            </button>
                            <button
                                className="btn report-choice-btn report-choice-found"
                                type="button"
                                onClick={() => handlePromptReport("found")}
                            >
                                Report Found Item
                            </button>
                            <button
                                className="btn ghost"
                                type="button"
                                onClick={closeReportPrompt}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

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
