// src/services/authService.js
const API_BASE =
    (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000") + "/api/auth";

export const authService = {

    async requestOtp(email) {
        const res = await fetch(`${API_BASE}/register/request-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        if (!res.ok) {
            throw new Error("OTP request failed");
        }

        return true;
    },

    async login(email, password) {
        const res = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) throw new Error("Login failed");
        return res.json(); // { accessToken, refreshToken, user }
    },

    async register(data) {
        const res = await fetch(`${API_BASE}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Register failed");
        return res.json(); // { accessToken, refreshToken, user }
    },

    async logout(refreshToken) {
        const res = await fetch(`${API_BASE}/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) throw new Error("Logout failed");
        return res.json();
    },

    async refresh(refreshToken) {
        const res = await fetch(`${API_BASE}/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) throw new Error("Refresh failed");
        return res.json(); // { accessToken }
    },
};
