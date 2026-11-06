"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

type Habit = {
  id: string;
  date: string;
  water_ml: number | null;
  sleep_hours: number | null;
  mood: number | null;
};

function toDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function average(values: (number | null)[]) {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export default function HabitsCard() {
  const supabase = useMemo(() => createClient(), []);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [water, setWater] = useState("");
  const [sleep, setSleep] = useState("");
  const [mood, setMood] = useState("3");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    const { data, error } = await supabase
      .from("habit_logs")
      .select("id, date, water_ml, sleep_hours, mood")
      .gte("date", toDateString(since))
      .order("date", { ascending: false })
      .order("id", { ascending: false });
    if (error) setError(error.message);
    else setHabits((data ?? []) as Habit[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!water && !sleep) {
      setError("Enter water or sleep (or both).");
      return;
    }
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

    const { error } = await supabase.from("habit_logs").insert({
      user_id: user.id,
      date: toDateString(new Date()),
      water_ml: water ? Number(water) : null,
      sleep_hours: sleep ? Number(sleep) : null,
      mood: Number(mood),
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setWater("");
    setSleep("");
    setMood("3");
    await load();
  }

  async function remove(id: string) {
    setError("");
    const { error } = await supabase.from("habit_logs").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  const avgSleep = average(habits.map((h) => h.sleep_hours));
  const avgWater = average(habits.map((h) => h.water_ml));
  const avgMood = average(habits.map((h) => h.mood));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily habits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Avg sleep (7d)</div>
            <div className="text-xl font-semibold">{avgSleep === null ? "-" : `${avgSleep.toFixed(1)} h`}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Avg water (7d)</div>
            <div className="text-xl font-semibold">{avgWater === null ? "-" : `${(avgWater / 1000).toFixed(1)} L`}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Avg mood (7d)</div>
            <div className="text-xl font-semibold">{avgMood === null ? "-" : `${avgMood.toFixed(1)} / 5`}</div>
          </div>
        </div>

        <form onSubmit={save} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Input placeholder="Water (ml)" type="number" min="0" value={water} onChange={(e) => setWater(e.target.value)} />
          <Input placeholder="Sleep (hours)" type="number" min="0" max="24" step="0.5" value={sleep} onChange={(e) => setSleep(e.target.value)} />
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="h-9 rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="1">Mood 1 (low)</option>
            <option value="2">Mood 2</option>
            <option value="3">Mood 3</option>
            <option value="4">Mood 4</option>
            <option value="5">Mood 5 (great)</option>
          </select>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save today"}
          </Button>
        </form>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : habits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No habits logged in the last 7 days.</p>
        ) : (
          <ul className="space-y-1">
            {habits.map((h) => (
              <li key={h.id} className="flex items-center justify-between text-sm">
                <span>
                  <span className="text-muted-foreground">{h.date}</span> water {h.water_ml ?? "-"} ml, sleep {h.sleep_hours ?? "-"} h, mood {h.mood ?? "-"}
                </span>
                <Button variant="ghost" size="sm" onClick={() => remove(h.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}