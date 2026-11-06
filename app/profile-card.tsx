"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const selectClass = "h-9 w-full rounded-md border bg-transparent px-3 text-sm";

export default function ProfileCard() {
  const supabase = useMemo(() => createClient(), []);
  const [goal, setGoal] = useState("strength");
  const [level, setLevel] = useState("beginner");
  const [days, setDays] = useState("3");
  const [equipment, setEquipment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("profiles")
        .select("goal, level, days_per_week, equipment")
        .maybeSingle();
      if (error) {
        setError(error.message);
      } else if (data) {
        setGoal(data.goal ?? "strength");
        setLevel(data.level ?? "beginner");
        setDays(String(data.days_per_week ?? 3));
        setEquipment(data.equipment ?? "");
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You are not logged in.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        goal,
        level,
        days_per_week: Number(days),
        equipment: equipment.trim() || null,
      },
      { onConflict: "user_id" }
    );

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage("Profile saved.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Goal</span>
              <select value={goal} onChange={(e) => setGoal(e.target.value)} className={selectClass}>
                <option value="strength">Build strength</option>
                <option value="fat_loss">Fat loss</option>
                <option value="stamina">Improve stamina</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Experience level</span>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className={selectClass}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Days per week</span>
              <select value={days} onChange={(e) => setDays(e.target.value)} className={selectClass}>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Equipment</span>
              <Input
                placeholder="e.g. dumbbells, resistance bands, none"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
              />
            </label>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save profile"}
              </Button>
              {message && <span className="ml-3 text-sm text-green-600">{message}</span>}
              {error && <span className="ml-3 text-sm text-red-500">{error}</span>}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}