"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Clock, FileDown, Trash2, Loader2 } from "lucide-react";

interface Exam {
  id: string;
  title: string;
  subject: string;
  status: string;
  total_marks: number;
  created_at: string;
}

interface Props {
  initialExams: Exam[];
  locale: string;
}

export function ExamList({ initialExams, locale }: Props) {
  const t = useTranslations("dashboard");
  const [exams, setExams] = useState(initialExams);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const handleExport = async (exam: Exam) => {
    setExportingId(exam.id);
    try {
      const res = await fetch(`/api/export-docx?examId=${exam.id}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Use exam title for filename
      const safeTitle = (exam.title || "exam")
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
        .slice(0, 50);
      a.download = `${safeTitle}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    } finally {
      setExportingId(null);
    }
  };

  const handleDelete = async (examId: string) => {
    try {
      const res = await fetch(`/api/exams?id=${examId}`, { method: "DELETE" });
      if (res.ok) {
        setExams((prev) => prev.filter((e) => e.id !== examId));
        toast.success(t("deleted"));
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setConfirmingDeleteId(null);
    }
  };

  if (exams.length === 0) {
    return (
      <Card className="py-8 text-center">
        <p className="text-sm text-muted-foreground">{t("noExams")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {exams.map((exam) => (
        <Card key={exam.id} className="p-4">
          {confirmingDeleteId === exam.id ? (
            /* Inline delete confirmation */
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">{t("confirmDelete")}</p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleDelete(exam.id)}
                  className="gap-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("yesDelete")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmingDeleteId(null)}
                >
                  {t("cancel") || "Cancel"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{exam.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {exam.subject} &middot; {exam.total_marks || 0} marks
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    exam.status === "draft"
                      ? "bg-warning/10 text-warning"
                      : "bg-success/10 text-success"
                  }`}
                >
                  {exam.status}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(exam.created_at).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport(exam)}
                  disabled={exportingId === exam.id}
                  className="gap-1"
                >
                  {exportingId === exam.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileDown className="h-3.5 w-3.5" />
                  )}
                  <span className="text-xs">{t("export")}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingDeleteId(exam.id)}
                  className="gap-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="text-xs">{t("deleteLabel")}</span>
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
