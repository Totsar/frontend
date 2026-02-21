import { authenticatedRequestJson, requestJson } from "./apiClient";

export const itemService = {
    async listItems(params = {}) {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && String(value).trim() !== "") {
                query.set(key, String(value));
            }
        }
        const suffix = query.toString() ? `?${query}` : "";
        return requestJson({
            path: `/api/item${suffix}`,
            fallbackError: "Failed to load items",
        });
    },

    async getItem(itemId) {
        return requestJson({
            path: `/api/item/${itemId}`,
            fallbackError: "Failed to load item",
        });
    },

    async createItem(data) {
        return authenticatedRequestJson({
            path: "/api/item",
            method: "POST",
            body: data,
            fallbackError: "Failed to create item",
        });
    },

    async updateItem(itemId, data) {
        return authenticatedRequestJson({
            path: `/api/item/${itemId}`,
            method: "PUT",
            body: data,
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
};
