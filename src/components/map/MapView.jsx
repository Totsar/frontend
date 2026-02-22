// src/components/map/MapView.jsx
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";

const DEFAULT_CENTER = [35.7036, 51.3515];

const ITEM_PIN_ICON = L.icon({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const parseCoordinates = (item) => {
    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }
    return [latitude, longitude];
};

const MapPinSelector = ({ enabled, onSelectPosition }) => {
    useMapEvents({
        click(event) {
            if (!enabled || !onSelectPosition) return;
            onSelectPosition({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            });
        },
    });

    return null;
};

const MapView = ({
    items = [],
    center = DEFAULT_CENTER,
    zoom = 15,
    onSelectItem,
    selectable = false,
    selectedPosition = null,
    onSelectPosition,
    interactive = true,
    showLegend = true,
    compact = false,
}) => {
    const itemsWithCoordinates = items
        .map((item) => ({ item, coordinates: parseCoordinates(item) }))
        .filter((entry) => !!entry.coordinates);

    const selectedCoordinates =
        selectedPosition && Number.isFinite(selectedPosition.latitude) && Number.isFinite(selectedPosition.longitude)
            ? [selectedPosition.latitude, selectedPosition.longitude]
            : null;

    return (
        <div className="map-card">
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={interactive}
                dragging={interactive}
                touchZoom={interactive}
                doubleClickZoom={interactive}
                boxZoom={interactive}
                keyboard={interactive}
                zoomControl={interactive}
                className={`map-container${compact ? " compact" : ""}`}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapPinSelector enabled={selectable} onSelectPosition={onSelectPosition} />

                {itemsWithCoordinates.map(({ item, coordinates }) => (
                    <Marker
                        key={item.id}
                        position={coordinates}
                        icon={ITEM_PIN_ICON}
                        eventHandlers={
                            onSelectItem
                                ? {
                                      click: () => onSelectItem(item),
                                  }
                                : undefined
                        }
                    >
                        <Popup>
                            <strong>{item.title || "Item"}</strong>
                            <br />
                            {item.location || "No location text"}
                        </Popup>
                    </Marker>
                ))}

                {selectedCoordinates ? (
                    <Marker position={selectedCoordinates} icon={ITEM_PIN_ICON}>
                        <Popup>Selected pin position</Popup>
                    </Marker>
                ) : null}
            </MapContainer>

            {showLegend ? (
                <div className="map-legend">
                    <h4>Map legend</h4>
                    <div className="legend-item">
                        <span className="dot red"></span> Item coordinate
                    </div>
                    {selectable ? (
                        <div className="legend-item">
                            <span className="dot green"></span> Click map to set pin
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

export default MapView;
