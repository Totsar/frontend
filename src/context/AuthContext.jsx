// src/context/AuthContext.jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { AUTH_EXPIRED_EVENT, AUTH_UPDATED_EVENT } from "../services/apiClient";

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

    useEffect(() => {
        const onAuthExpired = () => {
            clearAuth();
        };

        const onAuthUpdated = (event) => {
            if (event?.detail) {
                setAuth(event.detail);
            }
        };

        window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
        window.addEventListener(AUTH_UPDATED_EVENT, onAuthUpdated);

        return () => {
            window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
            window.removeEventListener(AUTH_UPDATED_EVENT, onAuthUpdated);
        };
    }, []);

    const login = useCallback(async (email, password) => {
        const data = await authService.login(email, password);
        saveAuth(data);
        return data;
    }, []);

    const register = useCallback(async (payload) => {
        const data = await authService.register(payload);
        saveAuth(data);
        return data;
    }, []);

    // src/context/AuthContext.jsx
    const logout = useCallback(async () => {
        try {
            if (auth?.refreshToken) {
                await authService.logout(auth.refreshToken);
            }
        } catch (err) {
            console.warn("Logout API failed, clearing local auth anyway.", err);
        } finally {
            clearAuth();
        }
    }, [auth?.refreshToken]);


    const value = useMemo(
        () => ({
            auth,
            isLoggedIn: !!auth?.accessToken,
            login,
            register,
            logout,
            setAuth: saveAuth,
        }),
        [auth, login, register, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
