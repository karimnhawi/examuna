import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Upload, PenTool, FileText, HelpCircle, FolderOpen, Clock } from "lucide-react";

export default async function DashboardPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  const t = await getTranslations("dashboard");
  const supabase = getSupabaseServerClient();

  // Fetch stats
  const [questionsRes, examsRes, filesRes, recentExamsRes] = await Promise.all([
    supabase.from("question_bank").select("id", { count: "exact", head: true }),
    supabase.from("exams").select("id", { count: "exact", head: true }),
    supabase.from("source_files").select("id", { count: "exact", head: true }),
    supabase.from("exams").select("id, title, subject, status, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const questionCount = questionsRes.count ?? 0;
  const examCount = examsRes.count ?? 0;
  const fileCount = filesRes.count ?? 0;
  const recentExams = recentExamsRes.data ?? [];

  const stats = [
    { label: t("statsQuestions"), value: questionCount, icon: HelpCircle },
    { label: t("statsExams"), value: examCount, icon: FileText },
    { label: t("statsFiles"), value: fileCount, icon: FolderOpen },
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
          {stats.map((stat) => (
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

        {/* Quick actions */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col justify-between space-y-4">
            <div>
              <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-3">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">{t("uploadCard")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("uploadDesc")}</p>
            </div>
            <Link href={`/${locale}/upload`}>
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                {t("uploadButton")}
              </Button>
            </Link>
          </Card>
          <Card className="flex flex-col justify-between space-y-4">
            <div>
              <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-3">
                <PenTool className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">{t("builderCard")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("builderDesc")}</p>
            </div>
            <Link href={`/${locale}/builder`}>
              <Button className="gap-2">
                <PenTool className="h-4 w-4" />
                {t("builderButton")}
              </Button>
            </Link>
          </Card>
        </div>

        {/* Recent exams */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold">{t("recentTitle")}</h2>
          {recentExams.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noExams")}</p>
          ) : (
            <div className="space-y-3">
              {recentExams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{exam.title}</p>
                      <p className="text-xs text-muted-foreground">{exam.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
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
                    <Link href={`/${locale}/export?exam=${exam.id}`}>
                      <Button variant="ghost" size="sm">Export</Button>
                    </Link>
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
