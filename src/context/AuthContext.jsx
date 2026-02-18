// src/context/AuthContext.jsx
import { createContext, useContext, useMemo, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(() => {
        const stored = localStorage.getItem("auth");
        return stored ? JSON.parse(stored) : null;
    });

    const saveAuth = (data) => {
        setAuth(data);
        localStorage.setItem("auth", JSON.stringify(data));
    };

    const clearAuth = () => {
        setAuth(null);
        localStorage.removeItem("auth");
    };

    const login = async (email, password) => {
        const data = await authService.login(email, password);
        saveAuth(data);
        return data;
    };

    const register = async (payload) => {
        const data = await authService.register(payload);
        saveAuth(data);
        return data;
    };

    // src/context/AuthContext.jsx
    const logout = async () => {
        try {
            if (auth?.refreshToken) {
                await authService.logout(auth.refreshToken);
            }
        } catch (err) {
            console.warn("Logout API failed, clearing local auth anyway.", err);
        } finally {
            clearAuth();
        }
    };


    const value = useMemo(
        () => ({
            auth,
            isLoggedIn: !!auth?.accessToken,
            login,
            register,
            logout,
            setAuth: saveAuth,
        }),
        [auth]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
