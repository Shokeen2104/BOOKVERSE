import React, { useState, useEffect } from "react";
import { FolderPlus, BookMarked, Bookmark, BookOpen, Trash2, ArrowRight } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import BookCard from "../components/BookCard";

const ReadingList = () => {
  const { user } = useAuth();
  
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [activeListDetail, setActiveListDetail] = useState(null);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Custom list creation
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [createError, setCreateError] = useState("");

  const fetchLists = async () => {
    setLoadingLists(true);
    try {
      const response = await api.get("/reading-lists");
      setLists(response.data || []);
      
      // Auto select first list on load
      if (response.data?.length > 0 && !activeListId) {
        setActiveListId(response.data[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch reading lists:", e);
    } finally {
      setLoadingLists(false);
    }
  };

  const fetchActiveListDetail = async () => {
    if (!activeListId) return;
    setLoadingDetail(true);
    try {
      const response = await api.get(`/reading-lists/${activeListId}`);
      setActiveListDetail(response.data);
    } catch (e) {
      console.error("Failed to load reading list details:", e);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  useEffect(() => {
    fetchActiveListDetail();
  }, [activeListId]);

  const handleCreateListSubmit = async (e) => {
    e.preventDefault();
    setCreateError("");
    
    if (!newListName.trim()) return;

    try {
      const response = await api.post("/reading-lists", { name: newListName.trim() });
      setNewListName("");
      setShowCreateForm(false);
      
      // Re-fetch lists & set new list as active
      const updatedLists = await api.get("/reading-lists");
      setLists(updatedLists.data);
      setActiveListId(response.data.id);
    } catch (err) {
      setCreateError(err.response?.data?.detail || "Failed to create custom bookshelf.");
    }
  };

  const handleDeleteList = async () => {
    if (!activeListDetail) return;
    if (activeListDetail.is_default) {
      alert("Default reading lists cannot be deleted.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete the bookshelf "${activeListDetail.name}"?`)) {
      try {
        await api.delete(`/reading-lists/${activeListId}`);
        // Reset active list to first list available
        setActiveListId(null);
        await fetchLists();
      } catch (e) {
        console.error("Failed to delete reading list:", e);
      }
    }
  };

  const handleRemoveBook = async (bookId) => {
    if (window.confirm("Remove this book from bookshelf?")) {
      try {
        await api.delete(`/reading-lists/${activeListId}/books/${bookId}`);
        fetchActiveListDetail();
      } catch (e) {
        console.error("Failed to remove book:", e);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="container animate-fade-in" style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <BookMarked size={28} color="var(--primary)" />
          <h1 className="font-serif">My Bookshelves</h1>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
          style={styles.createBtn}
        >
          <FolderPlus size={18} />
          <span>New Bookshelf</span>
        </button>
      </div>

      {/* Custom list creation form */}
      {showCreateForm && (
        <div className="glass-panel animate-fade-in" style={styles.createForm}>
          <h3 className="font-serif" style={{ marginBottom: "1rem" }}>Create Custom Bookshelf</h3>
          {createError && <p style={{ color: "var(--error)", marginBottom: "1rem", fontSize: "0.9rem" }}>{createError}</p>}
          <form onSubmit={handleCreateListSubmit} style={styles.formRow}>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Science Fiction Club, Summer Reads 2026..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs Layout */}
      <div style={styles.layout}>
        {/* Sidebar tabs */}
        <aside style={styles.sidebar}>
          {loadingLists ? (
            <div className="shimmer" style={{ height: "200px", borderRadius: "0.5rem" }}></div>
          ) : (
            <div style={styles.tabsList}>
              {lists.map((lst) => {
                const isActive = lst.id === activeListId;
                return (
                  <button
                    key={lst.id}
                    onClick={() => setActiveListId(lst.id)}
                    style={{
                      ...styles.tabBtn,
                      backgroundColor: isActive ? "rgba(139, 92, 246, 0.1)" : "transparent",
                      borderLeft: isActive ? "4px solid var(--primary)" : "4px solid transparent",
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      fontWeight: isActive ? "600" : "400",
                    }}
                  >
                    <span>{lst.name}</span>
                    <span style={styles.badge}>{lst.book_count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Content shelf */}
        <main style={styles.mainContent}>
          {loadingDetail ? (
            <div className="card-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-panel shimmer" style={{ height: "350px", borderRadius: "1rem" }}></div>
              ))}
            </div>
          ) : activeListDetail ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={styles.listHeader}>
                <h2 className="font-serif" style={styles.listName}>{activeListDetail.name}</h2>
                {!activeListDetail.is_default && (
                  <button onClick={handleDeleteList} className="btn btn-text" style={{ color: "var(--error)" }}>
                    <Trash2 size={16} />
                    <span>Delete Bookshelf</span>
                  </button>
                )}
              </div>

              {activeListDetail.books?.length > 0 ? (
                <div className="card-grid">
                  {activeListDetail.books.map((book) => (
                    <div key={book.id} style={{ position: "relative" }}>
                      <BookCard book={book} />
                      <button
                        onClick={() => handleRemoveBook(book.id)}
                        style={styles.removeBookBtn}
                        title="Remove from bookshelf"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel" style={styles.emptyState}>
                  <BookOpen size={48} color="var(--text-muted)" />
                  <h3 style={{ marginTop: "1rem" }}>Your shelf is empty</h3>
                  <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
                    There are no books saved on this shelf. Browse the library to add books.
                  </p>
                  <a href="/browse" className="btn btn-primary">
                    <span>Browse Library</span>
                    <ArrowRight size={18} />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel" style={styles.emptyState}>
              <p>Please select a bookshelf from the sidebar to view books.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    paddingTop: "2rem",
    paddingBottom: "4rem",
    textAlign: "left",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  createBtn: {
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
    gap: "0.4rem",
  },
  createForm: {
    padding: "1.5rem",
    marginBottom: "2rem",
  },
  formRow: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  layout: {
    display: "flex",
    gap: "2.5rem",
    flexWrap: "wrap",
  },
  sidebar: {
    flex: "0 0 260px",
  },
  mainContent: {
    flex: 1,
    minWidth: "300px",
  },
  tabsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  tabBtn: {
    width: "100%",
    padding: "0.75rem 1rem",
    background: "transparent",
    border: "none",
    borderLeft: "4px solid transparent",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "0.95rem",
    transition: "all 0.2s",
    borderRadius: "0.25rem",
  },
  badge: {
    padding: "0.15rem 0.5rem",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid var(--border-color)",
    borderRadius: "1rem",
    fontSize: "0.75rem",
    color: "var(--text-secondary)",
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "0.75rem",
  },
  listName: {
    fontSize: "1.6rem",
  },
  removeBookBtn: {
    position: "absolute",
    top: "0.5rem",
    right: "0.5rem",
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    border: "none",
    color: "#fff",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
    zIndex: 5,
    transition: "opacity 0.2s",
    "&:hover": {
      backgroundColor: "var(--error)",
    },
  },
  emptyState: {
    padding: "4rem 2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
};

// Breakpoint responsive layout for tabs/sidebar list
const readingListTag = document.createElement("style");
readingListTag.innerHTML = `
  @media (max-width: 768px) {
    div[style*="layout"] {
      flex-direction: column !important;
      gap: 1.5rem !important;
    }
    aside[style*="sidebar"] {
      flex: 0 0 100% !important;
      width: 100% !important;
    }
  }
`;
document.head.appendChild(readingListTag);

export default ReadingList;
