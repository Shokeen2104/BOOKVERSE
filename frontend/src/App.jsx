import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

// Pages
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import BookDetails from "./pages/BookDetails";
import Profile from "./pages/Profile";
import ReadingList from "./pages/ReadingList";
import Login from "./pages/Login";
import Register from "./pages/Register";

import "./App.css";

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-transition-enter" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Routes location={location}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/books/:bookId" element={<BookDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reading-list"
          element={
            <ProtectedRoute>
              <ReadingList />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <main>
            <ErrorBoundary>
              <AnimatedRoutes />
            </ErrorBoundary>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
