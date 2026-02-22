// src/components/map/MapView.jsx
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";

const DEFAULT_CENTER = [35.7036, 51.3515];
const markerIconCache = new Map();
const FOUND_SIZE_MIN = 24;
const FOUND_SIZE_MAX = 44;
const FOUND_RECENCY_WINDOW_DAYS = 45;

const parseCoordinates = (item) => {
    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }
    return [latitude, longitude];
};

const getItemType = (item) => {
    const normalized = String(item?.itemType || item?.item_type || "lost").toLowerCase();
    if (normalized === "lost" || normalized === "found") {
        return normalized;
    }
    return "lost";
};

const getItemTypeLabel = (itemType) => {
    if (itemType === "lost") return "Lost";
    return "Found";
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const resolveItemCreatedAt = (item) => item?.createdAt || item?.created_at || item?.created || "";

const getFoundMarkerSize = (item) => {
    const createdAt = new Date(resolveItemCreatedAt(item));
    if (Number.isNaN(createdAt.getTime())) {
        return Math.round((FOUND_SIZE_MIN + FOUND_SIZE_MAX) / 2);
    }

    const ageInDays = Math.max(0, (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const recencyScore = clamp(1 - ageInDays / FOUND_RECENCY_WINDOW_DAYS, 0, 1);
    return Math.round(FOUND_SIZE_MIN + (FOUND_SIZE_MAX - FOUND_SIZE_MIN) * recencyScore);
};

const getItemMarkerSize = (item, itemType) => {
    if (itemType === "found") return getFoundMarkerSize(item);
    return 32;
};

const buildMarkerIcon = (itemType, markerSize) => {
    const key = `${itemType}-${markerSize}`;
    if (markerIconCache.has(key)) {
        return markerIconCache.get(key);
    }

    const symbol = itemType === "found" ? "!" : "?";
    const icon = L.divIcon({
        className: "map-pin-wrapper",
        html: `<span class="map-pin ${itemType}" style="--pin-size:${markerSize}px">${symbol}</span>`,
        iconSize: [markerSize, markerSize],
        iconAnchor: [Math.round(markerSize / 2), Math.round(markerSize / 2)],
        popupAnchor: [0, -Math.round(markerSize / 2)],
    });
    markerIconCache.set(key, icon);
    return icon;
};

const SELECTED_POSITION_ICON = L.divIcon({
    className: "map-pin-wrapper",
    html: '<span class="map-pin selected">+</span>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
});

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
                    (() => {
                        const itemType = getItemType(item);
                        const markerSize = getItemMarkerSize(item, itemType);
                        return (
                            <Marker
                                key={item.id}
                                position={coordinates}
                                icon={buildMarkerIcon(itemType, markerSize)}
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
                                    <span className={`map-popup-type ${itemType}`}>
                                        {getItemTypeLabel(itemType)}
                                    </span>
                                    <br />
                                    {item.location || "No location text"}
                                </Popup>
                            </Marker>
                        );
                    })()
                ))}

                {selectedCoordinates ? (
                    <Marker position={selectedCoordinates} icon={SELECTED_POSITION_ICON}>
                        <Popup>Selected pin position</Popup>
                    </Marker>
                ) : null}
            </MapContainer>

            {showLegend ? (
                <div className="map-legend">
                    <h4>Map legend</h4>
                    <div className="legend-item">
                        <span className="dot lost"></span> Lost item
                    </div>
                    <div className="legend-item">
                        <span className="dot found"></span> Found item (newer = larger icon)
                    </div>
                    {selectable ? (
                        <div className="legend-item">
                            <span className="dot selected"></span> Click map to set pin
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

export default MapView;
