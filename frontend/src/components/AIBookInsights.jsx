import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Zap, Compass, Brain, Heart, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import api from "../api/axios";

const METRIC_CONFIG = {
  pacing: {
    title: "Pacing",
    icon: Zap,
    color: "#f59e0b", // Amber
    lowLabel: "Slow Burn",
    highLabel: "Breathless",
  },
  plot_complexity: {
    title: "Plot Complexity",
    icon: Compass,
    color: "#8b5cf6", // Purple
    lowLabel: "Linear",
    highLabel: "Twisty / Layered",
  },
  character_depth: {
    title: "Character Depth",
    icon: Brain,
    color: "#3b82f6", // Blue
    lowLabel: "Plot-Driven",
    highLabel: "Deep Study",
  },
  emotional_intensity: {
    title: "Emotional Tone",
    icon: Heart,
    color: "#ec4899", // Pink
    lowLabel: "Light / Cozy",
    highLabel: "Harrowing / Intense",
  },
  accessibility: {
    title: "Accessibility",
    icon: BookOpen,
    color: "#10b981", // Emerald
    lowLabel: "Dense / Challenging",
    highLabel: "Page-Turner",
  },
};

const AIBookInsights = ({ bookId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsights = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/ai/book-insights/${bookId}`, {
        params: { refresh: forceRefresh },
      });
      setData(response.data);
    } catch (err) {
      console.error("Failed to fetch AI insights:", err);
      setError("Unable to generate AI analysis at this moment.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (bookId) {
      fetchInsights(false);
    }
  }, [bookId]);

  if (loading) {
    return (
      <div style={styles.cardContainer} className="glass-panel">
        <div style={styles.loadingWrapper}>
          <div style={styles.sparkleAnimation}>
            <Sparkles size={28} color="#6366f1" className="animate-spin" />
          </div>
          <div style={{ textAlign: "center" }}>
            <h4 className="font-serif" style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>
              Generating AI Literary Breakdown
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Analyzing pacing, plot complexity, character depth, and thematic nuances...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.insights) {
    return (
      <div style={styles.cardContainer} className="glass-panel">
        <div style={styles.errorWrapper}>
          <AlertCircle size={22} color="var(--error)" />
          <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            {error || "AI breakdown currently unavailable."}
          </span>
          <button
            onClick={() => fetchInsights(true)}
            className="btn btn-secondary"
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const { insights, is_cached } = data;
  const { executive_summary, analytics, key_themes, mood_atmosphere, target_audience, notable_tropes } = insights;

  return (
    <div style={styles.cardContainer} className="glass-panel animate-fade-in">
      {/* Header bar */}
      <div style={styles.header}>
        <div style={styles.headerTitleWrap}>
          <div style={styles.iconBadge}>
            <Sparkles size={18} color="#6366f1" />
          </div>
          <div>
            <h3 className="font-serif" style={styles.title}>
              AI Book DNA & Analytics
            </h3>
            <span style={styles.subtitle}>
              {is_cached ? "⚡ Instant cached insight" : "✨ Freshly synthesized via Gemini AI"}
            </span>
          </div>
        </div>

        <button
          onClick={() => fetchInsights(true)}
          disabled={refreshing}
          style={styles.refreshBtn}
          title="Regenerate analysis with latest context"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>
            {refreshing ? "Re-analyzing..." : "Refresh"}
          </span>
        </button>
      </div>

      {/* Executive Summary Pullout */}
      {executive_summary && (
        <div style={styles.summaryBox}>
          <span style={styles.summaryLabel}>AI EXECUTIVE SUMMARY</span>
          <p style={styles.summaryText}>{executive_summary}</p>
        </div>
      )}

      {/* 5-Dimensional Metric Meters */}
      <div style={styles.metricsGrid}>
        {Object.entries(METRIC_CONFIG).map(([key, config]) => {
          const metric = analytics?.[key];
          if (!metric) return null;
          const Icon = config.icon;
          const percent = Math.min(Math.max(metric.score * 10, 10), 100);

          return (
            <div key={key} style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <div style={styles.metricTitleRow}>
                  <Icon size={16} color={config.color} />
                  <span style={styles.metricTitle}>{config.title}</span>
                </div>
                <div style={styles.metricScoreBadge}>
                  <span style={{ fontWeight: 700, color: config.color }}>{metric.score}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/10</span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={styles.progressBarTrack}>
                <div
                  style={{
                    ...styles.progressBarFill,
                    width: `${percent}%`,
                    backgroundColor: config.color,
                  }}
                />
              </div>

              <div style={styles.metricLabelRow}>
                <span style={{ ...styles.metricDescriptor, color: config.color }}>
                  {metric.label}
                </span>
                <span style={styles.metricScaleHint}>{config.highLabel}</span>
              </div>

              <p style={styles.metricDesc}>{metric.description}</p>
            </div>
          );
        })}
      </div>

      {/* Metadata Badges (Themes, Atmosphere, Tropes) */}
      <div style={styles.metaRowWrap}>
        {key_themes && key_themes.length > 0 && (
          <div style={styles.metaColumn}>
            <span style={styles.metaGroupLabel}>CORE THEMES</span>
            <div style={styles.tagWrap}>
              {key_themes.map((theme, i) => (
                <span key={i} style={styles.themeTag}>
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {mood_atmosphere && mood_atmosphere.length > 0 && (
          <div style={styles.metaColumn}>
            <span style={styles.metaGroupLabel}>ATMOSPHERE & VIBE</span>
            <div style={styles.tagWrap}>
              {mood_atmosphere.map((mood, i) => (
                <span key={i} style={styles.moodTag}>
                  ✦ {mood}
                </span>
              ))}
            </div>
          </div>
        )}

        {notable_tropes && notable_tropes.length > 0 && (
          <div style={styles.metaColumn}>
            <span style={styles.metaGroupLabel}>NOTABLE TROPES</span>
            <div style={styles.tagWrap}>
              {notable_tropes.map((trope, i) => (
                <span key={i} style={styles.tropeTag}>
                  #{trope}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Target Audience Advisory */}
      {target_audience && (
        <div style={styles.audienceBox}>
          <div style={styles.audienceIcon}>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div>
            <span style={styles.audienceLabel}>WHO WILL LOVE THIS BOOK</span>
            <p style={styles.audienceText}>{target_audience}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  cardContainer: {
    margin: "2rem 0",
    padding: "1.75rem",
    borderRadius: "1rem",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    background: "rgba(255, 255, 255, 0.7)",
    boxShadow: "0 8px 30px rgba(99, 102, 241, 0.05)",
  },
  loadingWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem 1rem",
    gap: "1rem",
  },
  sparkleAnimation: {
    padding: "1rem",
    borderRadius: "50%",
    background: "rgba(99, 102, 241, 0.1)",
  },
  errorWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem",
    gap: "1rem",
    flexWrap: "wrap",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.25rem",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
  headerTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  iconBadge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "rgba(99, 102, 241, 0.12)",
    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.15)",
  },
  title: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: 0,
  },
  subtitle: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    background: "rgba(0, 0, 0, 0.04)",
    border: "1px solid var(--border-color)",
    padding: "0.4rem 0.75rem",
    borderRadius: "0.5rem",
    cursor: "pointer",
    color: "var(--text-secondary)",
    transition: "all 0.2s ease",
  },
  summaryBox: {
    background: "rgba(99, 102, 241, 0.05)",
    borderLeft: "4px solid var(--primary)",
    borderRadius: "0 0.5rem 0.5rem 0",
    padding: "1rem 1.25rem",
    marginBottom: "1.5rem",
  },
  summaryLabel: {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "var(--primary)",
    marginBottom: "0.35rem",
  },
  summaryText: {
    fontSize: "0.95rem",
    lineHeight: 1.6,
    color: "var(--text-primary)",
    margin: 0,
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  metricCard: {
    background: "rgba(255, 255, 255, 0.8)",
    padding: "1rem",
    borderRadius: "0.75rem",
    border: "1px solid var(--border-color)",
    display: "flex",
    flexDirection: "column",
  },
  metricHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.6rem",
  },
  metricTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  metricTitle: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  metricScoreBadge: {
    fontSize: "0.9rem",
  },
  progressBarTrack: {
    width: "100%",
    height: "6px",
    background: "rgba(0, 0, 0, 0.06)",
    borderRadius: "999px",
    overflow: "hidden",
    marginBottom: "0.45rem",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  metricLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.4rem",
  },
  metricDescriptor: {
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  metricScaleHint: {
    fontSize: "0.68rem",
    color: "var(--text-muted)",
  },
  metricDesc: {
    fontSize: "0.75rem",
    lineHeight: 1.4,
    color: "var(--text-secondary)",
    margin: 0,
  },
  metaRowWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "1.25rem",
    paddingTop: "1.25rem",
    borderTop: "1px solid var(--border-color)",
    marginBottom: "1.25rem",
  },
  metaColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  metaGroupLabel: {
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    color: "var(--text-muted)",
  },
  tagWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem",
  },
  themeTag: {
    fontSize: "0.75rem",
    padding: "0.25rem 0.6rem",
    borderRadius: "999px",
    background: "rgba(99, 102, 241, 0.08)",
    color: "var(--primary)",
    fontWeight: 500,
  },
  moodTag: {
    fontSize: "0.75rem",
    padding: "0.25rem 0.6rem",
    borderRadius: "999px",
    background: "rgba(245, 158, 11, 0.1)",
    color: "#b45309",
    fontWeight: 500,
  },
  tropeTag: {
    fontSize: "0.75rem",
    padding: "0.25rem 0.6rem",
    borderRadius: "999px",
    background: "rgba(16, 185, 129, 0.1)",
    color: "#047857",
    fontWeight: 500,
  },
  audienceBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    background: "rgba(16, 185, 129, 0.06)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    padding: "1rem",
    borderRadius: "0.75rem",
  },
  audienceIcon: {
    marginTop: "0.1rem",
  },
  audienceLabel: {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    color: "#059669",
    marginBottom: "0.25rem",
  },
  audienceText: {
    fontSize: "0.88rem",
    color: "var(--text-primary)",
    margin: 0,
    lineHeight: 1.5,
  },
};

export default AIBookInsights;
