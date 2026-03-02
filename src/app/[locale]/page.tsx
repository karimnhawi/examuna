import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Brain, FileDown, Sparkles, CheckCircle, Zap, Shield } from "lucide-react";

export default async function LandingPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations("landing");
  const locale = params.locale;

  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={locale} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
        <div className="absolute top-20 -left-32 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-10 -right-32 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="container relative py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              {t("badge")}
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              {t("headline")}
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-muted-foreground md:text-xl">
              {t("sub")}
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={`/${locale}/auth`}>
                <Button size="lg" className="gap-2 px-8 text-base">
                  <Zap className="h-4 w-4" />
                  {t("cta")}
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="px-8 text-base">
                  {t("learnMore")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-muted/30 py-20">
        <div className="container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">{t("featuresTitle")}</h2>
            <p className="text-muted-foreground">{t("featuresSub")}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{t("feature1Title")}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t("feature1Desc")}</p>
            </Card>
            <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{t("feature2Title")}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t("feature2Desc")}</p>
            </Card>
            <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <FileDown className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{t("feature3Title")}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t("feature3Desc")}</p>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">{t("howTitle")}</h2>
            <p className="text-muted-foreground">{t("howSub")}</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              { step: "1", title: t("step1Title"), desc: t("step1Desc") },
              { step: "2", title: t("step2Title"), desc: t("step2Desc") },
              { step: "3", title: t("step3Title"), desc: t("step3Desc") },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Benefits */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container">
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {[
              { icon: CheckCircle, title: t("benefit1Title"), desc: t("benefit1Desc") },
              { icon: Zap, title: t("benefit2Title"), desc: t("benefit2Desc") },
              { icon: Shield, title: t("benefit3Title"), desc: t("benefit3Desc") },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <item.icon className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="mb-1 font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <Card className="mx-auto max-w-2xl bg-gradient-to-br from-primary/5 to-blue-500/5 text-center">
            <h2 className="mb-4 text-2xl font-bold">{t("ctaTitle")}</h2>
            <p className="mb-8 text-muted-foreground">{t("ctaSub")}</p>
            <Link href={`/${locale}/auth`}>
              <Button size="lg" className="px-8">{t("cta")}</Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">{t("footer")}</p>
          <div className="flex gap-4">
            <Link href={`/${locale === "en" ? "ar" : "en"}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {locale === "en" ? "العربية" : "English"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
