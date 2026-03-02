"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { WizardData } from "./exam-wizard";
import {
  ArrowLeft,
  FileDown,
  Loader2,
  Home,
  FileText,
  CheckCircle,
} from "lucide-react";

interface Props {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  locale: string;
  onBack: () => void;
  onDone: () => void;
}

export function StepExport({ data, updateData, locale, onBack, onDone }: Props) {
  const t = useTranslations("wizard");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saved, setSaved] = useState(false);

  const totalMarks = data.questions.reduce((sum, q) => sum + q.marks, 0);
  const enabledCriteria = data.ibCriteria.filter((c) => c.enabled);

  const saveExam = async (): Promise<string | null> => {
    if (data.savedExamId) return data.savedExamId;

    setSaving(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          subject: data.subject,
          language: data.language,
          duration_minutes: null,
          total_marks: totalMarks,
          questions: data.questions.map((q, i) => ({
            question_id: q.source === "bank" ? q.id : null,
            custom_question_text: q.text,
            position: i + 1,
            marks: q.marks,
            ib_criterion: q.ib_criterion || null,
            ib_level: q.ib_level ?? null,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      const result = await res.json();
      updateData({ savedExamId: result.id });
      setSaved(true);
      toast.success(t("saved"));
      return result.id;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    const examId = await saveExam();
    if (!examId) return;

    setExporting(true);
    try {
      const res = await fetch(`/api/export-docx?examId=${examId}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = (data.title || "exam")
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
        .slice(0, 50);
      a.download = `${safeTitle}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("exported"));
    } catch {
      toast.error(t("exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  const handleSaveAndGo = async () => {
    await saveExam();
    onDone();
  };

  return (
    <Card className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("exportTitle")}</h2>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <h3 className="text-sm font-semibold">{t("summary")}</h3>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("examTitle")}:</span>
            <span className="font-medium">{data.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t("subject")}:</span>
            <span className="font-medium">{data.subject}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t("totalQuestions")}:</span>
            <span className="font-medium">{data.questions.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t("totalMarks")}:</span>
            <span className="font-medium">{totalMarks}</span>
          </div>
          {enabledCriteria.length > 0 && (
            <div className="flex items-center gap-2 sm:col-span-2">
              <span className="text-muted-foreground">{t("criteriaCovered")}:</span>
              <div className="flex gap-1">
                {enabledCriteria.map((c) => (
                  <span
                    key={c.criterion}
                    className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                  >
                    {c.criterion} ({c.levelMin}-{c.levelMax})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Questions preview */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {data.questions.map((q, i) => (
          <div
            key={q.id}
            className="flex items-start gap-2 rounded border border-border p-2 text-sm"
          >
            <span className="flex-shrink-0 font-medium text-muted-foreground">
              {i + 1}.
            </span>
            <span className="line-clamp-2">{q.text}</span>
            <span className="ml-auto flex-shrink-0 text-xs text-muted-foreground">
              [{q.marks} {t("marks")}]
            </span>
          </div>
        ))}
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />
          {t("saved")}
        </div>
      )}

      {/* Actions + Back */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t("back")}
        </Button>
        <div className="flex-1" />
        <Button onClick={handleExport} disabled={exporting} className="gap-2">
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {t("downloadWord")}
        </Button>
        <Button
          variant="outline"
          onClick={handleSaveAndGo}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Home className="h-4 w-4" />
          )}
          {saving ? t("saving") : t("saveDashboard")}
        </Button>
      </div>
    </Card>
  );
}
