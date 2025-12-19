import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { WorkoutTemplatesPage } from "./pages/WorkoutTemplatesPage";
import { WorkoutLogsPage } from "./pages/WorkoutLogsPage";
import { NutritionPage } from "./pages/NutritionPage";
import { WorkoutSessionPage } from "./pages/WorkoutSessionPage";
import { useAuth } from "./app/providers/AuthProvider";
import { AiCoachPage } from "./pages/AiCoachPage";
import { AiWorkoutPlanPage } from "./pages/AiWorkoutPlanPage";
import { AiMealPlanPage } from "./pages/AiMealPlanPage";
import { ProgressPage } from "./pages/ProgressPage";

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
        path="/workouts/session/:templateId"
        element={
          <ProtectedRoute>
            <WorkoutSessionPage />
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
        path="/nutrition"
        element={
          <ProtectedRoute>
            <NutritionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai-coach"
        element={
          <ProtectedRoute>
            <AiCoachPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai/workout-plan"
        element={
          <ProtectedRoute>
            <AiWorkoutPlanPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai/meal-plan"
        element={
          <ProtectedRoute>
            <AiMealPlanPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <ProgressPage />
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
