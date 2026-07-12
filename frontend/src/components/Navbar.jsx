import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, BookOpen, User, LogOut, Search, LogIn, Menu, X, BookMarked } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);


  return (
    <nav className="glass-panel" style={styles.nav}>
      <div className="container" style={styles.container}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <BookOpen size={24} color="var(--primary)" />
          <span className="font-serif" style={styles.logoText}>BookVerse</span>
        </Link>



        {/* Desktop Links */}
        <div style={styles.navLinks}>
          <Link to="/browse" style={styles.link}>
            <Compass size={18} />
            <span>Discover</span>
          </Link>

          {user ? (
            <>
              <Link to="/reading-list" style={styles.link}>
                <BookMarked size={18} />
                <span>My Bookshelves</span>
              </Link>
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
                  style={{ ...styles.link, background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <User size={18} />
                  <span>{user.username}</span>
                </button>
                
                {profileDropdownOpen && (
                  <div className="glass-panel animate-fade-in" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '1.5rem',
                    width: '300px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    zIndex: 100,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                  }}>
                    <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ fontWeight: '700', fontSize: '1.2rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{user.username}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{user.email}</div>
                      {user.created_at && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '500' }}>
                          Account Age: {Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))} days
                        </div>
                      )}
                    </div>
                    
                    {user.bio && (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{user.bio}"
                      </div>
                    )}
                    
                    {user.favorite_genres && user.favorite_genres.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Preferences</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {user.favorite_genres.slice(0, 4).map((genre, i) => (
                            <span key={i} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>{genre}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <Link 
                        to="/profile" 
                        onClick={() => setProfileDropdownOpen(false)}
                        className="btn btn-primary" 
                        style={{ padding: '0.6rem', fontSize: '0.9rem', textAlign: 'center', display: 'flex', justifyContent: 'center' }}
                      >
                        Full Profile
                      </Link>
                      
                      <button 
                        onClick={() => { logout(); setProfileDropdownOpen(false); }} 
                        style={{ ...styles.logoutBtn, padding: '0.6rem', width: '100%', justifyContent: 'center', background: 'rgba(255,50,50,0.1)', borderRadius: '0.375rem', marginTop: '0.25rem' }}
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary" style={styles.loginBtn}>
              <LogIn size={16} />
              <span>Login</span>
            </Link>
          )}
        </div>

        {/* Mobile Menu Icon */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={styles.mobileToggle}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="glass-panel animate-fade-in" style={styles.mobileMenu}>

          <div style={styles.mobileLinks}>
            <Link to="/browse" style={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>
              <Compass size={18} />
              <span>Discover</span>
            </Link>
            {user ? (
              <>
                <Link to="/reading-list" style={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>
                  <BookMarked size={18} />
                  <span>My Bookshelves</span>
                </Link>
                <Link to="/profile" style={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>
                  <User size={18} />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  style={styles.mobileLogoutBtn}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link to="/login" style={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>
                <LogIn size={18} />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    borderWidth: "0 0 1px 0",
    borderRadius: 0,
    backgroundColor: "rgba(224, 242, 254, 0.8)",
  },
  container: {
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  logoText: {
    fontSize: "1.4rem",
    fontWeight: "700",
    letterSpacing: "-0.5px",
    background: "linear-gradient(90deg, #2563eb, #7c3aed)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  searchForm: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid var(--border-color)",
    borderRadius: "2rem",
    padding: "0.25rem 0.5rem 0.25rem 1rem",
    width: "40%",
    maxWidth: "500px",
    transition: "border-color 0.2s",
    "&:focus-within": {
      borderColor: "var(--primary)",
    },
  },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    fontSize: "0.875rem",
    padding: "0.4rem 0",
  },
  searchBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-secondary)",
    "&:hover": {
      color: "var(--primary)",
    },
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "var(--text-secondary)",
    "&:hover": {
      color: "var(--text-primary)",
    },
  },
  logoutBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "var(--text-secondary)",
    "&:hover": {
      color: "var(--error)",
    },
  },
  loginBtn: {
    padding: "0.5rem 1rem",
    fontSize: "0.85rem",
  },
  mobileToggle: {
    display: "none",
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },
  mobileMenu: {
    position: "absolute",
    top: "71px",
    left: 0,
    right: 0,
    borderRadius: 0,
    borderWidth: "0 0 1px 0",
    display: "flex",
    flexDirection: "column",
    paddingBottom: "1.5rem",
  },
  mobileLinks: {
    display: "flex",
    flexDirection: "column",
    padding: "0 1.5rem",
  },
  mobileLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 0",
    borderBottom: "1px solid var(--border-color)",
  },
  mobileLogoutBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 0",
    color: "var(--error)",
    textAlign: "left",
  },
};

// Inject media queries using standard style sheet
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  @media (max-width: 768px) {
    div[style*="navLinks"] {
      display: none !important;
    }
    form[style*="searchForm"] {
      display: none !important;
    }
    button[style*="mobileToggle"] {
      display: block !important;
    }
  }
`;
document.head.appendChild(styleTag);

export default Navbar;
