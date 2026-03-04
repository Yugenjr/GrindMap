import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import ActivityHistory from "./components/ActivityHistory";
import PlatformManager from "./components/PlatformManager";
import ProtectedRoute from "./components/ProtectedRoute";
import Analytics from "./components/Analytics";
import Goals from "./components/Goals";
import Recommendations from "./components/Recommendations";

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to login if not authenticated */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <ActivityHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/platforms"
          element={
            <ProtectedRoute>
              <PlatformManager />
            </ProtectedRoute>
          }
        />

        <Route
          path="/platforms"
          element={
            <ProtectedRoute>
              <PlatformManager />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <Goals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recommendations"
          element={
            <ProtectedRoute>
              <Recommendations />
            </ProtectedRoute>
          }
        />

        {/* Catch-all for undefined routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
