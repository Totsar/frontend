// src/pages/ChatbotPage.jsx
import { useEffect, useRef, useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ItemCardsGrid from "../components/items/ItemCardsGrid";
import ItemDetailModal from "../components/items/ItemDetailModal";
import { assistantService } from "../services/assistantService";
import { itemService } from "../services/itemService";

const INITIAL_MESSAGES = [
    {
        id: "welcome",
        role: "bot",
        text: "Hi! Describe your item and I'll help you find it.",
    },
];

const formatDateTime = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
};

const normalizePickedIds = (ids) =>
    (Array.isArray(ids) ? ids : []).reduce((acc, rawId) => {
        const id = Number(rawId);
        if (!Number.isFinite(id) || acc.seen.has(id)) return acc;
        acc.seen.add(id);
        acc.values.push(id);
        return acc;
    }, { seen: new Set(), values: [] }).values;

const normalizeItem = (item) => {
    const source = item && typeof item === "object" ? item : {};
    return {
        ...source,
        id: Number(source.id),
        title: source.title || source.itemTitle || source.item_title || source.name || "",
        description: source.description || source.details || "",
        location: source.location || source.locationText || source.location_text || "",
        itemType: source.itemType || source.item_type || "lost",
        createdAt: source.createdAt || source.created_at || source.created || "",
        latitude: source.latitude ?? source.lat ?? null,
        longitude: source.longitude ?? source.lng ?? null,
        tags: Array.isArray(source.tags) ? source.tags : [],
        comments: Array.isArray(source.comments) ? source.comments : [],
    };
};

const ChatbotPage = () => {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");
    const [latestPickedIds, setLatestPickedIds] = useState([]);
    const [pickedItems, setPickedItems] = useState([]);
    const [pickedError, setPickedError] = useState("");
    const [isLoadingPickedItems, setIsLoadingPickedItems] = useState(false);
    const [selectedPickedItem, setSelectedPickedItem] = useState(null);
    const chatWindowRef = useRef(null);

    useEffect(() => {
        if (!chatWindowRef.current) return;
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }, [messages, isSending]);

    useEffect(() => {
        let cancelled = false;

        const loadPickedItems = async () => {
            const pickedIds = normalizePickedIds(latestPickedIds);
            const fetchItemById = async (itemId) => {
                try {
                    return await itemService.getItem(itemId);
                } catch {
                    return null;
                }
            };

            if (!pickedIds.length) {
                setPickedItems([]);
                setPickedError("");
                setIsLoadingPickedItems(false);
                return;
            }

            setPickedError("");
            setIsLoadingPickedItems(true);
            try {
                const listedItems = await itemService.listItems();
                if (cancelled) return;

                const itemById = new Map();
                for (const listedItem of Array.isArray(listedItems) ? listedItems : []) {
                    const normalized = normalizeItem(listedItem);
                    const normalizedId = Number(normalized?.id);
                    if (!Number.isFinite(normalizedId) || itemById.has(normalizedId)) continue;
                    itemById.set(normalizedId, normalized);
                }

                const missingFromList = pickedIds.filter((id) => !itemById.has(id));
                if (missingFromList.length) {
                    const fetchedMissingItems = await Promise.all(
                        missingFromList.map((id) => fetchItemById(id))
                    );
                    if (cancelled) return;

                    for (const fetchedItem of fetchedMissingItems) {
                        const normalized = normalizeItem(fetchedItem);
                        const normalizedId = Number(normalized?.id);
                        if (!fetchedItem || !Number.isFinite(normalizedId)) continue;
                        itemById.set(normalizedId, normalized);
                    }
                }

                const resolvedItems = pickedIds
                    .map((id) => itemById.get(id))
                    .filter((item) => !!item);
                const missingIds = pickedIds.filter((id) => !itemById.has(id));

                setPickedItems(resolvedItems);
                if (missingIds.length) {
                    setPickedError(
                        `Could not load details for item IDs: ${missingIds.join(", ")}.`
                    );
                }
            } catch (listError) {
                if (cancelled) return;

                const fetchedItems = await Promise.all(
                    pickedIds.map((id) => fetchItemById(id))
                );
                if (cancelled) return;

                const resolvedItems = fetchedItems.filter((item) => !!item).map((item) => normalizeItem(item));
                const resolvedIdSet = new Set(
                    resolvedItems.map((item) => Number(item.id)).filter((id) => Number.isFinite(id))
                );
                const missingIds = pickedIds.filter((id) => !resolvedIdSet.has(id));
                const detail = listError instanceof Error ? listError.message : "Failed to load picked items";

                setPickedItems(resolvedItems);
                setPickedError(
                    missingIds.length
                        ? `${detail} Missing item details for IDs: ${missingIds.join(", ")}.`
                        : detail
                );
            } finally {
                if (!cancelled) {
                    setIsLoadingPickedItems(false);
                }
            }
        };

        loadPickedItems();

        return () => {
            cancelled = true;
        };
    }, [latestPickedIds]);

    const handleSend = async () => {
        const trimmed = query.trim();
        if (!trimmed || isSending) return;

        setError("");
        setIsSending(true);
        setQuery("");
        setMessages((prev) => [
            ...prev,
            {
                id: `user-${Date.now()}`,
                role: "user",
                text: trimmed,
            },
        ]);

        try {
            const result = await assistantService.findLostItems(trimmed);
            const pickedIds = normalizePickedIds(result.pickedItemIds);
            setLatestPickedIds(pickedIds);
            setMessages((prev) => [
                ...prev,
                {
                    id: `bot-${Date.now()}`,
                    role: "bot",
                    text: result.message,
                    pickedItemIds: pickedIds,
                    candidateItemIds: result.candidateItemIds || [],
                },
            ]);
        } catch (err) {
            const detail = err instanceof Error ? err.message : "Assistant request failed";
            setError(detail);
            setMessages((prev) => [
                ...prev,
                {
                    id: `bot-error-${Date.now()}`,
                    role: "bot",
                    text: "I couldn't complete that request. Please try again.",
                },
            ]);
        } finally {
            setIsSending(false);
        }
    };

    const handleInputKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleSend();
        }
    };

    const handlePickedItemUpdated = (latest) => {
        const normalizedLatest = normalizeItem(latest);
        setSelectedPickedItem(normalizedLatest);
        setPickedItems((prev) =>
            prev.map((item) => (item.id === normalizedLatest.id ? normalizedLatest : item))
        );
    };

    return (
        <div className="page">
            <Header />

            <main className="page-content">
                <div className="container chatbot-page">
                    <div className="chatbot-header">
                        <div>
                            <h1 className="page-title">Chatbot Assistant</h1>
                            <p className="page-subtitle">
                                Search items using natural language
                            </p>
                        </div>
                    </div>

                    <div className="chatbot-split">
                        <section className="chatbot-panel left">
                            <h3>Search an item</h3>
                            <p className="muted">
                                Type what you remember about the item.
                            </p>
                            {error ? <div className="chat-error">{error}</div> : null}
                            <input
                                type="text"
                                placeholder="e.g. Black wallet near main gate"
                                className="chatbot-input"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                onKeyDown={handleInputKeyDown}
                                disabled={isSending}
                            />
                            <button
                                className="btn primary full"
                                onClick={handleSend}
                                disabled={!query.trim() || isSending}
                            >
                                {isSending ? "Searching..." : "Send"}
                            </button>

                            <div className="hint-box">
                                <strong>Examples</strong>
                                <ul className="hint-list">
                                    <li>Lost blue backpack in the library</li>
                                    <li>Found keys near cafeteria</li>
                                    <li>Looking for an iPhone 13</li>
                                </ul>
                            </div>
                        </section>

                        <section className="chatbot-panel right">
                            <div className="chat-window" ref={chatWindowRef}>
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`chat-message ${message.role === "user" ? "user" : "bot"}`}
                                    >
                                        <div>{message.text}</div>
                                    </div>
                                ))}
                                {isSending ? (
                                    <div className="chat-message bot typing">
                                        Searching for matches...
                                    </div>
                                ) : null}
                            </div>
                        </section>
                    </div>

                    <section className="chatbot-results">
                        <h3>Picked items</h3>
                        {pickedError ? <div className="chat-error">{pickedError}</div> : null}
                        {isLoadingPickedItems ? <div className="page-note">Loading picked items...</div> : null}
                        {!isLoadingPickedItems && !latestPickedIds.length ? (
                            <div className="empty-state">No picked items yet. Ask the assistant first.</div>
                        ) : null}

                        {!isLoadingPickedItems && latestPickedIds.length ? (
                            <ItemCardsGrid
                                items={pickedItems}
                                onSelectItem={setSelectedPickedItem}
                                showEmpty={false}
                            />
                        ) : null}
                    </section>
                </div>
            </main>

            <Footer />

            {selectedPickedItem ? (
                <ItemDetailModal
                    item={selectedPickedItem}
                    onClose={() => setSelectedPickedItem(null)}
                    onItemChange={handlePickedItemUpdated}
                    formatDateTime={formatDateTime}
                />
            ) : null}
        </div>
    );
};

export default ChatbotPage;
