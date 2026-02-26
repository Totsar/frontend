import { authenticatedRequestJson, optionalAuthenticatedRequestJson } from "./apiClient";
import { cacheGet, cacheSet } from "../utils/cache";

const CACHE_TTL_MS = 1000 * 60 * 30;

const isFile = (value) => typeof File !== "undefined" && value instanceof File;

const appendScalar = (formData, key, value) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && value.trim() === "") return;
    formData.append(key, String(value));
};

const buildItemFormData = (data = {}) => {
    const formData = new FormData();
    appendScalar(formData, "title", data.title);
    appendScalar(formData, "itemType", data.itemType);
    appendScalar(formData, "location", data.location);
    appendScalar(formData, "description", data.description);
    appendScalar(formData, "latitude", data.latitude);
    appendScalar(formData, "longitude", data.longitude);
    appendScalar(formData, "imagePreviewY", data.imagePreviewY);

    if (Array.isArray(data.tags)) {
        data.tags.forEach((tag, index) => {
            if (tag === undefined || tag === null) return;
            formData.append(`tags[${index}]`, String(tag));
        });
    }
    if (isFile(data.imageFile)) {
        formData.append("image", data.imageFile);
    }
    if (data.removeImage) {
        formData.append("removeImage", "true");
    }

    return formData;
};

export const itemService = {
    async listItems(params = {}) {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && String(value).trim() !== "") {
                query.set(key, String(value));
            }
        }
        const suffix = query.toString() ? `?${query}` : "";

        const cacheKey = `items:list:${query.toString() || "all"}`;
        const now = Date.now();

        try {
            const data = await optionalAuthenticatedRequestJson({
                path: `/api/item${suffix}`,
                fallbackError: "Failed to load items",
            });

            await cacheSet(cacheKey, {
                data,
                cachedAt: now,
            });

            return data;
        } catch (error) {
            const cached = await cacheGet(cacheKey);
            if (cached?.data) {
                const isFresh = now - cached.cachedAt <= CACHE_TTL_MS;
                return {
                    ...cached.data,
                    _fromCache: true,
                    _cachedAt: cached.cachedAt,
                    _cacheFresh: isFresh,
                };
            }
            throw error;
        }
    },

    async getItem(itemId) {
        return optionalAuthenticatedRequestJson({
            path: `/api/item/${itemId}`,
            fallbackError: "Failed to load item",
        });
    },

    async createItem(data) {
        return authenticatedRequestJson({
            path: "/api/item",
            method: "POST",
            body: buildItemFormData(data),
            fallbackError: "Failed to create item",
        });
    },

    async updateItem(itemId, data) {
        return authenticatedRequestJson({
            path: `/api/item/${itemId}`,
            method: "PUT",
            body: buildItemFormData(data),
            fallbackError: "Failed to update item",
        });
    },

    async createComment(itemId, text) {
        return authenticatedRequestJson({
            path: `/api/item/${itemId}/comment`,
            method: "POST",
            body: { text },
            fallbackError: "Failed to create comment",
        });
    },

    async updateComment(itemId, commentId, text) {
        return authenticatedRequestJson({
            path: `/api/item/${itemId}/comment/${commentId}`,
            method: "PUT",
            body: { text },
            fallbackError: "Failed to update comment",
        });
    },

    async deleteComment(itemId, commentId) {
        await authenticatedRequestJson({
            path: `/api/item/${itemId}/comment/${commentId}`,
            method: "DELETE",
            fallbackError: "Failed to delete comment",
        });
    },

    async reportComment(itemId, commentId, reason, note = "") {
        return authenticatedRequestJson({
            path: `/api/item/${itemId}/comment/${commentId}/report`,
            method: "POST",
            body: { reason, note },
            fallbackError: "Failed to report comment",
        });
    },
};
