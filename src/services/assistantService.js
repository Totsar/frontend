const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const assistantService = {
    async findLostItems(query) {
        const res = await fetch(`${API_BASE}/api/assistant/lost-item`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        });

        let payload = null;
        try {
            payload = await res.json();
        } catch (_err) {
            payload = null;
        }

        if (!res.ok) {
            const detail = payload?.detail || "Assistant request failed";
            throw new Error(detail);
        }

        return payload;
    },
};
