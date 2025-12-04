import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProfileMe } from "../api";
import type { Macros, ProfileMeResponse } from "../api";
import { useAuth } from "../auth/AuthContext";

export const DashboardPage = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [macros, setMacros] = useState<Macros | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let mounted = true;
    (async () => {
      try {
        const res: ProfileMeResponse = await getProfileMe(token);
        if (!mounted) return;
        setMacros(res.macros);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Failed to load profile");
        } else {
          setError("Failed to load profile");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  if (!token) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">AI Fitness Dashboard</h1>
          <p className="text-sm text-slate-400">
            {user ? `Logged in as ${user.email}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              to="/profile"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Edit Profile
            </Link>
            <Link
              to="/workouts/templates"
              className="text-slate-300 hover:text-white"
            >
              Workout Templates
            </Link>
            <Link
              to="/workouts/logs"
              className="text-slate-300 hover:text-white"
            >
              Workout Logs
            </Link>
            <Link to="/nutrition" className="text-slate-300 hover:text-white">
              Nutrition
            </Link>
            <Link to="/ai-coach" className="text-slate-300 hover:text-white">
              AI Coach
            </Link>
            <Link
              to="/ai/workout-plan"
              className="text-slate-300 hover:text-white"
            >
              AI Workout Plan
            </Link>
            <Link
              to="/ai/meal-plan"
              className="text-slate-300 hover:text-white"
            >
              AI Meal Plan
            </Link>
            <Link to="/progress" className="text-slate-300 hover:text-white">
              Progress
            </Link>
          </nav>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="px-3 py-1.5 rounded-lg text-sm bg-slate-800 hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="px-6 py-8 max-w-4xl mx-auto">
        {loading && <p className="text-slate-300">Loading your data…</p>}
        {error && (
          <p className="text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            {!macros ? (
              <p className="text-slate-300">
                You don&apos;t have a fitness profile yet. Go to{" "}
                <Link
                  to="/profile"
                  className="text-emerald-400 hover:text-emerald-300 underline"
                >
                  Edit Profile
                </Link>{" "}
                and fill in your data to get your daily targets.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h2 className="text-sm font-medium text-slate-300 mb-2">
                    Daily Target
                  </h2>
                  <p className="text-4xl font-bold text-slate-100">
                    {macros.targetCalories}{" "}
                    <span className="text-lg font-medium">kcal</span>
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    TDEE: {macros.tdee} kcal
                  </p>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h2 className="text-sm font-medium text-slate-300 mb-4">
                    Macros
                  </h2>
                  <p className="text-slate-300">
                    Protein:{" "}
                    <span className="font-semibold text-slate-100">
                      {macros.proteinGrams}
                    </span>{" "}
                    g
                  </p>
                  <p className="text-slate-300 mt-1">
                    Fat:{" "}
                    <span className="font-semibold text-slate-100">
                      {macros.fatGrams}
                    </span>{" "}
                    g
                  </p>
                  <p className="text-slate-300 mt-1">
                    Carbs:{" "}
                    <span className="font-semibold text-slate-100">
                      {macros.carbGrams}
                    </span>{" "}
                    g
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
