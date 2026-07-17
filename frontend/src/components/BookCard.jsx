import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Check, Plus, FolderHeart, X } from "lucide-react";
import StarRating from "./StarRating";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const BookCard = ({ book }) => {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check list status when dropdown is opened
  const fetchListStatus = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/reading-lists/book-status/${bookId}`);
      setLists(response.data);
    } catch (e) {
      console.error("Failed to fetch list status:", e);
    }
  };

  const handleToggleBook = async (listId, containsBook) => {
    // Optimistic UI update
    setLists(prevLists => 
      prevLists.map(lst => 
        lst.list_id === listId ? { ...lst, contains_book: !containsBook } : lst
      )
    );
    
    setLoading(true);
    try {
      if (containsBook) {
        await api.delete(`/reading-lists/${listId}/books/${bookId}`);
      } else {
        await api.post(`/reading-lists/${listId}/books`, { book_id: bookId });
      }
      // Re-fetch status in background to ensure sync
      fetchListStatus();
    } catch (e) {
      console.error("Error updating list membership:", e);
      // Revert optimistic update on failure
      setLists(prevLists => 
        prevLists.map(lst => 
          lst.list_id === listId ? { ...lst, contains_book: containsBook } : lst
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const bookId = book.id || book.google_books_id;

  return (
    <div className="glass-panel book-card animate-fade-in" style={styles.card}>
      <Link to={`/books/${bookId}`} style={styles.coverLink}>
        <div style={styles.coverWrapper}>
          {book.cover_image ? (
            <img src={book.cover_image} alt={book.title} style={styles.cover} />
          ) : (
            <div style={styles.noCover}>
              <span style={{ fontSize: "0.8rem", textAlign: "center", color: "var(--text-muted)" }}>
                No Cover Image
              </span>
            </div>
          )}
        </div>
      </Link>

      <div style={styles.info}>
        <h4 className="font-serif" style={styles.title}>
          <Link to={`/books/${bookId}`} style={styles.titleLink}>
            {book.title}
          </Link>
        </h4>
        <p style={styles.authors}>{book.authors?.join(", ") || "Unknown Author"}</p>
        
        {book.categories && book.categories.length > 0 && (
          <p style={styles.categories}>{book.categories.slice(0, 2).join(", ")}</p>
        )}
        
        <div style={styles.meta}>
          <StarRating rating={book.average_rating} size={14} />
          <span style={styles.ratingText}>{book.average_rating ? `${book.average_rating} (${book.total_reviews})` : "No ratings"}</span>
        </div>

        {user && (
          <div style={styles.actionWrapper}>
            <button
              onClick={() => {
                if (!showDropdown) fetchListStatus();
                setShowDropdown(!showDropdown);
              }}
              className="btn btn-secondary"
              style={styles.actionBtn}
            >
              <Bookmark size={16} />
              <span>Add to list</span>
            </button>

            {showDropdown && (
              <div className="glass-panel" style={styles.dropdown}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Save book to:</span>
                  <button onClick={() => setShowDropdown(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '0.1rem' }}>
                    <X size={14} />
                  </button>
                </div>
                {lists.length === 0 ? (
                  <div style={{ padding: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>
                    You have no lists yet.<br/>
                    <Link to="/lists" style={{ color: "var(--primary)", textDecoration: "underline" }}>Create one here</Link>
                  </div>
                ) : (
                  lists.map((lst) => (
                    <button
                      key={lst.list_id}
                      onClick={() => handleToggleBook(lst.list_id, lst.contains_book)}
                      disabled={loading}
                      style={styles.dropdownItem}
                    >
                      <span>{lst.name}</span>
                      {lst.contains_book ? (
                        <Check size={16} color="var(--success)" />
                      ) : (
                        <Plus size={16} color="var(--text-muted)" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: "100%",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease",
    position: "relative",
  },
  coverLink: {
    display: "block",
  },
  coverWrapper: {
    width: "100%",
    height: "280px",
    overflow: "hidden",
    position: "relative",
    background: "#12121c",
  },
  cover: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.4s ease",
  },
  noCover: {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#161625",
  },
  info: {
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  title: {
    fontSize: "1.05rem",
    fontWeight: "600",
    marginBottom: "0.25rem",
    lineHeight: "1.3",
    display: "-webkit-box",
    WebkitLineClamp: "2",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    height: "2.6rem",
  },
  titleLink: {
    color: "var(--text-primary)",
    "&:hover": {
      color: "var(--primary)",
    },
  },
  authors: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    marginBottom: "0.5rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  categories: {
    fontSize: "0.75rem",
    color: "var(--primary)",
    marginBottom: "0.5rem",
    fontWeight: "500",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  meta: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "auto",
    marginBottom: "0.75rem",
  },
  ratingText: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  actionWrapper: {
    position: "relative",
    width: "100%",
  },
  actionBtn: {
    width: "100%",
    padding: "0.5rem",
    fontSize: "0.85rem",
    gap: "0.25rem",
    borderRadius: "0.375rem",
  },
  dropdown: {
    position: "absolute",
    bottom: "100%",
    left: "0",
    right: "0",
    marginBottom: "0.5rem",
    zIndex: 10,
    padding: "0.5rem",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
  },
  dropdownHeader: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    padding: "0.25rem 0.5rem",
    borderBottom: "1px solid var(--border-color)",
    marginBottom: "0.25rem",
  },
  dropdownItem: {
    width: "100%",
    background: "transparent",
    border: "none",
    padding: "0.4rem 0.5rem",
    fontSize: "0.8rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    borderRadius: "0.25rem",
    transition: "background 0.2s",
    textAlign: "left",
    color: "var(--text-primary)",
    "&:hover": {
      background: "rgba(255,255,255,0.05)",
    },
  },
};

export default BookCard;
