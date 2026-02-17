// src/components/layout/Header.jsx
import { NavLink } from "react-router-dom";
import logo from "../../assets/logo.png";

const Header = () => {
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
                    <NavLink to="/map" className="nav-link">Map</NavLink>
                    <NavLink to="/lost" className="nav-link">Lost Items</NavLink>
                    <NavLink to="/auth" className="nav-link">Log in / Sign up</NavLink>
                </nav>
            </div>
        </header>
    );
};

export default Header;
