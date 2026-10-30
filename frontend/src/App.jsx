import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import AIAssistantDrawer from "./components/AIAssistantDrawer";

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
  const { user } = useAuth();
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-transition-enter" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Routes location={location}>
        {/* Default route: Login page (1st image) for guests, Home dashboard for logged-in users */}
        <Route path="/" element={user ? <Home /> : <Login initialTab="login" />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/books/:bookId" element={<BookDetails />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login initialTab="login" />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

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
          <AIAssistantDrawer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
