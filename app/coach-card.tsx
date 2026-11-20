"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CoachCard() {
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function getReport() {
    setError("");
    setReport("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach", { method: "POST" });

      if (!res.ok) {
        const text = await res.text();
        let message = `Server error ${res.status}. Check the terminal running npm run dev.`;
        try {
          message = JSON.parse(text).error ?? message;
        } catch {
          // not JSON, keep the default message
        }
        setError(message);
        setLoading(false);
        return;
      }

      if (!res.body) {
        setError("Your browser did not return a stream. Please try again.");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setReport((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch {
      setError("Could not reach the server. Is npm run dev running?");
    }

    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly coach report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={getReport} disabled={loading}>
          {loading ? "Coach is writing..." : "Get my coach report"}
        </Button>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {report ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{report}</p>
        ) : (
          !loading &&
          !error && (
            <p className="text-sm text-muted-foreground">
              Based on your workouts and habits from the last 14 days.
            </p>
          )
        )}

        <p className="text-xs text-muted-foreground">
          General fitness guidance, not medical advice. See a doctor for pain or health conditions.
        </p>
      </CardContent>
    </Card>
  );
}