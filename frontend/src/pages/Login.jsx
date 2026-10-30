import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BookOpen, LogIn, UserPlus, AlertCircle, Sparkles, Star, Bot, Compass } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Login = ({ initialTab = "login" }) => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(
    location.pathname === "/register" || initialTab === "register" ? "register" : "login"
  );

  // Sync tab with route changes if user navigates via browser back/forward
  useEffect(() => {
    if (location.pathname === "/register") {
      setActiveTab("register");
    } else if (location.pathname === "/login") {
      setActiveTab("login");
    }
  }, [location.pathname]);

  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError("");
    // Update URL smoothly without full navigation
    window.history.replaceState(null, "", tab === "register" ? "/register" : "/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (activeTab === "login") {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      navigate("/");
    } catch (err) {
      const fallbackMsg =
        activeTab === "login"
          ? "Login failed. Please check your credentials."
          : "Registration failed. Please try again.";
      setError(err.response?.data?.detail || fallbackMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container auth-wrapper animate-fade-in">
      <div className="auth-split-grid">
        {/* Left: Value Proposition & Branding Showcase */}
        <div className="glass-panel auth-showcase-panel">
          <div>
            <div className="auth-pill-badge">
              <Sparkles size={14} />
              <span>Welcome to BookVerse</span>
            </div>

            <h1 className="font-serif auth-headline">
              Discover. Read.{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, var(--primary) 0%, #ec4899 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Explore.
              </span>
            </h1>

            <p className="auth-subheadline">
              Your next great read, powered by readers and AI.
            </p>

            <div className="auth-features-list">
              <div className="auth-feature-item">
                <div className="auth-feature-icon-wrapper reviews">
                  <Star size={20} />
                </div>
                <div>
                  <div className="auth-feature-title">Community Book Reviews</div>
                  <div className="auth-feature-desc">
                    Discover candid reviews, honest ratings, and curated shelves from fellow book lovers.
                  </div>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon-wrapper summaries">
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="auth-feature-title">AI-Powered Summaries</div>
                  <div className="auth-feature-desc">
                    Get instant chapter takeaways, key themes, character arcs, and pacing metrics in seconds.
                  </div>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon-wrapper conversations">
                  <Bot size={20} />
                </div>
                <div>
                  <div className="auth-feature-title">Intelligent Conversations</div>
                  <div className="auth-feature-desc">
                    Chat with your dedicated AI reader companion to unpack deep symbolism, twists, and ideas.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-value-banner">
            <Compass size={22} color="var(--primary)" style={{ flexShrink: 0 }} />
            <div>
              Book reviews, AI-powered summaries, and intelligent conversations — <strong>all in one place</strong>.
            </div>
          </div>
        </div>

        {/* Right: Auth Card with Sign In / Create Account Toggle */}
        <div className="glass-panel auth-form-panel">
          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === "login" ? "active" : ""}`}
              onClick={() => handleTabChange("login")}
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === "register" ? "active" : ""}`}
              onClick={() => handleTabChange("register")}
            >
              <UserPlus size={15} />
              <span>Create Account</span>
            </button>
          </div>

          <div className="auth-form-header">
            <BookOpen size={38} color="var(--primary)" />
            <h2 className="font-serif auth-form-title">
              {activeTab === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="auth-form-subtitle">
              {activeTab === "login"
                ? "Enter your credentials to access your library"
                : "Join BookVerse to review books and curate bookshelves"}
            </p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {activeTab === "register" && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-username">Username</label>
                <input
                  id="auth-username"
                  type="text"
                  className="form-control"
                  placeholder="bookworm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                className="form-control"
                placeholder={activeTab === "register" ? "Min. 6 characters" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={activeTab === "register" ? 6 : undefined}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={styles.submitBtn}
              disabled={loading}
            >
              {activeTab === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
              <span>
                {loading
                  ? activeTab === "login"
                    ? "Signing In..."
                    : "Creating Account..."
                  : activeTab === "login"
                  ? "Sign In"
                  : "Create Account"}
              </span>
            </button>
          </form>

          <div className="auth-footer">
            {activeTab === "login" ? (
              <span>
                Don't have an account?
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => handleTabChange("register")}
                >
                  Create Account
                </button>
              </span>
            ) : (
              <span>
                Already have an account?
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => handleTabChange("login")}
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  submitBtn: {
    width: "100%",
    marginTop: "1rem",
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
    marginBottom: "1rem",
  },
};

export default Login;
