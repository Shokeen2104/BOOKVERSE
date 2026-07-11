import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, BookOpen, Star, Sparkles, Edit3, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import ReviewCard from "../components/ReviewCard";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [selectedGenres, setSelectedGenres] = useState(user?.favorite_genres || []);
  const [updating, setUpdating] = useState(false);

  const GENRES = ["Fiction", "Fantasy", "Science Fiction", "Mystery", "Biography", "History", "Poetry", "Self-Help"];

  const fetchProfileData = async () => {
    if (!user) return;
    try {
      // Fetch stats
      const statsRes = await api.get("/users/me/stats");
      setStats(statsRes.data);

      // Fetch user reviews
      const reviewsRes = await api.get(`/users/${user.id}/reviews`);
      setReviews(reviewsRes.data.reviews || []);
    } catch (e) {
      console.error("Failed to load profile statistics / reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const handleGenreToggle = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateProfile({
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
        favorite_genres: selectedGenres,
      });
      setIsEditing(false);
      fetchProfileData();
    } catch (e) {
      console.error("Failed to save profile details:", e);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await api.delete(`/reviews/${reviewId}`);
        fetchProfileData();
      } catch (e) {
        console.error("Failed to delete review:", e);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="container animate-fade-in" style={styles.container}>
      {/* Profile summary card */}
      <div className="glass-panel" style={styles.profileHeader}>
        <div style={styles.avatarSection}>
          <div style={styles.avatar}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} style={styles.avatarImg} />
            ) : (
              <User size={48} color="#fff" />
            )}
          </div>
        </div>

        <div style={styles.infoSection}>
          <div style={styles.nameRow}>
            <h1 className="font-serif" style={styles.username}>{user.username}</h1>
            <button
              onClick={() => {
                setBio(user.bio || "");
                setAvatarUrl(user.avatar_url || "");
                setSelectedGenres(user.favorite_genres || []);
                setIsEditing(!isEditing);
              }}
              className="btn btn-secondary"
              style={styles.editBtn}
            >
              <Edit3 size={16} />
              <span>Edit Profile</span>
            </button>
          </div>
          <p style={styles.email}>{user.email}</p>
          <p style={styles.bio}>{user.bio || "No bio added yet."}</p>

          <div style={styles.genresRow}>
            {user.favorite_genres?.map((genre, i) => (
              <span key={i} style={styles.genreTag}>{genre}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Editing Form */}
      {isEditing && (
        <div className="glass-panel animate-fade-in" style={styles.editPanel}>
          <h3 className="font-serif" style={{ marginBottom: "1.5rem" }}>Update Profile Settings</h3>
          <form onSubmit={handleProfileSave}>
            <div className="form-group">
              <label className="form-label">Avatar Image URL</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bio description</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Tell others about your reading taste..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ marginBottom: "0.75rem" }}>Favorite Genres (Used for recommendations)</label>
              <div style={styles.genresSelectGrid}>
                {GENRES.map((genre) => {
                  const isSelected = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleGenreToggle(genre)}
                      style={{
                        ...styles.genreToggleBtn,
                        backgroundColor: isSelected ? "var(--primary)" : "rgba(255,255,255,0.02)",
                        borderColor: isSelected ? "var(--primary)" : "var(--border-color)",
                      }}
                    >
                      {genre}
                      {isSelected && <Check size={14} style={{ marginLeft: "0.25rem" }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={styles.editActions}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updating}
              >
                {updating ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reading stats */}
      <div style={styles.statsRow}>
        <div className="glass-panel" style={styles.statCard}>
          <BookOpen size={24} color="var(--primary)" />
          <div style={styles.statValue}>{stats?.total_books_in_lists || 0}</div>
          <div style={styles.statLabel}>Books Curated</div>
        </div>

        <div className="glass-panel" style={styles.statCard}>
          <Edit3 size={24} color="var(--primary)" />
          <div style={styles.statValue}>{stats?.total_reviews || 0}</div>
          <div style={styles.statLabel}>Reviews Published</div>
        </div>

        <div className="glass-panel" style={styles.statCard}>
          <Star size={24} color="var(--accent)" />
          <div style={styles.statValue}>{stats?.average_rating_given || 0}</div>
          <div style={styles.statLabel}>Average Star Rating Given</div>
        </div>
      </div>

      {/* Profile reviews list */}
      <div style={styles.reviewsListSection}>
        <h2 className="font-serif" style={styles.sectionHeading}>My Book Reviews</h2>
        {loading ? (
          <div className="shimmer" style={{ height: "150px", borderRadius: "1rem" }}></div>
        ) : reviews.length > 0 ? (
          <div>
            {reviews.map((rev) => (
              <div key={rev.id} style={styles.reviewWrapper}>
                <div style={styles.reviewBookHeader}>
                  {rev.book_cover && <img src={rev.book_cover} alt={rev.book_title} style={styles.smallCover} />}
                  <span style={styles.reviewBookTitle}>Reviewed <Link to={`/books/${rev.book_id}`} style={styles.bookLink}>{rev.book_title}</Link></span>
                </div>
                <ReviewCard
                  review={{ ...rev, username: user.username, avatar_url: user.avatar_url }}
                  onDelete={handleDeleteReview}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={styles.noReviews}>
            <p>You haven't written any reviews yet. Go to a book details page and write one!</p>
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
    textAlign: "left",
  },
  profileHeader: {
    display: "flex",
    gap: "2rem",
    padding: "2rem",
    marginBottom: "2.5rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  avatarSection: {
    flex: "0 0 100px",
  },
  avatar: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    backgroundColor: "var(--primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  infoSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  nameRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  },
  username: {
    fontSize: "2.2rem",
    fontWeight: "700",
  },
  editBtn: {
    padding: "0.4rem 1rem",
    fontSize: "0.85rem",
    gap: "0.3rem",
  },
  email: {
    fontSize: "0.9rem",
    color: "var(--text-muted)",
  },
  bio: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
  },
  genresRow: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
    marginTop: "0.5rem",
  },
  genreTag: {
    padding: "0.25rem 0.75rem",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid var(--border-color)",
    borderRadius: "2rem",
    fontSize: "0.75rem",
    fontWeight: "500",
  },
  editPanel: {
    padding: "2rem",
    marginBottom: "2.5rem",
  },
  genresSelectGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: "0.5rem",
  },
  genreToggleBtn: {
    padding: "0.5rem",
    borderRadius: "0.375rem",
    border: "1px solid",
    fontSize: "0.8rem",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    transition: "all 0.15s ease",
  },
  editActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
    marginTop: "1.5rem",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1.5rem",
    marginBottom: "3rem",
  },
  statCard: {
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "0.5rem",
  },
  statValue: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "var(--text-primary)",
  },
  statLabel: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  reviewsListSection: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  sectionHeading: {
    fontSize: "1.6rem",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "0.5rem",
    marginBottom: "1rem",
  },
  reviewWrapper: {
    marginBottom: "2rem",
  },
  reviewBookHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.5rem",
    fontSize: "0.875rem",
  },
  smallCover: {
    width: "28px",
    height: "40px",
    objectFit: "cover",
    borderRadius: "2px",
  },
  reviewBookTitle: {
    color: "var(--text-muted)",
  },
  bookLink: {
    color: "var(--primary)",
    fontWeight: "600",
  },
  noReviews: {
    padding: "3rem",
    textAlign: "center",
    color: "var(--text-secondary)",
  },
};

export default Profile;
