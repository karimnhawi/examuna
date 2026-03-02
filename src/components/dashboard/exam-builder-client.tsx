"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, GripVertical, Trash2, RefreshCw, Check, Pencil, Save } from "lucide-react";

interface Question {
  id: string;
  text: string;
  marks: number;
  topic?: string;
  difficulty?: string;
  cognitive_level?: string;
  answer_key?: string;
  source?: "bank" | "ai" | "template";
}

export function ExamBuilderClient({ locale }: { locale: string }) {
  const t = useTranslations("builder");
  const [subject, setSubject] = useState("Biology");
  const [difficulty, setDifficulty] = useState("Mixed");
  const [count, setCount] = useState(6);
  const [examTitle, setExamTitle] = useState("");
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, difficulty, count }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const data = await res.json();
      setQuestions(data.questions || []);

      if (!examTitle) {
        setExamTitle(`${subject} Exam`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate exam");
    } finally {
      setGenerating(false);
    }
  };

  const remove = (id: string) => {
    setQuestions((q) => q.filter((x) => x.id !== id));
    toast.success("Question removed");
  };

  const swap = async (id: string) => {
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, difficulty, count: 1 }),
      });
      const data = await res.json();
      const newQ = data.questions?.[0];
      if (newQ) {
        setQuestions((qs) => qs.map((q) => (q.id === id ? { ...newQ, id: crypto.randomUUID() } : q)));
        toast.success("Question swapped");
      }
    } catch {
      toast.error("Failed to swap question");
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditText(q.text);
  };

  const saveEdit = (id: string) => {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, text: editText } : q)));
    setEditingId(null);
    setEditText("");
    toast.success("Question updated");
  };

  const saveExam = async () => {
    if (!examTitle.trim()) {
      toast.error("Please enter an exam title");
      return;
    }
    if (questions.length === 0) {
      toast.error("Add at least one question");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: examTitle,
          subject,
          duration_minutes: duration,
          total_marks: totalMarks,
          questions: questions.map((q, i) => ({
            question_id: q.source === "bank" ? q.id : null,
            custom_question_text: q.text,
            position: i + 1,
            marks: q.marks,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      toast.success(t("saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save exam");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Config */}
      <Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">{t("examTitle")}</label>
            <Input value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="Midterm Biology" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">{t("subject")}</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Biology" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">{t("difficulty")}</label>
            <Input value={difficulty} onChange={(e) => setDifficulty(e.target.value)} placeholder="Mixed" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">{t("questionCount")}</label>
            <Input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} min={1} max={20} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">{t("duration")}</label>
            <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={10} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={generate} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {generating ? t("generating") : t("generate")}
          </Button>
          {questions.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {questions.length} questions &middot; {totalMarks} {t("totalMarks")}
            </span>
          )}
        </div>
      </Card>

      {/* Questions */}
      {questions.length === 0 && !generating && (
        <Card className="py-12 text-center">
          <p className="text-muted-foreground">{t("noQuestions")}</p>
        </Card>
      )}

      <div className="space-y-3">
        {questions.map((q, i) => (
          <Card key={q.id} className="group transition-all hover:shadow-md">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 text-muted-foreground">
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Q{i + 1}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {q.marks} {t("marks")}
                  </span>
                  {q.topic && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{q.topic}</span>
                  )}
                  {q.difficulty && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      q.difficulty === "Hard" ? "bg-destructive/10 text-destructive"
                      : q.difficulty === "Medium" ? "bg-warning/10 text-warning"
                      : "bg-success/10 text-success"
                    }`}>{q.difficulty}</span>
                  )}
                  {q.cognitive_level && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{q.cognitive_level}</span>
                  )}
                </div>

                {editingId === q.id ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full rounded-md border border-border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={3}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(q.id)} className="gap-1">
                        <Check className="h-3 w-3" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{q.text}</p>
                )}
              </div>

              <div className="flex flex-shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="sm" onClick={() => startEdit(q)} title={t("edit")}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => swap(q.id)} title={t("swap")}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(q.id)} title={t("remove")} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Save */}
      {questions.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={saveExam} disabled={saving} size="lg" className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      )}
    </div>
  );
}
