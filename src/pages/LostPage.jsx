// src/pages/LostPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MapView from "../components/map/MapView";
import { useAuth } from "../context/AuthContext";
import { itemService } from "../services/itemService";

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

const formatCoordinate = (value) =>
    Number.isFinite(Number(value)) ? Number(value).toFixed(6) : "-";

const LostPage = () => {
    const navigate = useNavigate();
    const { auth, isLoggedIn } = useAuth();
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [tagFilter, setTagFilter] = useState("");
    const [ownerFilter, setOwnerFilter] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        let cancelled = false;
        const normalizedOwner = ownerFilter.trim();

        const loadItems = async () => {
            setError("");
            setIsLoading(true);
            try {
                const data = await itemService.listItems({
                    search: debouncedQuery.trim(),
                    tag: tagFilter.trim(),
                    owner: /^\d+$/.test(normalizedOwner) ? normalizedOwner : "",
                });
                if (!cancelled) {
                    setItems(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (cancelled) return;
                const detail = err instanceof Error ? err.message : "Failed to load items";
                setError(detail);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadItems();

        return () => {
            cancelled = true;
        };
    }, [debouncedQuery, tagFilter, ownerFilter]);

    const filteredItems = useMemo(() => {
        return items.filter((item) =>
            (item.location || "").toLowerCase().includes(locationQuery.toLowerCase())
        );
    }, [items, locationQuery]);

    const canEditSelectedItem =
        !!selectedItem && !!auth?.user?.id && selectedItem.userId === auth.user.id;

    return (
        <div className="page">
            <Header />

            <main className="page-content">
                <div className="container lost-page">
                    <div className="lost-header">
                        <div>
                            <h1 className="page-title">Items list</h1>
                            <p className="page-subtitle">
                                Browse and search for lost and found items
                            </p>
                        </div>

                        <button
                            className="btn primary"
                            onClick={() => navigate(isLoggedIn ? "/items/new" : "/auth")}
                        >
                            + Add new item
                        </button>
                    </div>

                    {error ? <div className="page-error">{error}</div> : null}
                    {isLoading ? <div className="page-note">Loading items...</div> : null}

                    <div className="lost-controls">
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
                                <input
                                    type="text"
                                    placeholder="example: electronics"
                                    value={tagFilter}
                                    onChange={(e) => setTagFilter(e.target.value)}
                                />
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

                    <div className="items-grid">
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className="item-card"
                                onClick={() => setSelectedItem(item)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="item-thumb">
                                    {item.image ? (
                                        <img
                                            src={resolveImageUrl(item.image)}
                                            alt={item.title}
                                            className="item-thumb-image"
                                        />
                                    ) : (
                                        "?"
                                    )}
                                </div>
                                <div className="item-body">
                                    <div className="item-title-row">
                                        <h3>{item.title}</h3>
                                    </div>
                                    <div className="item-tags">
                                        {(item.tags || []).length ? (
                                            item.tags.map((tag) => (
                                                <span key={`${item.id}-${tag}`} className="tag">
                                                    {tag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="tag">untagged</span>
                                        )}
                                    </div>
                                    <div className="item-meta">
                                        <span>{item.location || "-"}</span>
                                        <span>{formatDateTime(item.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!isLoading && filteredItems.length === 0 ? (
                            <div className="empty-state">No items found.</div>
                        ) : null}
                    </div>
                </div>
            </main>

            <Footer />

            {selectedItem ? (
                <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{selectedItem.title}</h2>
                                <div className="tag">ID: {selectedItem.id}</div>
                            </div>
                            <button className="icon-btn" onClick={() => setSelectedItem(null)}>
                                X
                            </button>
                        </div>

                        <section className="modal-section">
                            <h4>Description</h4>
                            <p>{selectedItem.description || "No description."}</p>
                        </section>

                        <section className="modal-section">
                            <h4>Tags</h4>
                            <div className="item-tags">
                                {(selectedItem.tags || []).length ? (
                                    selectedItem.tags.map((tag) => (
                                        <span key={`${selectedItem.id}-${tag}`} className="tag">
                                            {tag}
                                        </span>
                                    ))
                                ) : (
                                    <span className="tag">untagged</span>
                                )}
                            </div>
                        </section>

                        <section className="modal-section">
                            <h4>Location text</h4>
                            <p>{selectedItem.location || "-"}</p>
                        </section>

                        <section className="modal-section">
                            <h4>Coordinates</h4>
                            <div className="info-box">
                                <div>Latitude: {formatCoordinate(selectedItem.latitude)}</div>
                                <div>Longitude: {formatCoordinate(selectedItem.longitude)}</div>
                            </div>
                        </section>

                        <section className="modal-section">
                            <h4>Submitter info</h4>
                            <div className="info-box">
                                <div>Owner user ID: {selectedItem.userId}</div>
                                <div>Submitted: {formatDateTime(selectedItem.createdAt)}</div>
                            </div>
                        </section>

                        <section className="modal-section">
                            <h4>Comments ({(selectedItem.comments || []).length})</h4>
                            <div className="comments-list">
                                {(selectedItem.comments || []).length ? (
                                    selectedItem.comments.map((comment) => (
                                        <div className="comment" key={comment.id}>
                                            <div className="comment-head">
                                                <strong>User #{comment.userId}</strong>
                                                <span>{formatDateTime(comment.createdAt)}</span>
                                            </div>
                                            <p>{comment.text}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="comment">
                                        <p>No comments yet.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {canEditSelectedItem ? (
                            <div className="modal-actions">
                                <button
                                    className="btn ghost"
                                    onClick={() => navigate(`/items/${selectedItem.id}/edit`)}
                                >
                                    Edit item
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default LostPage;
