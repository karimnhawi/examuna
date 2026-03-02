"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/layout/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExamWizard } from "@/components/wizard/exam-wizard";
import { ExamList } from "@/components/dashboard/exam-list";
import { QuestionBank } from "@/components/dashboard/question-bank";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  Plus,
  HelpCircle,
  FileText,
  FolderOpen,
  Loader2,
  ArrowLeft,
  BookOpen,
  Upload,
} from "lucide-react";

interface Stats {
  questionCount: number;
  examCount: number;
  fileCount: number;
}

interface Exam {
  id: string;
  title: string;
  subject: string;
  status: string;
  total_marks: number;
  created_at: string;
}

type View = "home" | "wizard" | "exams" | "questions" | "upload";

export default function DashboardPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  const t = useTranslations("dashboard");
  const [view, setView] = useState<View>("home");
  const [stats, setStats] = useState<Stats>({ questionCount: 0, examCount: 0, fileCount: 0 });
  const [exams, setExams] = useState<Exam[]>([]);
  const [existingFiles, setExistingFiles] = useState<{ id: string; file_name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    Promise.all([
      supabase.from("question_bank").select("id", { count: "exact", head: true }),
      supabase.from("exams").select("id", { count: "exact", head: true }),
      supabase.from("source_files").select("id", { count: "exact", head: true }),
      supabase
        .from("exams")
        .select("id, title, subject, status, total_marks, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("source_files")
        .select("id, file_name")
        .order("created_at", { ascending: false })
        .limit(50),
    ]).then(([qRes, eRes, fRes, examsRes, filesRes]) => {
      setStats({
        questionCount: qRes.count ?? 0,
        examCount: eRes.count ?? 0,
        fileCount: fRes.count ?? 0,
      });
      setExams(examsRes.data ?? []);
      setExistingFiles(filesRes.data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar locale={locale} />
        <main className="container py-10">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  // Wizard view
  if (view === "wizard") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar locale={locale} />
        <main className="container max-w-3xl py-10">
          <Button
            variant="ghost"
            onClick={() => setView("home")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> {t("title")}
          </Button>
          <ExamWizard locale={locale} existingFiles={existingFiles} />
        </main>
      </div>
    );
  }

  // My Exams view
  if (view === "exams") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar locale={locale} />
        <main className="container py-10">
          <Button
            variant="ghost"
            onClick={() => setView("home")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> {t("title")}
          </Button>
          <h1 className="mb-6 text-2xl font-bold">{t("myExams")}</h1>
          <ExamList initialExams={exams} locale={locale} />
        </main>
      </div>
    );
  }

  // Question Bank view
  if (view === "questions") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar locale={locale} />
        <main className="container py-10">
          <Button
            variant="ghost"
            onClick={() => setView("home")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> {t("title")}
          </Button>
          <h1 className="mb-6 text-2xl font-bold">{t("myQuestionBank")}</h1>
          <QuestionBank />
        </main>
      </div>
    );
  }

  // Home view (dashboard)
  const statCards = [
    { label: t("statsQuestions"), value: stats.questionCount, icon: HelpCircle },
    { label: t("statsExams"), value: stats.examCount, icon: FileText },
    { label: t("statsFiles"), value: stats.fileCount, icon: FolderOpen },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={locale} />
      <main className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {statCards.map((stat) => (
            <Card key={stat.label} className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Create New Exam - hero card */}
        <Card className="mb-8 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{t("createExam")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("createExamDesc")}
              </p>
            </div>
            <Button
              onClick={() => setView("wizard")}
              size="lg"
              className="gap-2 flex-shrink-0"
            >
              <Plus className="h-5 w-5" /> {t("createExam")}
            </Button>
          </div>
        </Card>

        {/* Quick links */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <button
            onClick={() => setView("exams")}
            className="rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:shadow-md hover:border-primary/30"
          >
            <div className="mb-2 inline-flex rounded-lg bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">{t("myExams")}</h3>
            <p className="text-xs text-muted-foreground">
              {stats.examCount} exams
            </p>
          </button>

          <button
            onClick={() => setView("questions")}
            className="rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:shadow-md hover:border-primary/30"
          >
            <div className="mb-2 inline-flex rounded-lg bg-primary/10 p-2">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">{t("myQuestionBank")}</h3>
            <p className="text-xs text-muted-foreground">
              {stats.questionCount} questions
            </p>
          </button>

          <button
            onClick={() => setView("wizard")}
            className="rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:shadow-md hover:border-primary/30"
          >
            <div className="mb-2 inline-flex rounded-lg bg-primary/10 p-2">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">{t("uploadMaterials")}</h3>
            <p className="text-xs text-muted-foreground">
              {stats.fileCount} files
            </p>
          </button>
        </div>

        {/* Recent exams */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t("recentTitle")}</h2>
            {exams.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("exams")}
              >
                {t("viewAll")}
              </Button>
            )}
          </div>
          {exams.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noExams")}</p>
          ) : (
            <div className="space-y-2">
              {exams.slice(0, 5).map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{exam.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {exam.subject}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        exam.status === "draft"
                          ? "bg-warning/10 text-warning"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      {exam.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(exam.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
