"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { WizardData, Question } from "./exam-wizard";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  RefreshCw,
  Pencil,
  Trash2,
  Plus,
  Check,
  Sparkles,
} from "lucide-react";

interface Props {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepGenerate({ data, updateData, onNext, onBack }: Props) {
  const t = useTranslations("wizard");
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const totalMarks = data.questions.reduce((sum, q) => sum + q.marks, 0);

  const generate = async () => {
    setGenerating(true);
    try {
      const payload = {
        title: data.title,
        curriculum: data.curriculum,
        grade: data.grade,
        subject: data.subject,
        language: data.language,
        ibCriteria: data.ibCriteria
          .filter((c) => c.enabled)
          .map((c) => ({
            criterion: c.criterion,
            levelMin: c.levelMin,
            levelMax: c.levelMax,
          })),
        topics: data.topics.map((tp) => ({
          name: tp.name,
          chapter: tp.chapter,
          weight: tp.weight,
        })),
        referenceFileIds: data.referenceFileIds,
        questionCount: data.questionCount,
        convertFrom: data.convertMode ? data.convertFileId : null,
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const result = await res.json();
      updateData({ questions: result.questions || [] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const regenerateOne = async (questionId: string) => {
    setRegeneratingId(questionId);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          curriculum: data.curriculum,
          grade: data.grade,
          subject: data.subject,
          language: data.language,
          ibCriteria: data.ibCriteria
            .filter((c) => c.enabled)
            .map((c) => ({
              criterion: c.criterion,
              levelMin: c.levelMin,
              levelMax: c.levelMax,
            })),
          topics: data.topics.map((tp) => ({
            name: tp.name,
            chapter: tp.chapter,
            weight: tp.weight,
          })),
          referenceFileIds: data.referenceFileIds,
          questionCount: 1,
        }),
      });

      const result = await res.json();
      const newQ = result.questions?.[0];
      if (newQ) {
        updateData({
          questions: data.questions.map((q) =>
            q.id === questionId ? { ...newQ, id: Math.random().toString(36).slice(2) } : q
          ),
        });
        toast.success("Question regenerated");
      }
    } catch {
      toast.error("Failed to regenerate question");
    } finally {
      setRegeneratingId(null);
    }
  };

  const removeQuestion = (id: string) => {
    updateData({ questions: data.questions.filter((q) => q.id !== id) });
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditText(q.text);
  };

  const saveEdit = (id: string) => {
    updateData({
      questions: data.questions.map((q) =>
        q.id === id ? { ...q, text: editText } : q
      ),
    });
    setEditingId(null);
    setEditText("");
  };

  const addQuestion = async () => {
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          curriculum: data.curriculum,
          grade: data.grade,
          subject: data.subject,
          language: data.language,
          ibCriteria: data.ibCriteria
            .filter((c) => c.enabled)
            .map((c) => ({
              criterion: c.criterion,
              levelMin: c.levelMin,
              levelMax: c.levelMax,
            })),
          topics: data.topics.map((tp) => ({
            name: tp.name,
            chapter: tp.chapter,
            weight: tp.weight,
          })),
          referenceFileIds: data.referenceFileIds,
          questionCount: 1,
        }),
      });

      const result = await res.json();
      const newQ = result.questions?.[0];
      if (newQ) {
        updateData({ questions: [...data.questions, newQ] });
      }
    } catch {
      toast.error("Failed to add question");
    }
  };

  const canProceed = data.questions.length > 0;

  return (
    <Card className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("step4Title")}</h2>
        <p className="text-sm text-muted-foreground">{t("step4Desc")}</p>
      </div>

      {/* Question count + generate button */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("questionCount")}</label>
          <Input
            type="number"
            value={data.questionCount}
            onChange={(e) =>
              updateData({ questionCount: Math.min(Math.max(1, Number(e.target.value)), 20) })
            }
            min={1}
            max={20}
            className="w-24"
          />
        </div>
        <Button onClick={generate} disabled={generating} className="gap-2">
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generating ? t("generating") : t("generateExam")}
        </Button>
        {data.questions.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {data.questions.length} questions &middot; {totalMarks} {t("totalMarks")}
          </span>
        )}
      </div>

      {/* Questions list */}
      {data.questions.length === 0 && !generating && (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">{t("noQuestionsYet")}</p>
        </div>
      )}

      <div className="space-y-3">
        {data.questions.map((q, i) => (
          <div
            key={q.id}
            className="group rounded-lg border border-border p-4 transition-all hover:shadow-sm"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Q{i + 1}
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {q.marks} {t("marks")}
              </span>
              {q.topic && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {q.topic}
                </span>
              )}
              {q.ib_criterion && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {t("criteria")} {q.ib_criterion}
                  {q.ib_level ? ` (${t("level")} ${q.ib_level})` : ""}
                </span>
              )}
              {q.difficulty && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    q.difficulty === "Hard"
                      ? "bg-destructive/10 text-destructive"
                      : q.difficulty === "Medium"
                      ? "bg-warning/10 text-warning"
                      : "bg-success/10 text-success"
                  }`}
                >
                  {q.difficulty}
                </span>
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed">{q.text}</p>
            )}

            {editingId !== q.id && (
              <div className="mt-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(q)}
                  className="gap-1 text-xs"
                >
                  <Pencil className="h-3 w-3" /> {t("edit")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => regenerateOne(q.id)}
                  disabled={regeneratingId === q.id}
                  className="gap-1 text-xs"
                >
                  {regeneratingId === q.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  {t("regenerate")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(q.id)}
                  className="gap-1 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" /> {t("remove")}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {data.questions.length > 0 && (
        <Button variant="outline" onClick={addQuestion} className="gap-2">
          <Plus className="h-4 w-4" /> {t("addQuestion")}
        </Button>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t("back")}
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="gap-2">
          {t("next")} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
