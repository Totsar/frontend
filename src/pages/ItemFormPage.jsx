// src/pages/ItemFormPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MapView from "../components/map/MapView";
import { useAuth } from "../context/AuthContext";
import { itemService } from "../services/itemService";
import tagOptions from "../data/tagOptions.json";

const DEFAULT_CENTER = [35.7036, 51.3515];

const normalizeTag = (tag) => tag.trim().toLowerCase();

const uniqueTags = (tags) => {
    const out = [];
    for (const tag of tags) {
        const normalized = normalizeTag(tag);
        if (!normalized || out.includes(normalized)) continue;
        out.push(normalized);
    }
    return out;
};

const parseCoordinateQuery = (rawValue) => {
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
};

const ItemFormPage = ({ mode }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { auth, isLoggedIn } = useAuth();
    const isEdit = mode === "edit";
    const typeFromQuery = String(searchParams.get("type") || "").toLowerCase();
    const latitudeFromQuery = parseCoordinateQuery(searchParams.get("latitude"));
    const longitudeFromQuery = parseCoordinateQuery(searchParams.get("longitude"));
    const initialItemType = ["lost", "found"].includes(typeFromQuery)
        ? typeFromQuery
        : "lost";

    const [form, setForm] = useState({
        title: "",
        itemType: initialItemType,
        location: "",
        description: "",
        selectedTags: ["other"],
        latitude: latitudeFromQuery,
        longitude: longitudeFromQuery,
    });
    const [availableTags, setAvailableTags] = useState(() => uniqueTags([...tagOptions, "other"]));
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState("");
    const [error, setError] = useState("");

    const pageTitle = useMemo(
        () => (isEdit ? "Edit item" : "Add new item"),
        [isEdit]
    );

    useEffect(() => {
        if (!isEdit) return;

        let cancelled = false;

        const loadItem = async () => {
            setError("");
            setIsLoading(true);
            try {
                const item = await itemService.getItem(id);
                if (cancelled) return;
                const loadedTags = uniqueTags(item.tags || []);
                setForm({
                    title: item.title || "",
                    itemType: item.itemType || item.item_type || "lost",
                    location: item.location || "",
                    description: item.description || "",
                    selectedTags: loadedTags.length ? loadedTags : ["other"],
                    latitude: Number.isFinite(Number(item.latitude)) ? Number(item.latitude) : null,
                    longitude: Number.isFinite(Number(item.longitude)) ? Number(item.longitude) : null,
                });
                setAvailableTags((prev) => uniqueTags([...prev, ...(item.tags || []), "other"]));
            } catch (err) {
                if (cancelled) return;
                const detail = err instanceof Error ? err.message : "Failed to load item";
                setError(detail);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadItem();

        return () => {
            cancelled = true;
        };
    }, [id, isEdit]);

    const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleCoordinatePick = ({ latitude, longitude }) => {
        setLocationError("");
        setForm((prev) => ({ ...prev, latitude, longitude }));
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported in this browser.");
            return;
        }

        setLocationError("");
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                setForm((prev) => ({
                    ...prev,
                    latitude,
                    longitude,
                    location: prev.location || "Near my current location",
                }));
                setIsLocating(false);
            },
            (geoError) => {
                const message =
                    geoError?.message || "Could not access your current location.";
                setLocationError(message);
                setIsLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000,
            }
        );
    };

    const handleToggleTag = (tag) => {
        setForm((prev) => {
            const normalized = normalizeTag(tag);
            if (prev.selectedTags.includes(normalized)) {
                return {
                    ...prev,
                    selectedTags: prev.selectedTags.filter((t) => t !== normalized),
                };
            }
            return {
                ...prev,
                selectedTags: [...prev.selectedTags, normalized],
            };
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSaving) return;

        if (!isLoggedIn || !auth?.accessToken) {
            setError("Please log in before submitting items.");
            return;
        }

        const payload = {
            title: form.title.trim(),
            itemType: form.itemType,
            location: form.location.trim(),
            description: form.description.trim(),
            tags: form.selectedTags,
            latitude: form.latitude,
            longitude: form.longitude,
        };

        if (!payload.title || !payload.location) {
            setError("Title and location are required.");
            return;
        }

        if (!payload.tags.length) {
            setError('Select at least one tag. Use "other" when no tag fits.');
            return;
        }

        if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
            setError("Please choose item coordinates by clicking the map pin location.");
            return;
        }

        setError("");
        setIsSaving(true);
        try {
            if (isEdit) {
                await itemService.updateItem(id, payload);
            } else {
                await itemService.createItem(payload);
            }
            navigate("/items");
        } catch (err) {
            const detail = err instanceof Error ? err.message : "Failed to submit item";
            setError(detail);
        } finally {
            setIsSaving(false);
        }
    };

    const selectedPosition = useMemo(
        () => (
            Number.isFinite(form.latitude) && Number.isFinite(form.longitude)
                ? { latitude: form.latitude, longitude: form.longitude }
                : null
        ),
        [form.latitude, form.longitude]
    );

    const mapCenter = useMemo(
        () => (
            selectedPosition
                ? [selectedPosition.latitude, selectedPosition.longitude]
                : DEFAULT_CENTER
        ),
        [selectedPosition]
    );

    return (
        <div className="page">
            <Header />

            <main className="page-content">
                <div className="container form-page">
                    <div className="form-header">
                        <h1 className="page-title">{pageTitle}</h1>
                        <p className="page-subtitle">
                            Write a location description and select exact coordinates on the map
                        </p>
                    </div>

                    {error ? <div className="page-error">{error}</div> : null}
                    {isEdit && isLoading ? (
                        <div className="page-note">Loading item details...</div>
                    ) : null}

                    <form className="item-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <label>Title</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => update("title", e.target.value)}
                                placeholder="Example: Wallet, Phone, Backpack..."
                                required
                                disabled={isLoading || isSaving}
                            />
                        </div>

                        <div className="form-row">
                            <label>Item type</label>
                            <select
                                value={form.itemType}
                                onChange={(e) => update("itemType", e.target.value)}
                                disabled={isLoading || isSaving}
                            >
                                <option value="lost">Lost</option>
                                <option value="found">Found</option>
                            </select>
                        </div>

                        <div className="form-row">
                            <label>Location description</label>
                            <input
                                type="text"
                                value={form.location}
                                onChange={(e) => update("location", e.target.value)}
                                placeholder="Example: Main Gate, Library..."
                                required
                                disabled={isLoading || isSaving}
                            />
                        </div>

                        <div className="form-row">
                            <label>Map coordinates (click map to drop pin)</label>
                            <div className="form-map-actions">
                                <button
                                    type="button"
                                    className="btn ghost"
                                    onClick={handleUseCurrentLocation}
                                    disabled={isLoading || isSaving || isLocating}
                                >
                                    {isLocating ? "Locating..." : "Use my current location"}
                                </button>
                            </div>
                            {locationError ? <div className="inline-error">{locationError}</div> : null}
                            <MapView
                                key={
                                    selectedPosition
                                        ? `${selectedPosition.latitude}-${selectedPosition.longitude}`
                                        : "default"
                                }
                                items={[]}
                                center={mapCenter}
                                zoom={16}
                                selectable
                                selectedPosition={selectedPosition}
                                onSelectPosition={handleCoordinatePick}
                                recenterOnCenterChange
                            />
                            <div className="coords-box">
                                <div>
                                    <strong>Latitude:</strong>{" "}
                                    {Number.isFinite(form.latitude) ? form.latitude.toFixed(6) : "not selected"}
                                </div>
                                <div>
                                    <strong>Longitude:</strong>{" "}
                                    {Number.isFinite(form.longitude) ? form.longitude.toFixed(6) : "not selected"}
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <label>Tags</label>
                            <p className="field-help">Select at least one tag. Use "other" when needed.</p>
                            <div className="tag-selector">
                                {availableTags.map((tag) => {
                                    const checked = form.selectedTags.includes(tag);
                                    return (
                                        <label
                                            key={tag}
                                            className={`tag-option ${checked ? "selected" : ""}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => handleToggleTag(tag)}
                                                disabled={isLoading || isSaving}
                                            />
                                            <span>{tag}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="form-row">
                            <label>Description</label>
                            <textarea
                                rows="4"
                                value={form.description}
                                onChange={(e) => update("description", e.target.value)}
                                placeholder="Describe the item..."
                                disabled={isLoading || isSaving}
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn ghost"
                                onClick={() => navigate("/items")}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn primary"
                                disabled={isLoading || isSaving}
                            >
                                {isSaving ? "Saving..." : isEdit ? "Save changes" : "Create item"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ItemFormPage;
