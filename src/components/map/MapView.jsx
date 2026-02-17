// src/components/map/MapView.jsx
import { MapContainer, TileLayer } from "react-leaflet";

const MapView = () => {
    return (
        <div className="map-card">
            <MapContainer
                center={[35.7036, 51.3515]}
                zoom={15}
                scrollWheelZoom
                className="map-container"
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            </MapContainer>

            <div className="map-legend">
                <h4>Map legend</h4>
                <div className="legend-item">
                    <span className="dot red"></span> Lost item
                </div>
                <div className="legend-item">
                    <span className="dot green"></span> Found item
                </div>
            </div>
        </div>
    );
};

export default MapView;
