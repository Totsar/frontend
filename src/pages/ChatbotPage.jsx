// src/pages/ChatbotPage.jsx
import { useEffect, useRef, useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { assistantService } from "../services/assistantService";

const INITIAL_MESSAGES = [
    {
        id: "welcome",
        role: "bot",
        text: "Hi! Describe your item and I'll help you find it.",
    },
];

const ChatbotPage = () => {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");
    const chatWindowRef = useRef(null);

    useEffect(() => {
        if (!chatWindowRef.current) return;
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }, [messages, isSending]);

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
            setMessages((prev) => [
                ...prev,
                {
                    id: `bot-${Date.now()}`,
                    role: "bot",
                    text: result.message,
                    pickedItemIds: result.pickedItemIds || [],
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
                                        {message.role === "bot" ? (
                                            <div className="chat-message-meta">
                                                {message.pickedItemIds?.length ? (
                                                    <div>
                                                        Picked IDs: {message.pickedItemIds.join(", ")}
                                                    </div>
                                                ) : null}
                                                {message.candidateItemIds?.length ? (
                                                    <div>
                                                        Candidate IDs: {message.candidateItemIds.join(", ")}
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
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
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ChatbotPage;
