import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { WorkoutTemplatesPage } from "./pages/WorkoutTemplatesPage";
import { WorkoutLogsPage } from "./pages/WorkoutLogsPage";
import { useAuth } from "./auth/AuthContext";
import { WorkoutSessionPage } from "./pages/WorkoutSessionPage";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/workouts/session/:templateId"
        element={
          <ProtectedRoute>
            <WorkoutSessionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/workouts/templates"
        element={
          <ProtectedRoute>
            <WorkoutTemplatesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/workouts/logs"
        element={
          <ProtectedRoute>
            <WorkoutLogsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
