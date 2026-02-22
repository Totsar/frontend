import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import MapView from "../map/MapView";
import { itemService } from "../../services/itemService";

const formatCoordinate = (value) =>
    Number.isFinite(Number(value)) ? Number(value).toFixed(6) : "-";

const ItemDetailModal = ({
    item,
    onClose,
    onItemChange,
    formatDateTime,
    showEditAction = false,
    onEditItem,
}) => {
    const { auth, isLoggedIn } = useAuth();
    const [commentDraft, setCommentDraft] = useState("");
    const [commentActionError, setCommentActionError] = useState("");
    const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentText, setEditingCommentText] = useState("");

    useEffect(() => {
        setCommentActionError("");
        setCommentDraft("");
        setEditingCommentId(null);
        setEditingCommentText("");
    }, [item?.id]);

    if (!item) return null;
    const hasCoordinates =
        Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude));
    const itemMapCenter = hasCoordinates
        ? [Number(item.latitude), Number(item.longitude)]
        : undefined;

    const refreshCurrentItem = async () => {
        const latest = await itemService.getItem(item.id);
        onItemChange?.(latest);
    };

    const handleCreateComment = async () => {
        if (!isLoggedIn) {
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
            await itemService.createComment(item.id, text);
            setCommentDraft("");
            await refreshCurrentItem();
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
        const text = editingCommentText.trim();
        if (!text) {
            setCommentActionError("Comment text cannot be empty.");
            return;
        }

        setCommentActionError("");
        setIsCommentSubmitting(true);
        try {
            await itemService.updateComment(item.id, commentId, text);
            cancelEditingComment();
            await refreshCurrentItem();
        } catch (err) {
            const detail = err instanceof Error ? err.message : "Failed to update comment";
            setCommentActionError(detail);
        } finally {
            setIsCommentSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        setCommentActionError("");
        setIsCommentSubmitting(true);
        try {
            await itemService.deleteComment(item.id, commentId);
            if (editingCommentId === commentId) {
                cancelEditingComment();
            }
            await refreshCurrentItem();
        } catch (err) {
            const detail = err instanceof Error ? err.message : "Failed to delete comment";
            setCommentActionError(detail);
        } finally {
            setIsCommentSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>{item.title || `Item #${item.id}`}</h2>
                        <div className="tag">ID: {item.id}</div>
                    </div>
                    <button className="icon-btn" onClick={onClose}>
                        X
                    </button>
                </div>

                <section className="modal-section">
                    <h4>Description</h4>
                    <p>{item.description || "No description."}</p>
                </section>

                <section className="modal-section">
                    <h4>Tags</h4>
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
                </section>

                <section className="modal-section">
                    <h4>Location text</h4>
                    <p>{item.location || "-"}</p>
                </section>

                <section className="modal-section">
                    <h4>Coordinates</h4>
                    <div className="info-box">
                        <div>Latitude: {formatCoordinate(item.latitude)}</div>
                        <div>Longitude: {formatCoordinate(item.longitude)}</div>
                    </div>
                </section>

                <section className="modal-section">
                    <h4>Map preview</h4>
                    {hasCoordinates ? (
                        <div className="modal-map-wrap">
                            <MapView
                                items={[item]}
                                center={itemMapCenter}
                                zoom={16}
                                interactive={false}
                                showLegend={false}
                                compact
                            />
                        </div>
                    ) : (
                        <div className="info-box">No coordinates available for map preview.</div>
                    )}
                </section>

                <section className="modal-section">
                    <h4>Submitter info</h4>
                    <div className="info-box">
                        <div>Owner user ID: {item.userId || "-"}</div>
                        <div>Submitted: {formatDateTime ? formatDateTime(item.createdAt) : "-"}</div>
                    </div>
                </section>

                <section className="modal-section">
                    <h4>Comments ({(item.comments || []).length})</h4>
                    {commentActionError ? <div className="comment-error">{commentActionError}</div> : null}
                    <div className="comment-editor">
                        <textarea
                            rows="3"
                            value={commentDraft}
                            onChange={(e) => setCommentDraft(e.target.value)}
                            placeholder={isLoggedIn ? "Write a comment..." : "Log in to add a comment"}
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
                        {(item.comments || []).length ? (
                            item.comments.map((comment) => (
                                <div className="comment" key={comment.id}>
                                    <div className="comment-head">
                                        <strong>User #{comment.userId}</strong>
                                        <span>{formatDateTime ? formatDateTime(comment.createdAt) : "-"}</span>
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

                {showEditAction ? (
                    <div className="modal-actions">
                        <button className="btn ghost" onClick={onEditItem}>
                            Edit item
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default ItemDetailModal;
