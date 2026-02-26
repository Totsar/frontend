// src/components/map/MapView.jsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

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

const buildClusterIcon = (cluster) => {
    const count = cluster.getChildCount();
    const size = count < 10 ? "small" : count < 50 ? "medium" : "large";
    return L.divIcon({
        html: `<div class="cluster-icon cluster-${size}">${count}</div>`,
        className: "cluster-wrapper",
        iconSize: L.point(40, 40, true),
    });
};

const MapPinSelector = ({
                            enabled,
                            onSelectPosition,
                            selectOnClick,
                            onLongPressPosition,
                            longPressDurationMs,
                        }) => {
    const pressTimerRef = useRef(null);
    const longPressTriggeredRef = useRef(false);

    const clearPressTimer = () => {
        if (pressTimerRef.current) {
            clearTimeout(pressTimerRef.current);
            pressTimerRef.current = null;
        }
    };

    const startPressTimer = (latlng) => {
        if (!enabled || !onLongPressPosition) return;
        clearPressTimer();
        longPressTriggeredRef.current = false;
        pressTimerRef.current = setTimeout(() => {
            longPressTriggeredRef.current = true;
            onLongPressPosition({
                latitude: latlng.lat,
                longitude: latlng.lng,
            });
            clearPressTimer();
        }, longPressDurationMs);
    };

    useEffect(() => () => clearPressTimer(), []);

    useMapEvents({
        click(event) {
            if (!enabled || !onSelectPosition || !selectOnClick || longPressTriggeredRef.current) {
                longPressTriggeredRef.current = false;
                return;
            }
            onSelectPosition({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            });
        },
        mousedown(event) {
            startPressTimer(event.latlng);
        },
        touchstart(event) {
            startPressTimer(event.latlng);
        },
        mouseup() {
            clearPressTimer();
        },
        touchend() {
            clearPressTimer();
        },
        mousemove() {
            clearPressTimer();
        },
        dragstart() {
            clearPressTimer();
        },
        zoomstart() {
            clearPressTimer();
        },
    });

    return null;
};

const MapViewportController = ({ enabled, center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        if (!enabled || !Array.isArray(center) || center.length !== 2) return;
        const latitude = Number(center[0]);
        const longitude = Number(center[1]);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
        map.setView([latitude, longitude], zoom, { animate: true });
    }, [enabled, center, zoom, map]);

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
                     recenterOnCenterChange = false,
                     selectOnClick = true,
                     onLongPressPosition,
                     longPressDurationMs = 800,
                     hoverPopupDelayMs = 250,
                 }) => {
    const markerHoverTimersRef = useRef(new Map());

    const clearMarkerHoverTimer = (itemId) => {
        const timer = markerHoverTimersRef.current.get(itemId);
        if (timer) {
            clearTimeout(timer);
            markerHoverTimersRef.current.delete(itemId);
        }
    };

    const scheduleMarkerPopupOpen = (itemId, marker) => {
        clearMarkerHoverTimer(itemId);
        const timer = setTimeout(() => {
            marker.openPopup();
            markerHoverTimersRef.current.delete(itemId);
        }, hoverPopupDelayMs);
        markerHoverTimersRef.current.set(itemId, timer);
    };

    useEffect(() => {
        const timerMap = markerHoverTimersRef.current;
        return () => {
            for (const timer of timerMap.values()) {
                clearTimeout(timer);
            }
            timerMap.clear();
        };
    }, []);

    const itemsWithCoordinates = items
        .map((item) => ({ item, coordinates: parseCoordinates(item) }))
        .filter((entry) => !!entry.coordinates);

    const selectedCoordinates =
        selectedPosition &&
        Number.isFinite(selectedPosition.latitude) &&
        Number.isFinite(selectedPosition.longitude)
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
                <MapViewportController
                    enabled={recenterOnCenterChange}
                    center={center}
                    zoom={zoom}
                />
                <MapPinSelector
                    enabled={selectable}
                    onSelectPosition={onSelectPosition}
                    selectOnClick={selectOnClick}
                    onLongPressPosition={onLongPressPosition}
                    longPressDurationMs={longPressDurationMs}
                />

                <MarkerClusterGroup
                    chunkedLoading
                    spiderfyOnMaxZoom
                    showCoverageOnHover={false}
                    maxClusterRadius={50}
                    iconCreateFunction={buildClusterIcon}
                >
                    {itemsWithCoordinates.map(({ item, coordinates }) => {
                        const itemType = getItemType(item);
                        const markerSize = getItemMarkerSize(item, itemType);
                        return (
                            <Marker
                                key={item.id}
                                position={coordinates}
                                icon={buildMarkerIcon(itemType, markerSize)}
                                eventHandlers={{
                                    click: () => {
                                        clearMarkerHoverTimer(item.id);
                                        if (onSelectItem) {
                                            onSelectItem(item);
                                        }
                                    },
                                    mouseover: (event) => {
                                        scheduleMarkerPopupOpen(item.id, event.target);
                                    },
                                    mouseout: (event) => {
                                        clearMarkerHoverTimer(item.id);
                                        event.target.closePopup();
                                    },
                                }}
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
                    })}
                </MarkerClusterGroup>

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
                            <span className="dot selected"></span>{" "}
                            {selectOnClick ? "Click map to set pin" : "Long-press map to set pin"}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

export default MapView;
