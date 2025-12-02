import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  createWorkoutLog,
  getWorkoutTemplates,
} from '../api';
import type {
  GetWorkoutTemplatesResponse,
  WorkoutTemplate,
  WorkoutExerciseTemplate,
  WorkoutSetInput,
} from '../api';

type ExerciseSetInput = {
  weight: string;
  reps: string;
  rir: string;
};

type ExerciseWithSets = {
  exercise: WorkoutExerciseTemplate;
  sets: ExerciseSetInput[];
};

export const WorkoutSessionPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();

  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [exerciseSets, setExerciseSets] = useState<ExerciseWithSets[]>([]);
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericTemplateId = useMemo(
    () => (templateId ? Number(templateId) : NaN),
    [templateId]
  );

  useEffect(() => {
    if (!token || isNaN(numericTemplateId)) return;

    let mounted = true;

    (async () => {
      try {
        const res: GetWorkoutTemplatesResponse = await getWorkoutTemplates(token);
        if (!mounted) return;

        const found = res.templates.find(
          (tpl) => tpl.id === numericTemplateId
        );
        if (!found) {
          setError('Template not found');
          setLoading(false);
          return;
        }

        setTemplate(found);
        setExerciseSets(
          found.exercises.map((ex) => ({
            exercise: ex,
            sets: Array.from({ length: ex.sets }).map(() => ({
              weight: '',
              reps: '',
              rir: ex.rir.toString(),
            })),
          }))
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to load template');
        } else {
          setError('Failed to load template');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, numericTemplateId]);

  if (!token) {
    navigate('/login');
    return null;
  }

  const handleSetChange = (
    exerciseId: number,
    setIndex: number,
    field: keyof ExerciseSetInput,
    value: string
  ) => {
    setExerciseSets((prev) =>
      prev.map((item) =>
        item.exercise.id === exerciseId
          ? {
              ...item,
              sets: item.sets.map((set, index) =>
                index === setIndex ? { ...set, [field]: value } : set
              ),
            }
          : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template || !token) return;

    setError(null);
    setSaving(true);

    try {
      const sets: WorkoutSetInput[] = [];

      exerciseSets.forEach((item) => {
        item.sets.forEach((set, idx) => {
          if (!set.weight && !set.reps) return;
          if (!set.weight || !set.reps) return;

          const weightNum = Number(set.weight);
          const repsNum = Number(set.reps);
          if (isNaN(weightNum) || isNaN(repsNum)) return;

          const rirNum = set.rir ? Number(set.rir) : undefined;

          sets.push({
            exerciseTemplateId: item.exercise.id,
            setIndex: idx + 1,
            weightKg: weightNum,
            reps: repsNum,
            ...(rirNum !== undefined && !isNaN(rirNum) ? { rir: rirNum } : {}),
          });
        });
      });

      await createWorkoutLog(token, {
        date,
        workoutTemplateId: template.id,
        notes: notes.trim() || null,
        sets,
      });

      navigate('/workouts/logs');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to save workout');
      } else {
        setError('Failed to save workout');
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
          onClick={() => navigate('/workouts/templates')}
          className="text-sm text-slate-300 hover:text-white"
        >
          ← Back to Templates
        </button>
        <h1 className="text-lg font-semibold">
          {template ? `Workout: ${template.name}` : 'Workout Session'}
        </h1>
        <div className="w-24" />
      </header>

      <main className="px-6 py-8 max-w-4xl mx-auto">
        {loading && <p className="text-slate-300">Loading template…</p>}

        {!loading && error && (
          <p className="text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {!loading && !error && template && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm mb-1 text-slate-200">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1 text-slate-200">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How did this session feel?"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-400">
                You can leave a set empty if you skipped it. Only filled sets
                will be saved.
              </p>

              <div className="space-y-6">
                {exerciseSets.map((item) => (
                  <div
                    key={item.exercise.id}
                    className="border border-slate-800 rounded-xl p-4 bg-slate-900/60"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
                      <div>
                        <p className="font-semibold text-sm">
                          {item.exercise.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {item.exercise.muscleGroup} · {item.exercise.sets} sets ·
                          target {item.exercise.reps} reps @ RIR{' '}
                          {item.exercise.rir}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {item.sets.map((set, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-3 gap-2 text-xs items-center"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 min-w-[3rem]">
                              Set {idx + 1}
                            </span>
                          </div>
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) =>
                              handleSetChange(
                                item.exercise.id,
                                idx,
                                'weight',
                                e.target.value
                              )
                            }
                            placeholder="Weight (kg)"
                            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5"
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={set.reps}
                              onChange={(e) =>
                                handleSetChange(
                                  item.exercise.id,
                                  idx,
                                  'reps',
                                  e.target.value
                                )
                              }
                              placeholder="Reps"
                              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5"
                            />
                            <input
                              type="number"
                              value={set.rir}
                              onChange={(e) =>
                                handleSetChange(
                                  item.exercise.id,
                                  idx,
                                  'rir',
                                  e.target.value
                                )
                              }
                              placeholder="RIR"
                              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5"
                              title="Reps In Reserve – how many reps you could still do at the end of the set"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 transition-colors"
                >
                  {saving ? 'Saving…' : 'Save workout'}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};
