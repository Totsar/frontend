// src/pages/MapPage.jsx
import { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MapView from "../components/map/MapView";
import { itemService } from "../services/itemService";

const MapPage = () => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadItems = async () => {
            setError("");
            setIsLoading(true);
            try {
                const data = await itemService.listItems();
                if (!cancelled) {
                    setItems(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (cancelled) return;
                const detail = err instanceof Error ? err.message : "Failed to load map items";
                setError(detail);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadItems();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="page">
            <Header />

            <main className="page-content">
                <div className="container">
                    <h1 className="page-title">Campus map</h1>
                    <p className="page-subtitle">
                        Item markers are loaded from backend coordinates
                    </p>
                    {error ? <div className="page-error">{error}</div> : null}
                    {isLoading ? <div className="page-note">Loading map items...</div> : null}
                    <MapView items={items} />
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default MapPage;
