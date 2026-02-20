// src/pages/ItemFormPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MapView from "../components/map/MapView";
import { useAuth } from "../context/AuthContext";
import { itemService } from "../services/itemService";

const DEFAULT_CENTER = [35.7036, 51.3515];

const parseTagsInput = (input) =>
    input
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

const ItemFormPage = ({ mode }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { auth, isLoggedIn } = useAuth();
    const isEdit = mode === "edit";

    const [form, setForm] = useState({
        title: "",
        location: "",
        description: "",
        tagsInput: "",
        latitude: null,
        longitude: null,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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
                setForm({
                    title: item.title || "",
                    location: item.location || "",
                    description: item.description || "",
                    tagsInput: (item.tags || []).join(", "),
                    latitude: Number.isFinite(Number(item.latitude)) ? Number(item.latitude) : null,
                    longitude: Number.isFinite(Number(item.longitude)) ? Number(item.longitude) : null,
                });
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
        setForm((prev) => ({ ...prev, latitude, longitude }));
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
            location: form.location.trim(),
            description: form.description.trim(),
            tags: parseTagsInput(form.tagsInput),
            latitude: form.latitude,
            longitude: form.longitude,
        };

        if (!payload.title || !payload.location) {
            setError("Title and location are required.");
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
                await itemService.updateItem(id, payload, auth.accessToken);
            } else {
                await itemService.createItem(payload, auth.accessToken);
            }
            navigate("/lost");
        } catch (err) {
            const detail = err instanceof Error ? err.message : "Failed to submit item";
            setError(detail);
        } finally {
            setIsSaving(false);
        }
    };

    const selectedPosition =
        Number.isFinite(form.latitude) && Number.isFinite(form.longitude)
            ? { latitude: form.latitude, longitude: form.longitude }
            : null;

    const mapCenter = selectedPosition
        ? [selectedPosition.latitude, selectedPosition.longitude]
        : DEFAULT_CENTER;

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
                            <label>Tags (comma separated)</label>
                            <input
                                type="text"
                                value={form.tagsInput}
                                onChange={(e) => update("tagsInput", e.target.value)}
                                placeholder="example: electronics, wallet, black"
                                disabled={isLoading || isSaving}
                            />
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
                                onClick={() => navigate("/lost")}
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
