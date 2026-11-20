"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

type Exercise = {
  name: string;
  sets?: number | string;
  reps?: number | string;
  notes?: string;
};

type Plan = {
  summary: string;
  days: { day: string; focus: string; exercises: Exercise[] }[];
};

export default function PlanCard() {
  const supabase = useMemo(() => createClient(), []);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLatest() {
      const { data } = await supabase
        .from("plans")
        .select("plan_json, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setPlan(data.plan_json as Plan);
        setCreatedAt(String(data.created_at).slice(0, 10));
      }
      setLoading(false);
    }
    loadLatest();
  }, [supabase]);

  async function generate() {
    setError("");
    setGenerating(true);
    try {
      const res = await fetch("/api/plan", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
      } else {
        setPlan(json.plan as Plan);
        setCreatedAt("just now");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setGenerating(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI weekly plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button onClick={generate} disabled={generating}>
            {generating ? "Generating..." : plan ? "Generate a new plan" : "Generate my plan"}
          </Button>
          {createdAt && <span className="text-xs text-muted-foreground">Last plan: {createdAt}</span>}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : plan ? (
          <div className="space-y-3">
            <p className="text-sm">{plan.summary}</p>
            {plan.days.map((d) => (
              <div key={d.day} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{d.day}</span>
                  <span className="text-sm text-muted-foreground">{d.focus}</span>
                </div>
                {d.exercises.length === 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">Rest day</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm">
                    {d.exercises.map((ex, i) => (
                      <li key={i}>
                        {ex.name}
                        {ex.sets !== undefined && ex.reps !== undefined && (
                          <span className="text-muted-foreground">
                            {" "}
                            - {ex.sets} x {ex.reps}
                          </span>
                        )}
                        {ex.notes && <span className="block text-xs text-muted-foreground">{ex.notes}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No plan yet. Save your profile first, then click Generate.
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          General fitness guidance, not medical advice. Stop and see a doctor if you feel pain or have a health condition.
        </p>
      </CardContent>
    </Card>
  );
}