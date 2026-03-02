import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/navbar";
import { ExamBuilderClient } from "@/components/dashboard/exam-builder-client";

export default async function BuilderPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  const t = await getTranslations("builder");

  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={locale} />
      <main className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <ExamBuilderClient locale={locale} />
      </main>
    </div>
  );
}
