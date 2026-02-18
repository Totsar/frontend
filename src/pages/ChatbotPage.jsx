// src/pages/ChatbotPage.jsx
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const ChatbotPage = () => {
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
                            <input
                                type="text"
                                placeholder="e.g. Black wallet near main gate"
                                className="chatbot-input"
                            />
                            <button className="btn primary full">Send</button>

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
                            <div className="chat-window">
                                <div className="chat-message bot">
                                    Hi! Describe your item and I’ll help you find it.
                                </div>
                                <div className="chat-message user">
                                    I lost a black wallet near the main gate.
                                </div>
                                <div className="chat-message bot">
                                    Thanks! I’ll search for matches. (demo only)
                                </div>
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
