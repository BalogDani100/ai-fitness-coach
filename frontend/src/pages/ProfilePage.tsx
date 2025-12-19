import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/providers/AuthProvider";
import {
  getProfileMe,
  upsertProfile,
} from "../features/profile/api/profile.client";
import type {
  FitnessProfile,
  Macros,
  ProfileMeResponse,
  UpsertProfileRequest,
  UpsertProfileResponse,
} from "../features/profile/api/profile.dto";
import { AppLayout } from "../app/layout/AppLayout";

type Gender = "male" | "female";
type Activity = "light" | "moderate" | "high";
type Goal = "LOSE_FAT" | "GAIN_MUSCLE" | "MAINTAIN";

const allDays = [
  { key: "Mon", label: "Monday" },
  { key: "Tue", label: "Tuesday" },
  { key: "Wed", label: "Wednesday" },
  { key: "Thu", label: "Thursday" },
  { key: "Fri", label: "Friday" },
  { key: "Sat", label: "Saturday" },
  { key: "Sun", label: "Sunday" },
];

export const ProfilePage = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [, setProfile] = useState<FitnessProfile | null>(null);
  const [macros, setMacros] = useState<Macros | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState<number>(22);
  const [heightCm, setHeightCm] = useState<number>(180);
  const [weightKg, setWeightKg] = useState<number>(75);
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<Goal>("LOSE_FAT");
  const [days, setDays] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;

    let mounted = true;

    (async () => {
      try {
        setError(null);
        setLoading(true);

        const res: ProfileMeResponse = await getProfileMe(token);
        if (!mounted) return;

        setProfile(res.profile ?? null);
        setMacros(res.macros ?? null);

        if (res.profile) {
          setGender(res.profile.gender as Gender);
          setAge(res.profile.age);
          setHeightCm(res.profile.heightCm);
          setWeightKg(res.profile.weightKg);
          setActivity(res.profile.activityLevel as Activity);
          setGoal(res.profile.goalType as Goal);
          setDays(
            res.profile.trainingDays
              ? res.profile.trainingDays.split(",").filter(Boolean)
              : []
          );
        }
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

  const toggleDay = (key: string) => {
    setDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const payload: UpsertProfileRequest = {
        gender,
        age,
        heightCm,
        weightKg,
        activityLevel: activity,
        goalType: goal,
        trainingDays: days.join(","),
      };

      const res: UpsertProfileResponse = await upsertProfile(token, payload);

      setProfile(res.profile);
      setMacros(res.macros);
      setSuccess("Profile saved successfully. Your macros have been updated.");
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

  const daysLabel =
    days.length === 0
      ? "No days selected"
      : days.length === 7
      ? "Training every day"
      : `${days.length} training day${days.length === 1 ? "" : "s"} / week`;

  return (
    <AppLayout>
      <div className="space-y-8">
        {success && (
          <div className="card border-emerald-500/60 bg-emerald-950/60 text-sm text-emerald-100">
            <p className="font-semibold">Profile updated</p>
            <p className="mt-1 text-xs text-emerald-200">{success}</p>
          </div>
        )}

        {error && (
          <div className="card border-red-500/60 bg-red-950/60 text-sm text-red-100">
            <p className="font-semibold">Hiba történt</p>
            <p className="mt-1 text-xs text-red-200">{error}</p>
          </div>
        )}

        <section className="card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Profile
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">
                Your profile & macros
              </h1>
              <p className="mt-2 text-xs text-slate-400">
                Update your basic stats, training schedule and goal. We use this
                to calculate your macros and to generate AI workouts and meal
                plans.
              </p>
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
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="card">
            <div className="page-section-header">
              <div>
                <h2 className="page-section-title">Current macros</h2>
                <p className="page-section-subtitle">
                  These are calculated from your stats and goal. They&apos;re
                  used on the dashboard and by the AI coach.
                </p>
              </div>
              {macros && success && (
                <span className="pill text-[10px] text-emerald-200">
                  Updated just now
                </span>
              )}
            </div>

            {loading ? (
              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div className="h-4 w-1/2 rounded bg-slate-800" />
                <div className="h-4 w-2/3 rounded bg-slate-800" />
                <div className="h-4 w-1/3 rounded bg-slate-800" />
              </div>
            ) : !macros ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-700/80 bg-slate-950/70 px-4 py-6 text-xs text-slate-400">
                You don&apos;t have macros yet. Fill in your profile on the
                right and save – we&apos;ll calculate your targets based on your
                data.
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-4 text-sm">
                <div className="card-muted">
                  <p className="text-xs font-semibold text-slate-400">
                    Target calories
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-50">
                    {macros.targetCalories} kcal
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    TDEE: {macros.tdee} kcal (estimated daily energy
                    expenditure).
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <MacroBadge label="Protein" value={macros.proteinGrams} />
                  <MacroBadge label="Carbs" value={macros.carbGrams} />
                  <MacroBadge label="Fat" value={macros.fatGrams} />
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="page-section-header">
              <div>
                <h2 className="page-section-title">Edit profile & goal</h2>
                <p className="page-section-subtitle">
                  Change your stats or goal and we&apos;ll recalculate your
                  macros. All AI features will use the updated values.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div className="h-4 w-1/2 rounded bg-slate-800" />
                <div className="h-4 w-2/3 rounded bg-slate-800" />
                <div className="h-4 w-1/3 rounded bg-slate-800" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
                {/* Gender + age */}
                <div className="grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">
                      Gender
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setGender("male")}
                        className={`flex-1 rounded-xl px-3 py-2 text-xs font-medium transition ${
                          gender === "male"
                            ? "bg-slate-50 text-slate-900"
                            : "bg-slate-950/70 text-slate-300 hover:bg-slate-900"
                        }`}
                      >
                        Male
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender("female")}
                        className={`flex-1 rounded-xl px-3 py-2 text-xs font-medium transition ${
                          gender === "female"
                            ? "bg-slate-50 text-slate-900"
                            : "bg-slate-950/70 text-slate-300 hover:bg-slate-900"
                        }`}
                      >
                        Female
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="age"
                      className="text-xs font-semibold text-slate-400"
                    >
                      Age
                    </label>
                    <input
                      id="age"
                      type="number"
                      min={14}
                      max={100}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label
                      htmlFor="height"
                      className="text-xs font-semibold text-slate-400"
                    >
                      Height (cm)
                    </label>
                    <input
                      id="height"
                      type="number"
                      min={120}
                      max={250}
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="weight"
                      className="text-xs font-semibold text-slate-400"
                    >
                      Weight (kg)
                    </label>
                    <input
                      id="weight"
                      type="number"
                      min={35}
                      max={250}
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">
                    Activity level
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <ChoicePill
                      label="Light"
                      description="1–2 sessions / week"
                      active={activity === "light"}
                      onClick={() => setActivity("light")}
                    />
                    <ChoicePill
                      label="Moderate"
                      description="3–4 sessions / week"
                      active={activity === "moderate"}
                      onClick={() => setActivity("moderate")}
                    />
                    <ChoicePill
                      label="High"
                      description="5+ sessions / week"
                      active={activity === "high"}
                      onClick={() => setActivity("high")}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">
                    Main goal
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <ChoicePill
                      label="Lose fat"
                      description="Cut / recomposition"
                      active={goal === "LOSE_FAT"}
                      onClick={() => setGoal("LOSE_FAT")}
                    />
                    <ChoicePill
                      label="Gain muscle"
                      description="Lean bulk"
                      active={goal === "GAIN_MUSCLE"}
                      onClick={() => setGoal("GAIN_MUSCLE")}
                    />
                    <ChoicePill
                      label="Maintain"
                      description="Stay around current weight"
                      active={goal === "MAINTAIN"}
                      onClick={() => setGoal("MAINTAIN")}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">
                    Training days
                  </label>
                  <p className="text-[11px] text-slate-500">{daysLabel}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {allDays.map((d) => {
                      const active = days.includes(d.key);
                      return (
                        <button
                          type="button"
                          key={d.key}
                          onClick={() => toggleDay(d.key)}
                          className={`rounded-xl px-3 py-1.5 text-[11px] font-medium transition ${
                            active
                              ? "bg-violet-500/90 text-slate-50 shadow-sm shadow-violet-500/40"
                              : "bg-slate-950/70 text-slate-300 hover:bg-slate-900"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 text-[11px]">
                  <p className="text-slate-500">
                    When you save, we recalculate your macros from these values.
                  </p>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save profile"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

type MacroBadgeProps = {
  label: string;
  value: number;
};

const MacroBadge = ({ label, value }: MacroBadgeProps) => {
  return (
    <div className="card-muted flex flex-col gap-1">
      <p className="text-[11px] font-semibold text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-slate-50">{value} g</p>
    </div>
  );
};

type ChoicePillProps = {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
};

const ChoicePill = ({
  label,
  description,
  active,
  onClick,
}: ChoicePillProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start rounded-xl px-3 py-2 text-left text-[11px] transition ${
        active
          ? "bg-slate-50 text-slate-900 shadow-sm"
          : "bg-slate-950/70 text-slate-300 hover:bg-slate-900"
      }`}
    >
      <span className="font-semibold">{label}</span>
      <span className="mt-0.5 text-[10px] text-slate-500">{description}</span>
    </button>
  );
};
