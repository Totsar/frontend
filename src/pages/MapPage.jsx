// src/pages/MapPage.jsx
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MapView from "../components/map/MapView";

const MapPage = () => {
    return (
        <div className="page">
            <Header />

            <main className="page-content">
                <div className="container">
                    <h1 className="page-title">Campus map</h1>
                    <p className="page-subtitle">Interactive map of Sharif University</p>
                    <MapView />
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default MapPage;
