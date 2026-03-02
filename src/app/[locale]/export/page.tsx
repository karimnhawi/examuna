"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/layout/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileDown, Loader2, FileText, Clock } from "lucide-react";

interface Exam {
  id: string;
  title: string;
  subject: string;
  status: string;
  total_marks: number;
  created_at: string;
}

export default function ExportPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  const t = useTranslations("export");
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("exam");

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(preselectedId);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/exams")
      .then((res) => res.json())
      .then((data) => {
        setExams(data.exams || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleExport = async () => {
    if (!selectedId) {
      toast.error(t("noExam"));
      return;
    }

    setExporting(true);
    try {
      const res = await fetch(`/api/export-docx?examId=${selectedId}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exam-${selectedId}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Document downloaded!");
    } catch {
      toast.error("Failed to export. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={locale} />
      <main className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Exam list */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="mb-4 text-lg font-semibold">{t("selectExam")}</h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : exams.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t("noExam")}</p>
              ) : (
                <div className="space-y-2">
                  {exams.map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => setSelectedId(exam.id)}
                      className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all ${
                        selectedId === exam.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{exam.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {exam.subject} &middot; {exam.total_marks} marks
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          exam.status === "draft"
                            ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success"
                        }`}>
                          {exam.status}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(exam.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Export actions */}
          <div>
            <Card className="space-y-4">
              <h2 className="text-lg font-semibold">Export</h2>
              <Button
                onClick={handleExport}
                disabled={!selectedId || exporting}
                className="w-full gap-2"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                {exporting ? t("exporting") : t("downloadWord")}
              </Button>
              <Button variant="outline" className="w-full" disabled>
                {t("downloadPdf")}
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
