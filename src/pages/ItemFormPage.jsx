// src/pages/ItemFormPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const mockItems = [
    {
        id: 1,
        name: "Apple",
        status: "lost",
        category: "Other",
        location: "Riyahi Hall",
        date: "2026-02-14",
        description: "Green apple, left near the entrance.",
    },
    {
        id: 2,
        name: "Wallet",
        status: "found",
        category: "Personal",
        location: "Main Gate",
        date: "2026-02-13",
        description: "Black leather wallet with ID inside.",
    },
];

const categories = ["Other", "Personal", "Electronics", "Books"];

const ItemFormPage = ({ mode }) => {
    const navigate = useNavigate();
    const { id } = useParams();

    const editingItem = useMemo(() => {
        if (mode !== "edit") return null;
        return mockItems.find((i) => i.id === Number(id));
    }, [mode, id]);

    const [form, setForm] = useState({
        name: "",
        status: "lost",
        category: "Other",
        location: "",
        date: "",
        description: "",
    });

    useEffect(() => {
        if (editingItem) {
            setForm({
                name: editingItem.name,
                status: editingItem.status,
                category: editingItem.category,
                location: editingItem.location,
                date: editingItem.date,
                description: editingItem.description,
            });
        }
    }, [editingItem]);

    const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();

        if (mode === "create") {
            console.log("Create item payload", form);
        } else {
            console.log("Edit item payload", { id, ...form });
        }

        navigate("/lost");
    };

    return (
        <div className="page">
            <Header />

            <main className="page-content">
                <div className="container form-page">
                    <div className="form-header">
                        <h1 className="page-title">{mode === "create" ? "Add new item" : "Edit item"}</h1>
                        <p className="page-subtitle">Fill out the form to record the item details</p>
                    </div>

                    <form className="item-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <label>Item name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => update("name", e.target.value)}
                                placeholder="Example: Wallet, Phone, Backpack..."
                                required
                            />
                        </div>

                        <div className="form-row">
                            <label>Status</label>
                            <div className="segmented">
                                <button
                                    type="button"
                                    className={`seg-btn ${form.status === "lost" ? "active" : ""}`}
                                    onClick={() => update("status", "lost")}
                                >
                                    Lost
                                </button>
                                <button
                                    type="button"
                                    className={`seg-btn ${form.status === "found" ? "active" : ""}`}
                                    onClick={() => update("status", "found")}
                                >
                                    Found
                                </button>
                            </div>
                        </div>

                        <div className="form-row">
                            <label>Category</label>
                            <select
                                value={form.category}
                                onChange={(e) => update("category", e.target.value)}
                            >
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row">
                            <label>Location</label>
                            <input
                                type="text"
                                value={form.location}
                                onChange={(e) => update("location", e.target.value)}
                                placeholder="Example: Main Gate, Library..."
                            />
                        </div>

                        <div className="form-row">
                            <label>Date</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => update("date", e.target.value)}
                            />
                        </div>

                        <div className="form-row">
                            <label>Description</label>
                            <textarea
                                rows="4"
                                value={form.description}
                                onChange={(e) => update("description", e.target.value)}
                                placeholder="Describe the item..."
                            />
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn ghost" onClick={() => navigate("/lost")}>
                                Cancel
                            </button>
                            <button type="submit" className="btn primary">
                                {mode === "create" ? "Create item" : "Save changes"}
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
