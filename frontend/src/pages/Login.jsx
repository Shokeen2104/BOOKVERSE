import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <BookOpen size={40} color="var(--primary)" />
          <h2 className="font-serif" style={styles.title}>Welcome back to BookVerse</h2>
          <p style={styles.subtitle}>Enter your details to sign in to your account</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={loading}
          >
            <LogIn size={18} />
            <span>{loading ? "Signing In..." : "Sign In"}</span>
          </button>
        </form>

        <div style={styles.footer}>
          <span>Don't have an account? </span>
          <Link to="/register" style={styles.link}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "80vh",
    paddingTop: "2rem",
    paddingBottom: "2rem",
  },
  card: {
    width: "100%",
    maxWidth: "450px",
    padding: "3rem 2.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "0.5rem",
  },
  title: {
    fontSize: "1.75rem",
    marginTop: "0.5rem",
  },
  subtitle: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
  },
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
  },
  footer: {
    textAlign: "center",
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
  },
  link: {
    color: "var(--primary)",
    fontWeight: "600",
  },
};

export default Login;
