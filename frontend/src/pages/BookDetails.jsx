import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, BookOpen, MessageSquarePlus, Bookmark, Check, Plus, AlertCircle, Heart, X } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StarRating from "../components/StarRating";
import ReviewCard from "../components/ReviewCard";

const BookDetails = () => {
  const { bookId } = useParams();
  const { user } = useAuth();
  
  const [book, setBook] = useState(null);
  const [reviewsData, setReviewsData] = useState({ reviews: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Add/Edit review states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [formError, setFormError] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Reading list states
  const [lists, setLists] = useState([]);
  const [showListDropdown, setShowListDropdown] = useState(false);

  const fetchBookDetails = async () => {
    try {
      const response = await api.get(`/books/${bookId}`);
      setBook(response.data);
    } catch (e) {
      console.error("Failed to fetch book detail:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookReviews = async () => {
    setLoadingReviews(true);
    try {
      const response = await api.get(`/reviews/book/${bookId}`);
      setReviewsData(response.data);
    } catch (e) {
      console.error("Failed to fetch book reviews:", e);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchListStatus = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/reading-lists/book-status/${bookId}`);
      setLists(response.data);
    } catch (e) {
      console.error("Failed to fetch list status:", e);
    }
  };

  useEffect(() => {
    fetchBookDetails();
    fetchBookReviews();
    fetchListStatus();
  }, [bookId]);

  const handleToggleList = async (listId, containsBook) => {
    // Optimistic UI update
    setLists(prevLists => 
      prevLists.map(lst => 
        lst.list_id === listId ? { ...lst, contains_book: !containsBook } : lst
      )
    );
    
    try {
      if (containsBook) {
        await api.delete(`/reading-lists/${listId}/books/${bookId}`);
      } else {
        await api.post(`/reading-lists/${listId}/books`, { book_id: bookId });
      }
      fetchListStatus();
    } catch (e) {
      console.error("Failed to update list membership:", e);
      // Revert on error
      setLists(prevLists => 
        prevLists.map(lst => 
          lst.list_id === listId ? { ...lst, contains_book: containsBook } : lst
        )
      );
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmittingReview(true);

    // Text validation is no longer required as they can just rate the book
    // We only send the rating, title, and content.

    try {
      await api.post("/reviews", {
        book_id: bookId,
        rating,
        title: reviewTitle.trim(),
        content: reviewContent.trim(),
      });
      // Clear form
      setReviewTitle("");
      setReviewContent("");
      setRating(5);
      setShowReviewForm(false);
      
      // Refresh reviews & details (for average rating refresh)
      await fetchBookReviews();
      await fetchBookDetails();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Are you sure you want to delete your review?")) {
      try {
        await api.delete(`/reviews/${reviewId}`);
        await fetchBookReviews();
        await fetchBookDetails();
      } catch (e) {
        console.error("Failed to delete review:", e);
      }
    }
  };

  if (loading) {
    return (
      <div className="container" style={styles.loadingContainer}>
        <div className="glass-panel shimmer" style={{ height: "400px", borderRadius: "1rem" }}></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container" style={styles.emptyContainer}>
        <h2 className="font-serif">Book not found</h2>
        <Link to="/browse" className="btn btn-primary" style={{ marginTop: "1rem" }}>
          Browse Books
        </Link>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={styles.container}>
      {/* Book details Hero */}
      <div className="glass-panel" style={styles.hero}>
        <div style={styles.coverSection}>
          {book.cover_image ? (
            <img src={book.cover_image} alt={book.title} style={styles.cover} />
          ) : (
            <div style={styles.noCover}>No Cover Image</div>
          )}
        </div>

        <div style={styles.infoSection}>
          <h1 className="font-serif" style={styles.title}>{book.title}</h1>
          <p style={styles.authors}>by {book.authors?.join(", ") || "Unknown Author"}</p>

          <div style={styles.metaRow}>
            <StarRating rating={book.average_rating} size={18} />
            <span style={styles.ratingText}>
              {book.average_rating ? `${book.average_rating} out of 5 stars` : "No ratings yet"}
            </span>
            <span style={styles.dot}>•</span>
            <span style={styles.reviewsCount}>{reviewsData.total} reviews</span>
          </div>

          <div style={styles.tagsRow}>
            {book.categories?.map((cat, i) => (
              <span key={i} style={styles.tag}>{cat}</span>
            ))}
            {book.page_count > 0 && (
              <span style={{ ...styles.tag, background: "rgba(255,255,255,0.03)" }}>
                {book.page_count} pages
              </span>
            )}
          </div>

          {book.description && (
            <div style={styles.descriptionContainer}>
              <h3 style={styles.sectionHeading}>Synopsis</h3>
              <p style={styles.description}>{book.description}</p>
            </div>
          )}

          <div style={styles.actionButtons}>
            {user ? (
              <div style={styles.dropdownWrapper}>
                <button
                  onClick={() => setShowListDropdown(!showListDropdown)}
                  className="btn btn-secondary"
                  style={styles.actionBtn}
                >
                  <Bookmark size={18} />
                  <span>Update bookshelves</span>
                </button>
                {showListDropdown && (
                  <div className="glass-panel" style={styles.listDropdown}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Save book to:</span>
                      <button onClick={() => setShowListDropdown(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '0.1rem' }}>
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
                          onClick={() => handleToggleList(lst.list_id, lst.contains_book)}
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
            ) : (
              <Link to="/login" className="btn btn-secondary" style={styles.actionBtn}>
                <span>Sign in to save books</span>
              </Link>
            )}

            {user && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="btn btn-primary"
                style={styles.actionBtn}
              >
                <MessageSquarePlus size={18} />
                <span>Rate & Review</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Review input Form */}
      {showReviewForm && (
        <div className="glass-panel animate-fade-in" style={styles.reviewForm}>
          <h3 className="font-serif" style={{ marginBottom: "1.5rem" }}>Write your review for {book.title}</h3>
          
          {formError && (
            <div style={styles.errorBox}>
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleReviewSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ marginBottom: "0.5rem" }}>Your Rating</label>
              <StarRating rating={rating} onChange={setRating} size={28} />
            </div>

            <div className="form-group">
              <label className="form-label">Review Headline (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Sum up your review in a short sentence..."
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Written Content (Optional)</label>
              <textarea
                className="form-control"
                rows={5}
                placeholder="What did you think? Share your thoughts on the plot, characters, writing style..."
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
              />
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowReviewForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingReview}
              >
                {submittingReview ? "Publishing..." : "Publish Review"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews list */}
      <div style={styles.reviewsSection}>
        <h2 className="font-serif" style={styles.sectionHeading}>Community Reviews</h2>
        {loadingReviews ? (
          <div style={styles.loadingReviews}>
            <div className="shimmer" style={{ height: "150px", borderRadius: "1rem", marginBottom: "1rem" }}></div>
            <div className="shimmer" style={{ height: "150px", borderRadius: "1rem" }}></div>
          </div>
        ) : reviewsData.reviews.length > 0 ? (
          <div>
            {reviewsData.reviews.map((rev) => (
              <ReviewCard
                key={rev.id}
                review={{ ...rev, is_liked: rev.is_liked }}
                onDelete={handleDeleteReview}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={styles.noReviews}>
            <BookOpen size={36} color="var(--text-muted)" />
            <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
              No reviews have been written for this book yet. Be the first to share your thoughts!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    paddingTop: "2rem",
    paddingBottom: "4rem",
  },
  loadingContainer: {
    paddingTop: "2rem",
  },
  emptyContainer: {
    paddingTop: "5rem",
    textAlign: "center",
  },
  hero: {
    display: "flex",
    gap: "3rem",
    padding: "2.5rem",
    marginBottom: "3rem",
    textAlign: "left",
    flexWrap: "wrap",
    position: "relative",
    zIndex: 10,
  },
  coverSection: {
    flex: "0 0 240px",
    height: "360px",
    borderRadius: "0.5rem",
    overflow: "hidden",
    boxShadow: "0 15px 30px rgba(0,0,0,0.5)",
    backgroundColor: "#161625",
  },
  cover: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  noCover: {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "var(--text-muted)",
  },
  infoSection: {
    flex: "1 1 500px",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  title: {
    fontSize: "2.5rem",
    lineHeight: "1.2",
    fontWeight: "700",
  },
  authors: {
    fontSize: "1.2rem",
    color: "var(--text-secondary)",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  ratingText: {
    fontSize: "0.95rem",
    fontWeight: "500",
  },
  dot: {
    color: "var(--text-muted)",
  },
  reviewsCount: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
  },
  tagsRow: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  tag: {
    padding: "0.3rem 0.8rem",
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    border: "1px solid rgba(139, 92, 246, 0.2)",
    borderRadius: "2rem",
    fontSize: "0.8rem",
    fontWeight: "600",
  },
  sectionHeading: {
    fontSize: "1.3rem",
    marginBottom: "0.5rem",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "0.25rem",
  },
  descriptionContainer: {
    marginTop: "0.5rem",
  },
  description: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
    maxHeight: "180px",
    overflowY: "auto",
    paddingRight: "0.5rem",
  },
  actionButtons: {
    display: "flex",
    gap: "1rem",
    marginTop: "auto",
    paddingTop: "1.5rem",
    flexWrap: "wrap",
  },
  actionBtn: {
    padding: "0.6rem 1.25rem",
    fontSize: "0.9rem",
    gap: "0.5rem",
  },
  dropdownWrapper: {
    position: "relative",
  },
  listDropdown: {
    position: "absolute",
    top: "100%",
    left: "0",
    marginTop: "0.5rem",
    zIndex: 10,
    width: "220px",
    padding: "0.5rem",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
  },
  dropdownItem: {
    width: "100%",
    background: "transparent",
    border: "none",
    padding: "0.5rem 0.75rem",
    fontSize: "0.85rem",
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
  reviewForm: {
    padding: "2rem",
    marginBottom: "3rem",
    textAlign: "left",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    padding: "0.75rem 1rem",
    borderRadius: "0.5rem",
    color: "var(--error)",
    fontSize: "0.9rem",
    marginBottom: "1.5rem",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
    marginTop: "1.5rem",
  },
  reviewsSection: {
    textAlign: "left",
  },
  loadingReviews: {
    display: "flex",
    flexDirection: "column",
  },
  noReviews: {
    padding: "3rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
};

// Breakpoint updates for mobile screens
const detailsTag = document.createElement("style");
detailsTag.innerHTML = `
  @media (max-width: 640px) {
    div[style*="hero"] {
      flex-direction: column !important;
      align-items: center !important;
      gap: 1.5rem !important;
      padding: 1.5rem !important;
    }
    div[style*="coverSection"] {
      flex: 0 0 auto !important;
      width: 180px !important;
      height: 270px !important;
    }
    h1[style*="title"] {
      font-size: 1.8rem !important;
      text-align: center !important;
    }
    p[style*="authors"] {
      text-align: center !important;
    }
    div[style*="metaRow"] {
      justify-content: center !important;
    }
    div[style*="tagsRow"] {
      justify-content: center !important;
    }
    div[style*="actionButtons"] {
      justify-content: center !important;
      width: 100% !important;
    }
  }
`;
document.head.appendChild(detailsTag);

export default BookDetails;
