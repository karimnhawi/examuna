import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function LandingPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations("landing");
  const locale = params.locale;

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar locale={locale} />
      <section className="container py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl">{t("headline")}</h1>
          <p className="mb-8 text-lg text-muted-foreground">{t("sub")}</p>
          <div className="flex justify-center gap-3">
            <Link href={`/${locale}/dashboard`}><Button size="lg">{t("cta")}</Button></Link>
            <Link href={`/${locale}/upload`}><Button variant="outline" size="lg">Upload test bank</Button></Link>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          <Card><h3 className="mb-2 font-semibold">Smart extraction</h3><p className="text-sm text-muted-foreground">Parse PDF, DOCX and images into tagged, reusable questions.</p></Card>
          <Card><h3 className="mb-2 font-semibold">Exam builder</h3><p className="text-sm text-muted-foreground">Set topic, difficulty and marks, then keep or swap each item.</p></Card>
          <Card><h3 className="mb-2 font-semibold">Export ready</h3><p className="text-sm text-muted-foreground">Download professional Word and PDF versions for your class.</p></Card>
        </div>
      </section>
    </main>
  );
}
