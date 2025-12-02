import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  getProfileMe,
  upsertProfile,
} from '../api';
import type {
  FitnessProfile,
  ProfileMeResponse,
  UpsertProfileRequest,
} from '../api';

type Gender = 'male' | 'female';
type Activity = 'light' | 'moderate' | 'high';
type Goal = 'LOSE_FAT' | 'GAIN_MUSCLE' | 'MAINTAIN';

const allDays = [
  { key: 'Mon', label: 'Monday' },
  { key: 'Tue', label: 'Tuesday' },
  { key: 'Wed', label: 'Wednesday' },
  { key: 'Thu', label: 'Thursday' },
  { key: 'Fri', label: 'Friday' },
  { key: 'Sat', label: 'Saturday' },
  { key: 'Sun', label: 'Sunday' },
];

export const ProfilePage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<FitnessProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState<number>(22);
  const [heightCm, setHeightCm] = useState<number>(180);
  const [weightKg, setWeightKg] = useState<number>(75);
  const [activity, setActivity] = useState<Activity>('moderate');
  const [goal, setGoal] = useState<Goal>('LOSE_FAT');
  const [days, setDays] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;

    let mounted = true;

    (async () => {
      try {
        const res: ProfileMeResponse = await getProfileMe(token);
        if (!mounted) return;

        setProfile(res.profile);

        if (res.profile) {
          setGender(res.profile.gender as Gender);
          setAge(res.profile.age);
          setHeightCm(res.profile.heightCm);
          setWeightKg(res.profile.weightKg);
          setActivity(res.profile.activityLevel as Activity);
          setGoal(res.profile.goalType as Goal);
          setDays(
            res.profile.trainingDays
              ? res.profile.trainingDays.split(',').filter(Boolean)
              : []
          );
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load profile');
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
    navigate('/login');
    return null;
  }

  const toggleDay = (key: string) => {
    setDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload: UpsertProfileRequest = {
        gender,
        age,
        heightCm,
        weightKg,
        activityLevel: activity,
        goalType: goal,
        trainingDays: days.join(','),
      };

      await upsertProfile(token, payload);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to save profile');
      } else {
        setError('Failed to save profile');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="text-sm text-slate-300 hover:text-white"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-lg font-semibold">Edit Profile</h1>
        <div className="w-24" />
      </header>

      <main className="px-6 py-8 max-w-2xl mx-auto">
        {loading && <p className="text-slate-300">Loading…</p>}

        {!loading && (
          <>
            {!profile && (
              <p className="text-sm text-slate-400 mb-4 text-center">
                No profile yet. Fill in the form below.
              </p>
            )}

            {error && (
              <p className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm mb-1 text-slate-200">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1 text-slate-200">Age</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 text-slate-200">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min={120}
                    max={250}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 text-slate-200">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={200}
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm mb-1 text-slate-200">
                    Activity Level
                  </label>
                  <select
                    value={activity}
                    onChange={(e) => setActivity(e.target.value as Activity)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                  >
                    <option value="light">Light (1–2x/week)</option>
                    <option value="moderate">Moderate (3–4x/week)</option>
                    <option value="high">High (5+ /week)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1 text-slate-200">Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as Goal)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                  >
                    <option value="LOSE_FAT">Lose fat</option>
                    <option value="GAIN_MUSCLE">Gain muscle</option>
                    <option value="MAINTAIN">Maintain</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 text-slate-200">Training Days</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {allDays.map((day) => (
                    <label
                      key={day.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition ${
                        days.includes(day.key)
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={days.includes(day.key)}
                        onChange={() => toggleDay(day.key)}
                        className="accent-emerald-500"
                      />
                      <span>{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 transition-colors"
                >
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
};
