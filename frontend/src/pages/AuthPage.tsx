import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  loginRequest,
  registerRequest,
} from "../features/auth/api/auth.client";
import { useAuth } from "../app/providers/AuthProvider";
import { useProfile } from "../app/providers/ProfileProvider";
import { Sparkles } from "lucide-react";

export const AuthPage = () => {
  const { token, login } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    if (profileLoading) return;

    const target = profile ? "/dashboard" : "/profile/setup";
    navigate(target, { replace: true });
  }, [token, profileLoading, profile, navigate]);

  const title = mode === "login" ? "Sign in" : "Create account";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter your e-mail and password.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const fn = mode === "login" ? loginRequest : registerRequest;
      const res = await fn(email.trim(), password);

      login(res.token, res.user);

      navigate(mode === "register" ? "/profile/setup" : "/dashboard", {
        replace: true,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Something went wrong");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  if (token && profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-slate-200">
        <div className="card max-w-md text-center">
          <p className="text-sm font-semibold">Loading…</p>
          <p className="mt-1 text-xs text-slate-400">Signing you in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center text-slate-50">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-[-10%] h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute right-[-30px] top-1/2 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute bottom-[-20%] left-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="mx-4 flex w-full max-w-5xl flex-col gap-10 lg:flex-row lg:items-center">
        <div className="max-w-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-violet-300">
            AI FITNESS COACH
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            Smarter tracking.
            <br />
            Better results.
          </h1>
          <p className="mt-4 text-sm text-slate-300">
            Create an account to unlock automated calorie calculations,
            personalized workouts and AI-generated meal plans tailored to your
            goals.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-slate-400">
            <span className="pill-accent pill">Tracks workouts & nutrition</span>
            <span className="pill">AI weekly coach</span>
            <span className="pill">Custom workout & meal plans</span>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="mb-4 flex items-center justify-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-slate-50 shadow-lg shadow-violet-500/40">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  {mode === "login" ? "Welcome back" : "Get started"}
                </p>
                <h2 className="text-lg font-semibold text-slate-50">
                  {mode === "login"
                    ? "Sign in to your account"
                    : "Create your free account"}
                </h2>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400">
              {mode === "login"
                ? "Use your registered e-mail and password to continue."
                : "We only need an e-mail and password to get you started."}
            </p>

            <div className="mt-5 flex gap-2 rounded-xl bg-slate-900/80 p-1">
              <button
                type="button"
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                  mode === "login"
                    ? "bg-slate-50 text-slate-900 shadow-sm"
                    : "text-slate-300 hover:text-slate-50"
                }`}
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                  mode === "register"
                    ? "bg-slate-50 text-slate-900 shadow-sm"
                    : "text-slate-300 hover:text-slate-50"
                }`}
                onClick={() => setMode("register")}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-sm">
              <div className="space-y-1">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>

              {error && (
                <p className="rounded-xl border border-red-800 bg-red-950/60 px-3 py-2 text-xs text-red-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-1 w-full justify-center"
              >
                {loading ? "Please wait…" : title}
              </button>

              <p className="mt-2 text-center text-[11px] text-slate-500">
                By continuing you agree that this app uses your workout and
                nutrition logs to generate AI suggestions.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
