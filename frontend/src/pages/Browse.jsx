import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/axios";
import BookCard from "../components/BookCard";

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "";
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("rating");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  const isMounted = useRef(false);

  const fetchBooks = async () => {
    setLoading(true);
    const activeSearchQuery = searchParams.get("search") || "";
    try {
      if (activeSearchQuery.trim()) {
        // Search Google Books API (via backend proxy)
        const response = await api.get("/books/search", {
          params: { q: activeSearchQuery, page, limit: 12 },
        });
        setBooks(response.data.books || []);
        // Calculate pages based on API return
        const total = response.data.total || 0;
        setTotalBooks(total);
        setTotalPages(Math.ceil(total / 12) || 1);
      } else {
        // Browse locally cached library database
        const response = await api.get("/books/browse", {
          params: {
            page,
            limit: 12,
            category: category || undefined,
            sort_by: sortBy,
          },
        });
        setBooks(response.data.books || []);
        setTotalBooks(response.data.total || 0);
        setTotalPages(response.data.pages || 1);
      }
    } catch (e) {
      console.error("Failed to fetch books:", e);
    } finally {
      setLoading(false);
    }
  };

  // Run search when URL search params change
  useEffect(() => {
    const searchVal = searchParams.get("search") || "";
    const catVal = searchParams.get("category") || "";
    setSearchQuery(searchVal);
    setCategory(catVal);
    setPage(1);
  }, [searchParams]);

  // Trigger search fetch on state change
  const activeSearchQuery = searchParams.get("search") || "";
  useEffect(() => {
    fetchBooks();
  }, [page, category, sortBy, activeSearchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = {};
    if (searchQuery.trim()) {
      newParams.search = searchQuery.trim();
    }
    setSearchParams(newParams);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchParams({});
  };

  return (
    <div className="container animate-fade-in" style={styles.container}>
      <div style={styles.headerContainer}>
        <div style={styles.headerText}>
          <h1 className="font-serif">Discover Books</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem", fontStyle: "italic" }}>
            {activeSearchQuery
              ? "Search results from the online catalog."
              : '"A reader lives a thousand lives before he dies. The man who never reads lives only one." - George R.R. Martin'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={styles.filterBar}>
        <form onSubmit={handleSearchSubmit} style={styles.searchWrapper}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search titles, authors, ISBNs online..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button type="button" onClick={handleClearSearch} style={styles.clearBtn}>
              Clear
            </button>
          )}
          <button type="submit" className="btn btn-primary" style={styles.searchSubmit}>
            Search
          </button>
        </form>

        {(!activeSearchQuery) && (
          <div style={styles.optionsWrapperLocal}>
            <div style={styles.selects}>
              {/* Category selector */}
              <div style={styles.selectWrapper}>
                <SlidersHorizontal size={14} color="var(--text-muted)" />
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  style={styles.select}
                >
                  <option value="">All Genres</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Biography">Biography</option>
                  <option value="History">History</option>
                  <option value="Science">Science</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Mystery">Mystery</option>
                </select>
              </div>

              {/* Sort selector */}
              <div style={styles.selectWrapper}>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  style={styles.select}
                >
                  <option value="rating">Top Rated</option>
                  <option value="title">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="card-grid">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="glass-panel shimmer" style={{ height: "400px", borderRadius: "1rem" }}></div>
          ))}
        </div>
      ) : books.length > 0 ? (
        <>
          <div className="card-grid">
            {books.map((book) => (
              <BookCard key={book.id || book.google_books_id} book={book} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary"
                style={styles.pageBtn}
              >
                <ChevronLeft size={18} />
                <span>Prev</span>
              </button>
              <span style={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary"
                style={styles.pageBtn}
              >
                <span>Next</span>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="glass-panel" style={styles.emptyState}>
          <BookOpen size={48} color="var(--text-muted)" />
          <h3 style={{ marginTop: "1rem" }}>No books found</h3>
          <p style={{ color: "var(--text-secondary)", maxWidth: "400px", marginTop: "0.5rem" }}>
            {activeSearchQuery
              ? "We couldn't find any books matching that query online. Try searching for authors or generic keywords."
              : "No books match your genre filters yet."}
          </p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    paddingTop: "2rem",
    paddingBottom: "4rem",
  },
  headerContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "2rem",
    gap: "1rem",
  },
  headerText: {
    textAlign: "center",
  },
  switchModeBtn: {
    padding: "0.6rem 1.2rem",
    fontSize: "0.95rem",
    borderRadius: "2rem",
  },
  filterBar: {
    padding: "1.5rem",
    marginBottom: "2.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    border: "1px solid var(--border-color)",
    borderRadius: "0.5rem",
    padding: "0.25rem 0.5rem 0.25rem 1rem",
    gap: "0.5rem",
  },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    fontSize: "0.95rem",
    padding: "0.5rem 0",
  },
  clearBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: "0.85rem",
    "&:hover": {
      color: "var(--text-primary)",
    },
  },
  searchSubmit: {
    padding: "0.5rem 1.25rem",
    fontSize: "0.875rem",
  },
  optionsWrapperLocal: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },
  selects: {
    display: "flex",
    gap: "1rem",
  },
  selectWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid var(--border-color)",
    borderRadius: "0.5rem",
    padding: "0.4rem 0.75rem",
  },
  select: {
    background: "transparent",
    border: "none",
    outline: "none",
    fontSize: "0.875rem",
    cursor: "pointer",
    color: "var(--text-primary)",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "1.5rem",
    marginTop: "3rem",
  },
  pageBtn: {
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
    gap: "0.25rem",
  },
  pageInfo: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
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



export default Browse;
