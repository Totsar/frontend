// src/components/layout/Header.jsx
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

const COLORBLIND_STORAGE_KEY = "a11y:found-color-blue";

const Header = () => {
    const { isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();
    const [isColorblindMode, setIsColorblindMode] = useState(() => {
        return localStorage.getItem(COLORBLIND_STORAGE_KEY) === "1";
    });

    useEffect(() => {
        document.documentElement.classList.toggle("colorblind-assist", isColorblindMode);
        localStorage.setItem(COLORBLIND_STORAGE_KEY, isColorblindMode ? "1" : "0");
    }, [isColorblindMode]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/auth");
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <header className="site-header">
            <div className="container header-inner">
                <div className="brand">
                    <div className="brand-logo">
                        <img src={logo} alt="Brand logo" style={{ width: "41px", height: "auto" }} />
                    </div>
                    <div className="brand-text">
                        <strong>Lost & Found</strong>
                        <small>Campus lost-and-found platform</small>
                    </div>
                </div>

                <nav className="nav">
                    <NavLink to="/items" className="nav-link">
                        Items
                    </NavLink>
                    <NavLink to="/chatbot" className="nav-link">
                        Chatbot
                    </NavLink>
                </nav>

                <div className="auth-actions">
                    <div className="a11y-toggle">
                        <span className="a11y-toggle-label">Colorblind mode</span>
                        <button
                            className={`toggle-switch ${isColorblindMode ? "on" : "off"}`}
                            onClick={() => setIsColorblindMode((prev) => !prev)}
                            role="switch"
                            aria-checked={isColorblindMode}
                            type="button"
                            title="Toggle colorblind-friendly found-item color"
                        >
                            <span className="toggle-thumb" aria-hidden="true"></span>
                        </button>
                    </div>

                    {!isLoggedIn && (
                        <NavLink to="/auth" className="btn ghost">
                            Login / Register
                        </NavLink>
                    )}

                    {isLoggedIn && (
                        <button className="btn ghost" onClick={handleLogout}>
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
