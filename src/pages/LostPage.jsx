// src/pages/LostPage.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MapView from "../components/map/MapView";

const mockItems = [
    {
        id: 1,
        name: "Apple",
        status: "lost",
        category: "Other",
        location: "Riyahi Hall",
        date: "2026-02-14",
        description: "Green apple, left near the entrance.",
        coords: [35.7042, 51.3510],
        submitter: {
            email: "user1@example.com",
            createdAt: "2026-02-14 17:59",
            updatedAt: "2026-02-14 18:10",
        },
        comments: [
            {
                id: 1,
                author: "sana@example.com",
                createdAt: "2026-02-14 18:07",
                content: "I think I saw it near the cafeteria.",
            },
        ],
        isOwner: true,
    },
    {
        id: 2,
        name: "Wallet",
        status: "found",
        category: "Personal",
        location: "Main Gate",
        date: "2026-02-13",
        description: "Black leather wallet with ID inside.",
        coords: [35.7030, 51.3492],
        submitter: {
            email: "user2@example.com",
            createdAt: "2026-02-13 11:20",
            updatedAt: "2026-02-13 11:20",
        },
        comments: [
            {
                id: 1,
                author: "ali@example.com",
                createdAt: "2026-02-13 12:00",
                content: "I might know the owner.",
            },
        ],
        isOwner: false,
    },
];

const categories = ["All categories", "Other", "Personal", "Electronics", "Books"];

const LostPage = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("All categories");
    const [selectedItem, setSelectedItem] = useState(null);

    const filteredItems = useMemo(() => {
        return mockItems.filter((item) => {
            const matchesQuery =
                item.name.toLowerCase().includes(query.toLowerCase()) ||
                item.description.toLowerCase().includes(query.toLowerCase());

            const matchesLocation = item.location
                .toLowerCase()
                .includes(locationQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" || item.status === statusFilter;

            const matchesCategory =
                categoryFilter === "All categories" || item.category === categoryFilter;

            return matchesQuery && matchesLocation && matchesStatus && matchesCategory;
        });
    }, [query, locationQuery, statusFilter, categoryFilter]);

    return (
        <div className="page">
            <Header />

            <main className="page-content">
                <div className="container lost-page">
                    <div className="lost-header">
                        <div>
                            <h1 className="page-title">Items list</h1>
                            <p className="page-subtitle">
                                Browse and search for lost and found items
                            </p>
                        </div>

                        <button
                            className="btn primary"
                            onClick={() => navigate("/items/new")}
                        >
                            + Add new item
                        </button>
                    </div>

                    <div className="lost-controls">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Search by name or description..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>

                        <div className="filter-row">
                            <div className="filter-group">
                                <label>Status</label>
                                <div className="segmented">
                                    <button
                                        className={`seg-btn ${statusFilter === "all" ? "active" : ""}`}
                                        onClick={() => setStatusFilter("all")}
                                    >
                                        All
                                    </button>
                                    <button
                                        className={`seg-btn ${statusFilter === "lost" ? "active" : ""}`}
                                        onClick={() => setStatusFilter("lost")}
                                    >
                                        Lost
                                    </button>
                                    <button
                                        className={`seg-btn ${statusFilter === "found" ? "active" : ""}`}
                                        onClick={() => setStatusFilter("found")}
                                    >
                                        Found
                                    </button>
                                </div>
                            </div>

                            <div className="filter-group">
                                <label>Category</label>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    {categories.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Location</label>
                                <input
                                    type="text"
                                    placeholder="Search by location..."
                                    value={locationQuery}
                                    onChange={(e) => setLocationQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <MapView items={filteredItems} onSelectItem={setSelectedItem} />

                    <div className="items-grid">
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className="item-card"
                                onClick={() => setSelectedItem(item)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="item-thumb">?</div>
                                <div className="item-body">
                                    <div className="item-title-row">
                                        <h3>{item.name}</h3>
                                        <span className={`status ${item.status}`}>
                      {item.status === "lost" ? "Lost" : "Found"}
                    </span>
                                    </div>
                                    <div className="item-tags">
                                        <span className="tag">{item.category}</span>
                                    </div>
                                    <div className="item-meta">
                                        <span>{item.location}</span>
                                        <span>{item.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredItems.length === 0 && (
                            <div className="empty-state">No items found.</div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />

            {selectedItem && (
                <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{selectedItem.name}</h2>
                                <span className={`status ${selectedItem.status}`}>
                  {selectedItem.status === "lost" ? "Lost" : "Found"}
                </span>
                            </div>
                            <button className="icon-btn" onClick={() => setSelectedItem(null)}>
                                ✕
                            </button>
                        </div>

                        <section className="modal-section">
                            <h4>Description</h4>
                            <p>{selectedItem.description}</p>
                        </section>

                        <section className="modal-section">
                            <h4>Categories</h4>
                            <div className="tag">{selectedItem.category}</div>
                        </section>

                        <section className="modal-section">
                            <h4>Location</h4>
                            <p>{selectedItem.location}</p>
                        </section>

                        <section className="modal-section">
                            <h4>Submitter info</h4>
                            <div className="info-box">
                                <div>Email: {selectedItem.submitter.email}</div>
                                <div>Submitted: {selectedItem.submitter.createdAt}</div>
                                <div>Last edited: {selectedItem.submitter.updatedAt}</div>
                            </div>
                        </section>

                        <section className="modal-section">
                            <h4>Comments ({selectedItem.comments.length})</h4>
                            <div className="comments-list">
                                {selectedItem.comments.map((c) => (
                                    <div className="comment" key={c.id}>
                                        <div className="comment-head">
                                            <strong>{c.author}</strong>
                                            <span>{c.createdAt}</span>
                                        </div>
                                        <p>{c.content}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {selectedItem.isOwner && (
                            <div className="modal-actions">
                                <button
                                    className="btn ghost"
                                    onClick={() => navigate(`/items/${selectedItem.id}/edit`)}
                                >
                                    Edit item
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LostPage;
