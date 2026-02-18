// src/components/layout/Header.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

const Header = () => {
    const { isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();

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
                    <NavLink to="/map" className="nav-link">
                        Map
                    </NavLink>
                    <NavLink to="/lost" className="nav-link">
                        Lost Items
                    </NavLink>
                    <NavLink to="/chatbot" className="nav-link">
                        Chatbot
                    </NavLink>
                </nav>

                <div className="auth-actions">
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
