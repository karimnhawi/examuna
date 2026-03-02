"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Navbar } from "@/components/layout/navbar";
import { toast } from "sonner";
import { Loader2, FileText, LogIn, UserPlus } from "lucide-react";

export default function AuthPage({ params }: { params: { locale: string } }) {
  const t = useTranslations("auth");
  const locale = params.locale;
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || `/${locale}/dashboard`;

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !email.includes("@")) {
      toast.error(t("invalidEmail"));
      return;
    }
    if (!password || password.length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: email.split("@")[0] } },
        });
        if (error) throw error;
        toast.success(t("signupSuccess"));
        router.push(redirect);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success(t("signinSuccess"));
        router.push(redirect);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("Invalid login credentials")) {
        toast.error(t("invalidCredentials"));
      } else if (message.includes("already registered") || message.includes("already been registered")) {
        toast.error(t("alreadyRegistered"));
      } else {
        toast.error(message || t("genericError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={locale} />
      <main className="container flex items-center justify-center py-20">
        <Card className="mx-auto w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">
              {mode === "signin" ? t("signinTitle") : t("signupTitle")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin" ? t("signinSubtitle") : t("signupSubtitle")}
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("emailLabel")}</label>
              <Input
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("passwordLabel")}</label>
              <Input
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full gap-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "signin" ? (
                <LogIn className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {mode === "signin" ? t("signinButton") : t("signupButton")}
            </Button>
          </div>

          <div className="text-center text-sm">
            {mode === "signin" ? (
              <p className="text-muted-foreground">
                {t("noAccount")}{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="font-medium text-primary hover:underline"
                >
                  {t("switchToSignup")}
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                {t("hasAccount")}{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="font-medium text-primary hover:underline"
                >
                  {t("switchToSignin")}
                </button>
              </p>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
