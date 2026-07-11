import React, { useState } from "react";
import { Star } from "lucide-react";

const StarRating = ({ rating, onChange = null, maxStars = 5, size = 20 }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || rating || 0;

  return (
    <div style={{ display: "inline-flex", gap: "0.25rem", alignItems: "center" }}>
      {[...Array(maxStars)].map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= displayRating;
        
        return (
          <span
            key={i}
            onClick={() => onChange && onChange(starValue)}
            onMouseEnter={() => onChange && setHoverRating(starValue)}
            onMouseLeave={() => onChange && setHoverRating(0)}
            style={{
              cursor: onChange ? "pointer" : "default",
              display: "inline-flex",
              alignItems: "center",
              transition: "transform 0.1s ease",
              transform: onChange && hoverRating === starValue ? "scale(1.15)" : "scale(1)",
            }}
          >
            <Star
              size={size}
              fill={isFilled ? "var(--accent)" : "transparent"}
              color={isFilled ? "var(--accent)" : "var(--text-muted)"}
              style={{ strokeWidth: 1.5 }}
            />
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;
