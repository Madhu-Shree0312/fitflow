"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { createClient } from "@/lib/supabase/client";
import LogoutButton from "./logout-button";

type Workout = {
  id: string;
  date: string;
  exercise: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function volume(w: Workout) {
  return (w.sets ?? 0) * (w.reps ?? 0) * (w.weight_kg ?? 0);
}

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercise, setExercise] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [today, setToday] = useState<Date | null>(null);

  async function loadWorkouts() {
    const { data, error } = await supabase
      .from("workout_logs")
      .select("id, date, exercise, sets, reps, weight_kg")
      .order("date", { ascending: false })
      .order("id", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setWorkouts((data ?? []) as Workout[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    setToday(new Date());
    loadWorkouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addWorkout(e: React.FormEvent) {
    e.preventDefault();
    if (!exercise.trim()) return;
    setError("");
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You are not logged in.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("workout_logs").insert({
      user_id: user.id,
      date: toDateString(new Date()),
      exercise: exercise.trim(),
      sets: sets ? Number(sets) : null,
      reps: reps ? Number(reps) : null,
      weight_kg: weight ? Number(weight) : null,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setExercise("");
    setSets("");
    setReps("");
    setWeight("");
    await loadWorkouts();
  }

  async function deleteWorkout(id: string) {
    setError("");
    const { error } = await supabase.from("workout_logs").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  }

  // Last 7 days (today and the 6 days before), computed from real data.
  // "today" is set in useEffect so the date is never evaluated during prerender.
  const chartData = useMemo(() => {
    const days: { day: string; date: string; volume: number }[] = [];
    if (!today) return days;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ day: DAY_LABELS[d.getDay()], date: toDateString(d), volume: 0 });
    }
    for (const w of workouts) {
      const slot = days.find((x) => x.date === w.date);
      if (slot) slot.volume += volume(w);
    }
    return days;
  }, [workouts, today]);

  const workoutsThisWeek = useMemo(() => {
    const dates = new Set(chartData.map((d) => d.date));
    const days = new Set(workouts.filter((w) => dates.has(w.date)).map((w) => w.date));
    return days.size;
  }, [workouts, chartData]);

  const totalVolume = chartData.reduce((sum, d) => sum + d.volume, 0);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">FitFlow</h1>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          ["Workout days (7d)", String(workoutsThisWeek)],
          ["Total volume (7d)", `${Math.round(totalVolume)} kg`],
          ["Exercises logged", String(workouts.length)],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Volume, last 7 days</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="volume" fill="currentColor" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log workout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addWorkout} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Input placeholder="Exercise" value={exercise} onChange={(e) => setExercise(e.target.value)} className="col-span-2" required />
            <Input placeholder="Sets" type="number" min="0" value={sets} onChange={(e) => setSets(e.target.value)} />
            <Input placeholder="Reps" type="number" min="0" value={reps} onChange={(e) => setReps(e.target.value)} />
            <Input placeholder="kg" type="number" min="0" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <Button type="submit" className="col-span-2 sm:col-span-5" disabled={saving}>
              {saving ? "Saving..." : "Add"}
            </Button>
          </form>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : workouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workouts yet. Add your first one above.</p>
          ) : (
            <ul className="space-y-1">
              {workouts.map((w) => (
                <li key={w.id} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="text-muted-foreground">{w.date}</span> {w.exercise}: {w.sets ?? 0} x {w.reps ?? 0} @ {w.weight_kg ?? 0} kg
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => deleteWorkout(w.id)}>
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}