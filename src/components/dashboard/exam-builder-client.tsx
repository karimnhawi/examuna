"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Q { id: string; text: string; marks: number; }

export function ExamBuilderClient() {
  const [subject, setSubject] = useState("Biology");
  const [difficulty, setDifficulty] = useState("Mixed");
  const [questions, setQuestions] = useState<Q[]>([]);

  const generate = async () => {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, difficulty, count: 6 })
    });
    const data = await res.json();
    setQuestions(data.questions || []);
  };

  const remove = (id: string) => setQuestions((q) => q.filter((x) => x.id !== id));

  return (
    <div className="space-y-6">
      <Card className="grid gap-4 md:grid-cols-3">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
        <Input value={difficulty} onChange={(e) => setDifficulty(e.target.value)} placeholder="Difficulty" />
        <Button onClick={generate}>Generate exam draft</Button>
      </Card>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <Card key={q.id} className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Question {i + 1} · {q.marks} marks</p>
              <p>{q.text}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Keep</Button>
              <Button variant="outline">Swap</Button>
              <Button variant="outline">Edit</Button>
              <Button variant="ghost" onClick={() => remove(q.id)}>Remove</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
