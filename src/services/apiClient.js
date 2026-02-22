const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const AUTH_EXPIRED_EVENT = "auth:expired";
export const AUTH_UPDATED_EVENT = "auth:updated";

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

const parseJson = async (res) => {
    try {
        return await res.json();
    } catch {
        return null;
    }
};

const getStoredAuth = () => {
    try {
        const raw = localStorage.getItem("auth");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const setStoredAuth = (auth) => {
    localStorage.setItem("auth", JSON.stringify(auth));
    window.dispatchEvent(new CustomEvent(AUTH_UPDATED_EVENT, { detail: auth }));
};

const clearStoredAuth = () => {
    localStorage.removeItem("auth");
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
};

let refreshPromise = null;

const refreshAccessToken = async () => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        const auth = getStoredAuth();
        if (!auth?.refreshToken) {
            throw new Error("No refresh token available.");
        }

        const res = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: auth.refreshToken }),
        });

        if (!res.ok) {
            throw new Error("Refresh failed.");
        }

        const payload = await parseJson(res);
        const nextAccessToken = payload?.accessToken;
        if (!nextAccessToken) {
            throw new Error("Refresh did not return access token.");
        }

        const nextAuth = { ...auth, accessToken: nextAccessToken };
        setStoredAuth(nextAuth);
        return nextAccessToken;
    })()
        .catch((err) => {
            clearStoredAuth();
            throw err;
        })
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
};

const sendRequest = async ({ path, method, body, headers }) => {
    const url = path.startsWith("http://") || path.startsWith("https://")
        ? path
        : `${API_BASE}${path}`;

    const res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    return { res, payload: await parseJson(res) };
};

export const requestJson = async ({
    path,
    method = "GET",
    body,
    headers = {},
    fallbackError = "Request failed",
}) => {
    const nextHeaders = { ...headers };
    if (body !== undefined) {
        nextHeaders["Content-Type"] = "application/json";
    }

    const { res, payload } = await sendRequest({
        path,
        method,
        body,
        headers: nextHeaders,
    });

    if (!res.ok) {
        throw new Error(buildErrorMessage(payload, fallbackError));
    }

    if (res.status === 204) return null;
    return payload;
};

export const authenticatedRequestJson = async ({
    path,
    method = "GET",
    body,
    fallbackError = "Request failed",
}) => {
    const auth = getStoredAuth();
    const token = auth?.accessToken;

    const attempt = async (accessToken) => {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        if (body !== undefined) {
            headers["Content-Type"] = "application/json";
        }

        return sendRequest({
            path,
            method,
            body,
            headers,
        });
    };

    let { res, payload } = await attempt(token);

    if (res.status === 401) {
        try {
            const refreshedToken = await refreshAccessToken();
            ({ res, payload } = await attempt(refreshedToken));
        } catch {
            throw new Error("Session expired. Please log in again.");
        }
    }

    if (!res.ok) {
        throw new Error(buildErrorMessage(payload, fallbackError));
    }

    if (res.status === 204) return null;
    return payload;
};
