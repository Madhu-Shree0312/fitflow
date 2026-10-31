"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Workout = { exercise: string; sets: number; reps: number; weight: number };

const weeklyVolume = [
  { day: "Mon", volume: 3200 },
  { day: "Tue", volume: 0 },
  { day: "Wed", volume: 4100 },
  { day: "Thu", volume: 2800 },
  { day: "Fri", volume: 0 },
  { day: "Sat", volume: 5000 },
  { day: "Sun", volume: 0 },
];

export default function Home() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercise, setExercise] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  function addWorkout(e: React.FormEvent) {
    e.preventDefault();
    if (!exercise.trim()) return;
    setWorkouts([
      { exercise, sets: Number(sets), reps: Number(reps), weight: Number(weight) },
      ...workouts,
    ]);
    setExercise("");
    setSets("");
    setReps("");
    setWeight("");
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-3xl font-bold">FitFlow</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          ["Workouts this week", "4"],
          ["Avg sleep", "7.1 h"],
          ["Avg water", "2.4 L"],
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
          <CardTitle>Weekly volume</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyVolume}>
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
            <Input placeholder="Exercise" value={exercise} onChange={(e) => setExercise(e.target.value)} className="col-span-2" />
            <Input placeholder="Sets" type="number" value={sets} onChange={(e) => setSets(e.target.value)} />
            <Input placeholder="Reps" type="number" value={reps} onChange={(e) => setReps(e.target.value)} />
            <Input placeholder="kg" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <Button type="submit" className="col-span-2 sm:col-span-5">Add</Button>
          </form>

          <ul className="space-y-1">
            {workouts.map((w, i) => (
              <li key={i} className="text-sm">
                {w.exercise}: {w.sets} x {w.reps} @ {w.weight} kg
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}