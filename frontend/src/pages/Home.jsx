import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, BookOpen, Star, TrendingUp } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import BookCard from "../components/BookCard";

const Home = () => {
  const { user } = useAuth();
  const [trending, setTrending] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await api.get("/books/trending?limit=4");
        setTrending(response.data.books || []);
      } catch (e) {
        console.error("Failed to fetch trending books:", e);
      } finally {
        setLoadingTrending(false);
      }
    };

    const fetchRecommendations = async () => {
      if (!user) {
        setLoadingRecs(false);
        return;
      }
      try {
        const response = await api.get("/books/recommendations?limit=4");
        setRecommendations(response.data.books || []);
      } catch (e) {
        console.error("Failed to fetch recommendations:", e);
      } finally {
        setLoadingRecs(false);
      }
    };

    fetchTrending();
    fetchRecommendations();
  }, [user]);

  return (
    <div className="container animate-fade-in" style={styles.home}>
      {/* Hero Section */}
      <section className="glass-panel" style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.badge}>
            <Sparkles size={14} color="var(--primary)" />
            <span>Discover Your Next Chapter</span>
          </div>
          {user && (
            <div style={{ fontSize: '1.3rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '-0.5rem' }}>
              Hey {user.username}, enjoy reading!
            </div>
          )}
          <h1 className="font-serif" style={styles.heroTitle}>
            Where books meet their <span style={styles.gradientText}>perfect reader</span>.
          </h1>
          <p style={styles.heroSubtitle}>
            Join BookVerse to discover trending novels, share raw reviews, build your digital bookshelves, and sync recommendations.
          </p>
          <div style={styles.heroActions}>
            <Link to="/browse" className="btn btn-primary">
              <span>Browse Library</span>
              <ArrowRight size={18} />
            </Link>
            {!user && (
              <Link to="/register" className="btn btn-secondary">
                <span>Sign Up Free</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Trending Books */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitleWrapper}>
            <TrendingUp size={22} color="var(--primary)" />
            <h2 className="font-serif" style={styles.sectionTitle}>Trending Books</h2>
          </div>
          <Link to="/browse?sort=rating" style={styles.viewAll}>
            <span>View all</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {loadingTrending ? (
          <div className="card-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-panel shimmer" style={{ height: "400px", borderRadius: "1rem" }}></div>
            ))}
          </div>
        ) : trending.length > 0 ? (
          <div className="card-grid">
            {trending.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={styles.emptyState}>
            <BookOpen size={48} color="var(--text-muted)" />
            <p>No books in library yet. Use search in the navbar to import books from Google Books!</p>
          </div>
        )}
      </section>

      {/* Personalized Recommendations */}
      {user && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitleWrapper}>
              <Sparkles size={22} color="var(--accent)" />
              <h2 className="font-serif" style={styles.sectionTitle}>Recommended For You</h2>
            </div>
          </div>

          {loadingRecs ? (
            <div className="card-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-panel shimmer" style={{ height: "400px", borderRadius: "1rem" }}></div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="card-grid">
              {recommendations.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={styles.emptyState}>
              <Star size={48} color="var(--text-muted)" />
              <p style={{ marginTop: "1rem" }}>
                Add details in your profile like favorite genres or write a review to generate recommendations!
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

const styles = {
  home: {
    paddingTop: "2rem",
    paddingBottom: "4rem",
  },
  hero: {
    padding: "4rem 3rem",
    textAlign: "center",
    marginBottom: "4rem",
    background: "radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent), rgba(255, 255, 255, 0.4)",
  },
  heroContent: {
    maxWidth: "800px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.5rem",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.4rem 1rem",
    borderRadius: "2rem",
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    border: "1px solid rgba(139, 92, 246, 0.2)",
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  heroTitle: {
    fontSize: "3.2rem",
    fontWeight: "700",
    letterSpacing: "-1.5px",
    lineHeight: "1.15",
  },
  gradientText: {
    background: "linear-gradient(90deg, var(--primary), var(--accent))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSubtitle: {
    fontSize: "1.15rem",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
    maxWidth: "640px",
  },
  heroActions: {
    display: "flex",
    gap: "1rem",
    marginTop: "1rem",
  },
  section: {
    marginBottom: "4rem",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  sectionTitleWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  sectionTitle: {
    fontSize: "1.8rem",
  },
  viewAll: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "var(--primary)",
  },
  emptyState: {
    padding: "3rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-secondary)",
    textAlign: "center",
  },
};

export default Home;
