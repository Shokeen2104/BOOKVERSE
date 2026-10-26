import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  X, 
  Send, 
  RotateCcw, 
  BookOpen, 
  ArrowRight, 
  Bot, 
  User, 
  Compass, 
  HelpCircle,
  Minimize2
} from "lucide-react";
import api from "../api/axios";

const STARTER_PROMPTS = [
  "🌟 Recommend a twisty psychological thriller",
  "🚀 Best sci-fi page-turners under 400 pages",
  "☕ A cozy, heartwarming book for a quiet weekend",
  "⚔️ Epic fantasy with rich worldbuilding",
];

const BOOK_PAGE_PROMPTS = [
  "📖 Give me a quick spoiler-free vibe check on this book",
  "🎭 Is this book more character-driven or plot-driven?",
  "🔍 Who are the primary protagonists and their motivations?",
  "✨ Recommend 3 books that feel just like this one",
];

const AIAssistantDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your **BookVerse AI Companion** 📚✨. Ask me for personalized recommendations, book comparisons, or literary breakdowns!",
      book_suggestions: [],
    },
  ]);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Check if current route is a book details page: /books/:bookId
  const match = location.pathname.match(/^\/books\/([^/]+)/);
  const contextBookId = match ? match[1] : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Send conversation history to the API
      const response = await api.post("/ai/chat", {
        messages: newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        context_book_id: contextBookId,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.data.reply,
          book_suggestions: response.data.book_suggestions || [],
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I ran into an issue connecting to Gemini. Please verify your connection or API key and try again!",
          book_suggestions: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! What shall we explore next in the world of books?",
        book_suggestions: [],
      },
    ]);
  };

  const handleSelectSuggestion = (suggestion) => {
    if (suggestion.book_id) {
      navigate(`/books/${suggestion.book_id}`);
    } else {
      navigate(`/browse?q=${encodeURIComponent(suggestion.title)}`);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating launcher trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={styles.floatingButton}
          className="animate-fade-in"
          title="Open BookVerse AI Assistant"
        >
          <div style={styles.floatingBadge}>
            <Sparkles size={18} color="#ffffff" />
          </div>
          <span style={styles.floatingText}>Ask BookVerse AI</span>
        </button>
      )}

      {/* Assistant Modal / Drawer */}
      {isOpen && (
        <div style={styles.drawerContainer} className="animate-fade-in">
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.botAvatar}>
                <Sparkles size={16} color="#6366f1" />
              </div>
              <div>
                <h4 style={styles.headerTitle}>BookVerse AI</h4>
                <span style={styles.headerSubtitle}>Powered by Gemini</span>
              </div>
            </div>

            <div style={styles.headerActions}>
              <button
                onClick={handleClearChat}
                style={styles.iconBtn}
                title="Restart conversation"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={styles.iconBtn}
                title="Close assistant"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* Context Banner if on Book Details page */}
          {contextBookId && (
            <div style={styles.contextBanner}>
              <BookOpen size={13} color="#6366f1" />
              <span style={styles.contextText}>
                Grounded on current book ({contextBookId})
              </span>
            </div>
          )}

          {/* Messages Area */}
          <div style={styles.messagesContainer}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  ...styles.messageRow,
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {msg.role === "assistant" && (
                  <div style={styles.msgAvatar}>
                    <Bot size={14} color="#6366f1" />
                  </div>
                )}

                <div
                  style={{
                    ...styles.messageBubble,
                    ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble),
                  }}
                >
                  <div style={styles.messageText}>
                    {msg.content.split("\n").map((line, i) => (
                      <p key={i} style={{ margin: "0.25rem 0" }}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Render Book Recommendations if provided by Gemini */}
                  {msg.book_suggestions && msg.book_suggestions.length > 0 && (
                    <div style={styles.suggestionsContainer}>
                      <span style={styles.suggestionsHeader}>RECOMMENDED BOOKS</span>
                      {msg.book_suggestions.map((item, idx) => (
                        <div
                          key={idx}
                          style={styles.suggestionCard}
                          onClick={() => handleSelectSuggestion(item)}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={styles.suggestionTitleRow}>
                              <span style={styles.suggestionTitle}>{item.title}</span>
                              {item.genre && (
                                <span style={styles.suggestionGenre}>{item.genre}</span>
                              )}
                            </div>
                            <span style={styles.suggestionAuthor}>by {item.author}</span>
                            <p style={styles.suggestionReason}>{item.reason}</p>
                          </div>
                          <div style={styles.suggestionArrow}>
                            <ArrowRight size={14} color="var(--primary)" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
                <div style={styles.msgAvatar}>
                  <Bot size={14} color="#6366f1" />
                </div>
                <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
                  <div style={styles.typingIndicator}>
                    <span style={styles.typingDot}></span>
                    <span style={{ ...styles.typingDot, animationDelay: "0.2s" }}></span>
                    <span style={{ ...styles.typingDot, animationDelay: "0.4s" }}></span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.4rem" }}>
                      Gemini is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Starter prompt chips */}
          {messages.length <= 2 && (
            <div style={styles.starterChipsContainer}>
              <span style={styles.starterLabel}>Try asking:</span>
              <div style={styles.chipsScroll}>
                {(contextBookId ? BOOK_PAGE_PROMPTS : STARTER_PROMPTS).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    style={styles.chipButton}
                    disabled={loading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={styles.inputForm}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={contextBookId ? "Ask anything about this book or literature..." : "Ask for book recommendations, tropes, summaries..."}
              style={styles.inputField}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                ...styles.sendBtn,
                opacity: input.trim() && !loading ? 1 : 0.5,
              }}
            >
              <Send size={15} color="#ffffff" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

const styles = {
  floatingButton: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.6rem 1.1rem 0.6rem 0.6rem",
    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    color: "#ffffff",
    borderRadius: "999px",
    border: "none",
    boxShadow: "0 8px 24px rgba(99, 102, 241, 0.4), 0 2px 6px rgba(0, 0, 0, 0.1)",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  floatingBadge: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  floatingText: {
    fontSize: "0.9rem",
    fontWeight: 600,
    letterSpacing: "0.01em",
  },
  drawerContainer: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    width: "380px",
    maxWidth: "calc(100vw - 32px)",
    height: "580px",
    maxHeight: "calc(100vh - 48px)",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(16px)",
    borderRadius: "1.25rem",
    border: "1px solid rgba(99, 102, 241, 0.25)",
    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.15), 0 0 24px rgba(99, 102, 241, 0.15)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.25rem",
    borderBottom: "1px solid var(--border-color)",
    background: "rgba(255, 255, 255, 0.8)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
  },
  botAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "rgba(99, 102, 241, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    margin: 0,
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  headerSubtitle: {
    fontSize: "0.7rem",
    color: "var(--text-muted)",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-secondary)",
    padding: "0.35rem",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  contextBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.4rem 1rem",
    background: "rgba(99, 102, 241, 0.08)",
    borderBottom: "1px solid rgba(99, 102, 241, 0.15)",
  },
  contextText: {
    fontSize: "0.72rem",
    fontWeight: 600,
    color: "var(--primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.85rem",
  },
  messageRow: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "flex-start",
  },
  msgAvatar: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "rgba(99, 102, 241, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "0.2rem",
    flexShrink: 0,
  },
  messageBubble: {
    maxWidth: "85%",
    padding: "0.75rem 0.9rem",
    borderRadius: "1rem",
    fontSize: "0.86rem",
    lineHeight: 1.45,
  },
  userBubble: {
    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    color: "#ffffff",
    borderBottomRightRadius: "0.25rem",
  },
  assistantBubble: {
    background: "rgba(245, 245, 245, 0.9)",
    color: "var(--text-primary)",
    borderBottomLeftRadius: "0.25rem",
    border: "1px solid var(--border-color)",
  },
  messageText: {
    wordBreak: "break-word",
  },
  suggestionsContainer: {
    marginTop: "0.75rem",
    paddingTop: "0.6rem",
    borderTop: "1px dashed rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  suggestionsHeader: {
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    color: "var(--primary)",
  },
  suggestionCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.6rem",
    background: "#ffffff",
    borderRadius: "0.5rem",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    cursor: "pointer",
    transition: "transform 0.15s ease, border-color 0.15s ease",
  },
  suggestionTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    flexWrap: "wrap",
  },
  suggestionTitle: {
    fontWeight: 700,
    fontSize: "0.8rem",
    color: "var(--text-primary)",
  },
  suggestionGenre: {
    fontSize: "0.65rem",
    padding: "0.1rem 0.4rem",
    borderRadius: "4px",
    background: "rgba(99, 102, 241, 0.1)",
    color: "var(--primary)",
    fontWeight: 500,
  },
  suggestionAuthor: {
    display: "block",
    fontSize: "0.72rem",
    color: "var(--text-muted)",
    marginBottom: "0.2rem",
  },
  suggestionReason: {
    fontSize: "0.74rem",
    color: "var(--text-secondary)",
    margin: 0,
    lineHeight: 1.3,
  },
  suggestionArrow: {
    paddingLeft: "0.5rem",
  },
  typingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    padding: "0.25rem 0",
  },
  typingDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#6366f1",
    animation: "pulse 1.2s infinite",
  },
  starterChipsContainer: {
    padding: "0.5rem 1rem",
    borderTop: "1px solid var(--border-color)",
    background: "rgba(255, 255, 255, 0.6)",
  },
  starterLabel: {
    display: "block",
    fontSize: "0.68rem",
    fontWeight: 600,
    color: "var(--text-muted)",
    marginBottom: "0.35rem",
  },
  chipsScroll: {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  },
  chipButton: {
    textAlign: "left",
    background: "#ffffff",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    padding: "0.35rem 0.6rem",
    fontSize: "0.75rem",
    color: "var(--text-primary)",
    cursor: "pointer",
    transition: "background 0.15s ease",
  },
  inputForm: {
    display: "flex",
    alignItems: "center",
    padding: "0.75rem 1rem",
    gap: "0.5rem",
    borderTop: "1px solid var(--border-color)",
    background: "rgba(255, 255, 255, 0.9)",
  },
  inputField: {
    flex: 1,
    padding: "0.6rem 0.85rem",
    fontSize: "0.85rem",
    borderRadius: "999px",
    border: "1px solid var(--border-color)",
    outline: "none",
    background: "#ffffff",
  },
  sendBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "#6366f1",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "transform 0.15s ease",
  },
};

export default AIAssistantDrawer;
