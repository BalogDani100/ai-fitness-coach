import React from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProfileSetupPage } from "./pages/ProfileSetupPage";
import { WorkoutTemplatesPage } from "./pages/WorkoutTemplatesPage";
import { WorkoutLogsPage } from "./pages/WorkoutLogsPage";
import { NutritionPage } from "./pages/NutritionPage";
import { WorkoutSessionPage } from "./pages/WorkoutSessionPage";
import { useAuth } from "./app/providers/AuthProvider";
import { useProfile } from "./app/providers/ProfileProvider";
import { AiCoachPage } from "./pages/AiCoachPage";
import { AiWorkoutPlanPage } from "./pages/AiWorkoutPlanPage";
import { AiMealPlanPage } from "./pages/AiMealPlanPage";
import { ProgressPage } from "./pages/ProgressPage";

const FullPageLoader: React.FC<{ label?: string }> = ({ label }) => {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-slate-200">
      <div className="card max-w-md text-center">
        <p className="text-sm font-semibold">Loading…</p>
        <p className="mt-1 text-xs text-slate-400">
          {label ?? "Please wait a moment."}
        </p>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requireProfile?: boolean;
}> = ({ children, requireProfile = false }) => {
  const { token } = useAuth();
  const { profile, loading } = useProfile();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireProfile) {
    if (loading) {
      return <FullPageLoader label="Checking your profile…" />;
    }

    if (!profile) {
      return <Navigate to="/profile/setup" replace />;
    }
  }

  return children;
};

function App() {
  const { token } = useAuth();

  return (
    <Routes>
      {/* AuthPage itself handles redirect if already signed in */}
      <Route path="/login" element={<AuthPage />} />

      {/* Profile setup (onboarding) */}
      <Route
        path="/profile/setup"
        element={
          <ProtectedRoute>
            <ProfileSetupPage />
          </ProtectedRoute>
        }
      />

      {/* Regular profile settings */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Everything below requires a completed profile */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireProfile>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/workouts/templates"
        element={
          <ProtectedRoute requireProfile>
            <WorkoutTemplatesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/workouts/session/:templateId"
        element={
          <ProtectedRoute requireProfile>
            <WorkoutSessionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/workouts/logs"
        element={
          <ProtectedRoute requireProfile>
            <WorkoutLogsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/nutrition"
        element={
          <ProtectedRoute requireProfile>
            <NutritionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai-coach"
        element={
          <ProtectedRoute requireProfile>
            <AiCoachPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai/workout-plan"
        element={
          <ProtectedRoute requireProfile>
            <AiWorkoutPlanPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai/meal-plan"
        element={
          <ProtectedRoute requireProfile>
            <AiMealPlanPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/progress"
        element={
          <ProtectedRoute requireProfile>
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
