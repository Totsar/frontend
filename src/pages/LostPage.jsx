// src/pages/LostPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MapView from "../components/map/MapView";
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

const formatCoordinate = (value) =>
    Number.isFinite(Number(value)) ? Number(value).toFixed(6) : "-";

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
    const [ownerFilter, setOwnerFilter] = useState("");
    const [debouncedOwnerFilter, setDebouncedOwnerFilter] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [error, setError] = useState("");
    const [availableTags, setAvailableTags] = useState(() => uniqueTags(tagOptions));
    const [commentDraft, setCommentDraft] = useState("");
    const [commentActionError, setCommentActionError] = useState("");
    const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentText, setEditingCommentText] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTagFilter(tagFilter);
            setDebouncedOwnerFilter(ownerFilter);
        }, 250);
        return () => clearTimeout(timer);
    }, [tagFilter, ownerFilter]);

    useEffect(() => {
        setCommentActionError("");
        setCommentDraft("");
        setEditingCommentId(null);
        setEditingCommentText("");
    }, [selectedItem?.id]);

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
                    owner: /^\d+$/.test(normalizedOwner) ? normalizedOwner : "",
                });
                if (!cancelled) {
                    setItems(Array.isArray(data) ? data : []);
                    const backendTags = Array.isArray(data)
                        ? data.flatMap((item) => item.tags || [])
                        : [];
                    setAvailableTags((prev) => uniqueTags([...prev, ...backendTags]));
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
    }, [debouncedQuery, debouncedTagFilter, debouncedOwnerFilter]);

    const filteredItems = useMemo(() => {
        return items.filter((item) =>
            (item.location || "").toLowerCase().includes(locationQuery.toLowerCase())
        );
    }, [items, locationQuery]);

    const canEditSelectedItem =
        !!selectedItem && !!auth?.user?.id && selectedItem.userId === auth.user.id;

    const refreshSelectedItem = async (itemId) => {
        const latest = await itemService.getItem(itemId);
        setSelectedItem(latest);
        setItems((prev) => prev.map((item) => (item.id === latest.id ? latest : item)));
    };

    const handleCreateComment = async () => {
        if (!selectedItem) return;
        if (!isLoggedIn || !auth?.accessToken) {
            setCommentActionError("Please log in to comment.");
            return;
        }

        const text = commentDraft.trim();
        if (!text) {
            setCommentActionError("Comment text cannot be empty.");
            return;
        }

        setCommentActionError("");
        setIsCommentSubmitting(true);
        try {
            await itemService.createComment(selectedItem.id, text);
            setCommentDraft("");
            await refreshSelectedItem(selectedItem.id);
        } catch (err) {
            const detail = err instanceof Error ? err.message : "Failed to create comment";
            setCommentActionError(detail);
        } finally {
            setIsCommentSubmitting(false);
        }
    };

    const startEditingComment = (comment) => {
        setCommentActionError("");
        setEditingCommentId(comment.id);
        setEditingCommentText(comment.text || "");
    };

    const cancelEditingComment = () => {
        setEditingCommentId(null);
        setEditingCommentText("");
    };

    const handleUpdateComment = async (commentId) => {
        if (!selectedItem || !auth?.accessToken) return;

        const text = editingCommentText.trim();
        if (!text) {
            setCommentActionError("Comment text cannot be empty.");
            return;
        }

        setCommentActionError("");
        setIsCommentSubmitting(true);
        try {
            await itemService.updateComment(selectedItem.id, commentId, text);
            cancelEditingComment();
            await refreshSelectedItem(selectedItem.id);
        } catch (err) {
            const detail = err instanceof Error ? err.message : "Failed to update comment";
            setCommentActionError(detail);
        } finally {
            setIsCommentSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!selectedItem || !auth?.accessToken) return;

        setCommentActionError("");
        setIsCommentSubmitting(true);
        try {
            await itemService.deleteComment(selectedItem.id, commentId);
            if (editingCommentId === commentId) {
                cancelEditingComment();
            }
            await refreshSelectedItem(selectedItem.id);
        } catch (err) {
            const detail = err instanceof Error ? err.message : "Failed to delete comment";
            setCommentActionError(detail);
        } finally {
            setIsCommentSubmitting(false);
        }
    };

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
                    {!hasLoadedOnce && isLoading ? <div className="page-note">Loading items...</div> : null}

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
                            {commentActionError ? (
                                <div className="comment-error">{commentActionError}</div>
                            ) : null}
                            <div className="comment-editor">
                                <textarea
                                    rows="3"
                                    value={commentDraft}
                                    onChange={(e) => setCommentDraft(e.target.value)}
                                    placeholder={
                                        isLoggedIn
                                            ? "Write a comment..."
                                            : "Log in to add a comment"
                                    }
                                    disabled={!isLoggedIn || isCommentSubmitting}
                                />
                                <div className="comment-editor-actions">
                                    <button
                                        className="btn primary"
                                        type="button"
                                        onClick={handleCreateComment}
                                        disabled={!isLoggedIn || isCommentSubmitting}
                                    >
                                        {isCommentSubmitting ? "Saving..." : "Add comment"}
                                    </button>
                                </div>
                            </div>
                            <div className="comments-list">
                                {(selectedItem.comments || []).length ? (
                                    selectedItem.comments.map((comment) => (
                                        <div className="comment" key={comment.id}>
                                            <div className="comment-head">
                                                <strong>User #{comment.userId}</strong>
                                                <span>{formatDateTime(comment.createdAt)}</span>
                                            </div>
                                            {editingCommentId === comment.id ? (
                                                <div className="comment-editor inline">
                                                    <textarea
                                                        rows="3"
                                                        value={editingCommentText}
                                                        onChange={(e) => setEditingCommentText(e.target.value)}
                                                        disabled={isCommentSubmitting}
                                                    />
                                                    <div className="comment-editor-actions">
                                                        <button
                                                            className="btn primary"
                                                            type="button"
                                                            onClick={() => handleUpdateComment(comment.id)}
                                                            disabled={isCommentSubmitting}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            className="btn ghost"
                                                            type="button"
                                                            onClick={cancelEditingComment}
                                                            disabled={isCommentSubmitting}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p>{comment.text}</p>
                                            )}
                                            {isLoggedIn && auth?.user?.id === comment.userId ? (
                                                <div className="comment-actions">
                                                    <button
                                                        className="btn ghost"
                                                        type="button"
                                                        onClick={() => startEditingComment(comment)}
                                                        disabled={isCommentSubmitting}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn ghost"
                                                        type="button"
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        disabled={isCommentSubmitting}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            ) : null}
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
