import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/providers/AuthProvider";
import { useProfile } from "../app/providers/ProfileProvider";
import { upsertProfile } from "../features/profile/api/profile.client";
import type {
  UpsertProfileRequest,
  UpsertProfileResponse,
} from "../features/profile/api/profile.dto";
import { Sparkles } from "lucide-react";

type Gender = "male" | "female" | "";
type Activity = "light" | "moderate" | "high" | "";
type Goal = "LOSE_FAT" | "GAIN_MUSCLE" | "MAINTAIN" | "";

const allDays = [
  { key: "Mon", label: "Monday" },
  { key: "Tue", label: "Tuesday" },
  { key: "Wed", label: "Wednesday" },
  { key: "Thu", label: "Thursday" },
  { key: "Fri", label: "Friday" },
  { key: "Sat", label: "Saturday" },
  { key: "Sun", label: "Sunday" },
];

const isPositiveInt = (value: string) => {
  if (!value.trim()) return false;
  const n = Number(value);
  return Number.isFinite(n) && Number.isInteger(n) && n > 0;
};

const isPositiveNumber = (value: string) => {
  if (!value.trim()) return false;
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
};

export const ProfileSetupPage = () => {
  const { token, user, logout } = useAuth();
  const { profile, loading, refresh } = useProfile();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gender, setGender] = useState<Gender>("");
  const [age, setAge] = useState<string>("");
  const [heightCm, setHeightCm] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [activity, setActivity] = useState<Activity>("");
  const [goal, setGoal] = useState<Goal>("");
  const [days, setDays] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    if (!loading && profile) {
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [token, loading, profile, navigate]);

  const daysLabel = useMemo(() => {
    if (days.length === 0) return "No days selected";
    if (days.length === 7) return "Training every day";
    return `${days.length} training day${days.length === 1 ? "" : "s"} / week`;
  }, [days]);

  const toggleDay = (key: string) => {
    setDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const validate = () => {
    if (!gender) return "Please select your gender.";
    if (!isPositiveInt(age)) return "Please enter a valid age.";
    if (!isPositiveInt(heightCm)) return "Please enter a valid height (cm).";
    if (!isPositiveNumber(weightKg)) return "Please enter a valid weight (kg).";
    if (!activity) return "Please select your activity level.";
    if (!goal) return "Please select your goal.";
    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const payload: UpsertProfileRequest = {
        gender: gender as "male" | "female",
        age: Number(age),
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        activityLevel: activity as "light" | "moderate" | "high",
        goalType: goal as "LOSE_FAT" | "GAIN_MUSCLE" | "MAINTAIN",
        trainingDays: days.join(","),
      };

      const res: UpsertProfileResponse = await upsertProfile(token, payload);
      await refresh();

      if (res.profile) {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to save profile");
      } else {
        setError("Failed to save profile");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    navigate("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-slate-200">
        <div className="card max-w-md text-center">
          <p className="text-sm font-semibold">Loading…</p>
          <p className="mt-1 text-xs text-slate-400">
            Getting your account ready.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6 text-slate-50">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-[-10%] h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute right-[-30px] top-1/2 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute bottom-[-20%] left-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-3xl">
        <div className="card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-slate-50 shadow-lg shadow-violet-500/40">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  First time setup
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-50">
                  Tell us about you
                </h1>
                <p className="mt-2 text-xs text-slate-400">
                  We use this to calculate your macros and unlock the dashboard.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950/70 p-3 text-xs">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Account
              </p>
              <p className="mt-1 text-[11px] text-slate-300">
                {user?.email ?? "Unknown user"}
              </p>
              <button
                type="button"
                className="btn-secondary mt-2 w-full justify-center text-[11px]"
                onClick={logout}
              >
                Sign out
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-800 bg-red-950/60 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                >
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 25"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="height">Height (cm)</label>
                <input
                  id="height"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="e.g. 180"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="weight">Weight (kg)</label>
                <input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  step={0.1}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="e.g. 75"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="activity">Activity level</label>
                <select
                  id="activity"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value as Activity)}
                >
                  <option value="">Select…</option>
                  <option value="light">Light (1–2x / week)</option>
                  <option value="moderate">Moderate (3–5x / week)</option>
                  <option value="high">High (6–7x / week)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="goal">Goal</label>
                <select
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as Goal)}
                >
                  <option value="">Select…</option>
                  <option value="LOSE_FAT">Lose fat</option>
                  <option value="GAIN_MUSCLE">Gain muscle</option>
                  <option value="MAINTAIN">Maintain</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    Training days
                  </p>
                  <p className="text-xs text-slate-400">{daysLabel}</p>
                </div>
                <button
                  type="button"
                  className="btn-secondary text-[11px]"
                  onClick={() => setDays([])}
                >
                  Clear
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {allDays.map((d) => {
                  const active = days.includes(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      className={
                        active
                          ? "pill pill-accent"
                          : "pill text-slate-300 hover:text-slate-50"
                      }
                      onClick={() => toggleDay(d.key)}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className="btn-secondary justify-center"
                onClick={() => navigate("/profile")}
              >
                Open full profile settings
              </button>

              <button
                type="submit"
                className="btn-primary justify-center"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save & continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
