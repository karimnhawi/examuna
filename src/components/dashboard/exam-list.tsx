"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Clock, FileDown, Copy, Trash2, Loader2 } from "lucide-react";

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

  const handleExport = async (examId: string) => {
    setExportingId(examId);
    try {
      const res = await fetch(`/api/export-docx?examId=${examId}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exam-${examId}.docx`;
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
    if (!confirm(t("deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/exams?id=${examId}`, { method: "DELETE" });
      if (res.ok) {
        setExams((prev) => prev.filter((e) => e.id !== examId));
        toast.success(t("deleted"));
      }
    } catch {
      toast.error("Delete failed");
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
                onClick={() => handleExport(exam.id)}
                disabled={exportingId === exam.id}
                title="Export"
              >
                {exportingId === exam.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileDown className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(exam.id)}
                className="text-destructive hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
