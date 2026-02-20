const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const buildErrorMessage = (payload, fallback) => {
    if (!payload) return fallback;

    if (typeof payload.detail === "string" && payload.detail.trim()) {
        return payload.detail;
    }

    for (const value of Object.values(payload)) {
        if (Array.isArray(value) && value.length > 0) {
            return String(value[0]);
        }
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }

    return fallback;
};

const request = async (url, options = {}, fallbackError = "Request failed") => {
    const res = await fetch(url, options);

    let payload = null;
    try {
        payload = await res.json();
    } catch (_err) {
        payload = null;
    }

    if (!res.ok) {
        throw new Error(buildErrorMessage(payload, fallbackError));
    }

    return payload;
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
        return request(`${API_BASE}/api/item${suffix}`, {}, "Failed to load items");
    },

    async getItem(itemId) {
        return request(`${API_BASE}/api/item/${itemId}`, {}, "Failed to load item");
    },

    async createItem(data, accessToken) {
        return request(
            `${API_BASE}/api/item`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(data),
            },
            "Failed to create item"
        );
    },

    async updateItem(itemId, data, accessToken) {
        return request(
            `${API_BASE}/api/item/${itemId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(data),
            },
            "Failed to update item"
        );
    },
};
