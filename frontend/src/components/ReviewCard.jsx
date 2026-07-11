import React, { useState } from "react";
import { Heart, Trash2, Edit } from "lucide-react";
import StarRating from "./StarRating";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const ReviewCard = ({ review, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(review.is_liked);
  const [likesCount, setLikesCount] = useState(review.likes_count);
  const [loading, setLoading] = useState(false);

  const isOwner = user && user.id === review.user_id;

  const handleLike = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await api.post(`/reviews/${review.id}/like`);
      setLiked(response.data.liked);
      setLikesCount((prev) => (response.data.liked ? prev + 1 : prev - 1));
    } catch (e) {
      console.error("Failed to toggle like:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="glass-panel" style={styles.card}>
      <div style={styles.header}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {review.avatar_url ? (
              <img src={review.avatar_url} alt={review.username} style={styles.avatarImg} />
            ) : (
              <span style={styles.avatarInitial}>{review.username[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <h5 style={styles.username}>{review.username}</h5>
            <span style={styles.date}>{formatDate(review.created_at)}</span>
          </div>
        </div>
        
        <div style={styles.ratingSection}>
          <StarRating rating={review.rating} size={16} />
        </div>
      </div>

      <div style={styles.body}>
        <h4 style={styles.reviewTitle}>{review.title}</h4>
        <p style={styles.content}>{review.content}</p>
      </div>

      <div style={styles.footer}>
        <button
          onClick={handleLike}
          disabled={loading || !user}
          style={{
            ...styles.likeBtn,
            color: liked ? "var(--error)" : "var(--text-secondary)",
          }}
        >
          <Heart size={18} fill={liked ? "var(--error)" : "transparent"} />
          <span style={styles.likeCount}>{likesCount}</span>
        </button>

        {isOwner && (
          <div style={styles.ownerActions}>
            {onUpdate && (
              <button onClick={() => onUpdate(review)} style={styles.actionBtn}>
                <Edit size={16} />
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(review.id)} style={{ ...styles.actionBtn, color: "var(--error)" }}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: {
    padding: "1.5rem",
    marginBottom: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    textAlign: "left",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "var(--primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarInitial: {
    fontWeight: "600",
    color: "#fff",
  },
  username: {
    fontSize: "0.95rem",
    fontWeight: "600",
  },
  date: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  ratingSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  reviewTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  content: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    whiteSpace: "pre-line",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid var(--border-color)",
    paddingTop: "0.75rem",
  },
  likeBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.85rem",
    transition: "transform 0.1s ease",
    "&:active": {
      transform: "scale(0.95)",
    },
  },
  likeCount: {
    fontWeight: "500",
  },
  ownerActions: {
    display: "flex",
    gap: "0.75rem",
  },
  actionBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "var(--text-muted)",
    padding: "0.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": {
      color: "var(--text-primary)",
    },
  },
};

export default ReviewCard;
