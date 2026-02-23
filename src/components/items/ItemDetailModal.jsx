import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import MapView from "../map/MapView";
import { itemService } from "../../services/itemService";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const formatCoordinate = (value) =>
    Number.isFinite(Number(value)) ? Number(value).toFixed(6) : "-";

const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
    return `${API_BASE}${imageUrl}`;
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

const COMMENT_REPORT_REASONS = [
    { value: "spam", label: "Spam" },
    { value: "offensive", label: "Offensive / inappropriate" },
    { value: "harassment", label: "Harassment" },
    { value: "irrelevant", label: "Irrelevant" },
    { value: "other", label: "Other" },
];

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
    const [reportModalComment, setReportModalComment] = useState(null);
    const [reportReason, setReportReason] = useState("spam");
    const [reportNote, setReportNote] = useState("");
    const [isReportSubmitting, setIsReportSubmitting] = useState(false);
    const [reportActionMessage, setReportActionMessage] = useState("");

    useEffect(() => {
        setCommentActionError("");
        setReportActionMessage("");
        setCommentDraft("");
        setEditingCommentId(null);
        setEditingCommentText("");
        setReportModalComment(null);
        setReportReason("spam");
        setReportNote("");
    }, [item?.id]);

    if (!item) return null;
    const itemType = getItemType(item);
    const hasCoordinates =
        Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude));
    const itemMapCenter = hasCoordinates
        ? [Number(item.latitude), Number(item.longitude)]
        : undefined;
    const relativeCreatedAt = formatRelativeTime(item.createdAt);
    const detailedCreatedAt = formatDateTime ? formatDateTime(item.createdAt) : "-";

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

    const openReportModal = (comment) => {
        setCommentActionError("");
        setReportActionMessage("");
        setReportModalComment(comment);
        setReportReason("spam");
        setReportNote("");
    };

    const closeReportModal = () => {
        if (isReportSubmitting) return;
        setReportModalComment(null);
    };

    const handleSubmitReport = async () => {
        if (!reportModalComment) return;
        if (!isLoggedIn) {
            setCommentActionError("Please log in to report comments.");
            return;
        }

        setCommentActionError("");
        setReportActionMessage("");
        setIsReportSubmitting(true);
        try {
            const note = reportReason === "other" ? reportNote.trim() : "";
            await itemService.reportComment(item.id, reportModalComment.id, reportReason, note);
            closeReportModal();
            setReportActionMessage("Report submitted.");
            await refreshCurrentItem();
        } catch (err) {
            const detail = err instanceof Error ? err.message : "Failed to report comment";
            setCommentActionError(detail);
        } finally {
            setIsReportSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>{item.title || `Item #${item.id}`}</h2>
                        <div className="modal-type-row">
                            <span className={`status ${itemType}`}>{getItemTypeLabel(itemType)}</span>
                            <span className="tag">ID: {item.id}</span>
                        </div>
                    </div>
                    <button className="icon-btn" onClick={onClose}>
                        X
                    </button>
                </div>

                <section className="modal-section">
                    <h4>Image</h4>
                    {item.image ? (
                        <div className="image-dropzone-preview-wrap">
                            <img
                                src={resolveImageUrl(item.image)}
                                alt={item.title || `Item #${item.id}`}
                                className="image-dropzone-preview"
                            />
                        </div>
                    ) : (
                        <div className="info-box">No image uploaded.</div>
                    )}
                </section>

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
                        <div>Submitted: {relativeCreatedAt}</div>
                        <div className="info-detail">Exact time: {detailedCreatedAt}</div>
                    </div>
                </section>

                <section className="modal-section">
                    <h4>Comments ({(item.comments || []).length})</h4>
                    {commentActionError ? <div className="comment-error">{commentActionError}</div> : null}
                    {reportActionMessage ? <div className="page-note">{reportActionMessage}</div> : null}
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
                                        <div className="comment-head-meta">
                                            <span>{formatDateTime ? formatDateTime(comment.createdAt) : "-"}</span>
                                            {isLoggedIn && auth?.user?.id !== comment.userId ? (
                                                <button
                                                    type="button"
                                                    className="comment-report-btn"
                                                    onClick={() => openReportModal(comment)}
                                                    disabled={comment.canReport === false || isReportSubmitting}
                                                    aria-label={
                                                        comment.isReportedByMe ? "Comment already reported" : "Report comment"
                                                    }
                                                    title={comment.isReportedByMe ? "Reported" : "Report comment"}
                                                >
                                                    {comment.isReportedByMe ? "Reported" : "!"}
                                                </button>
                                            ) : null}
                                        </div>
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
            {reportModalComment ? (
                <div
                    className="modal-backdrop report-modal-backdrop"
                    onClick={(event) => {
                        event.stopPropagation();
                        closeReportModal();
                    }}
                >
                    <div className="report-modal-card" onClick={(event) => event.stopPropagation()}>
                        <h3>Report comment</h3>
                        <p className="report-modal-text">Why are you reporting this comment?</p>
                        <label htmlFor="comment-report-reason">Reason</label>
                        <select
                            id="comment-report-reason"
                            value={reportReason}
                            onChange={(event) => setReportReason(event.target.value)}
                            disabled={isReportSubmitting}
                        >
                            {COMMENT_REPORT_REASONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {reportReason === "other" ? (
                            <>
                                <label htmlFor="comment-report-note">Short note (optional)</label>
                                <input
                                    id="comment-report-note"
                                    type="text"
                                    maxLength={280}
                                    value={reportNote}
                                    onChange={(event) => setReportNote(event.target.value)}
                                    disabled={isReportSubmitting}
                                    placeholder="Optional details"
                                />
                            </>
                        ) : null}
                        <div className="report-modal-actions">
                            <button
                                type="button"
                                className="btn ghost"
                                onClick={closeReportModal}
                                disabled={isReportSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn primary"
                                onClick={handleSubmitReport}
                                disabled={isReportSubmitting}
                            >
                                {isReportSubmitting ? "Submitting..." : "Submit report"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default ItemDetailModal;
