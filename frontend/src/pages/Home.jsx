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
      {/* Logged in Welcome Dashboard Header */}
      {user && (
        <div style={styles.dashboardHeader}>
          <div>
            <h1 className="font-serif" style={styles.welcomeTitle}>
              Welcome back, <span style={styles.gradientText}>{user.username}</span>
            </h1>
            <p style={styles.welcomeSubtitle}>
              Explore trending books, personalized recommendations, or ask your AI reader assistant.
            </p>
          </div>
          <Link to="/browse" className="btn btn-primary">
            <span>Browse Library</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      )}

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
  dashboardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1.25rem",
    marginBottom: "3rem",
    padding: "1.75rem 2rem",
    borderRadius: "1rem",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    border: "1px solid var(--border-color)",
  },
  welcomeTitle: {
    fontSize: "2.2rem",
    fontWeight: "700",
    letterSpacing: "-0.5px",
    marginBottom: "0.25rem",
  },
  welcomeSubtitle: {
    fontSize: "1rem",
    color: "var(--text-secondary)",
  },
  gradientText: {
    background: "linear-gradient(90deg, var(--primary), var(--accent))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
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
