"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Navbar } from "@/components/layout/navbar";
import { toast } from "sonner";
import { Mail, Loader2, FileText } from "lucide-react";

export default function AuthPage({ params }: { params: { locale: string } }) {
  const t = useTranslations("auth");
  const locale = params.locale;
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || `/${locale}/dashboard`;
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | null>(null);

  // Show error from callback/redirect failures
  useEffect(() => {
    if (errorParam) {
      const messages: Record<string, string> = {
        auth_failed: "Authentication failed. Please try again.",
        provider_not_enabled: "Google sign-in is not available yet. Please use email instead.",
      };
      toast.error(messages[errorParam] || "Something went wrong. Please try again.");
    }
  }, [errorParam]);

  const handleEmailAuth = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setLoading("email");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?next=${redirect}` },
      });
      if (error) throw error;
      toast.success(t("otpSent"));
    } catch {
      toast.error(t("otpError"));
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading("google");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/${locale}/auth/callback?next=${redirect}`,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No redirect URL returned");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("provider") || message.includes("not enabled") || message.includes("Unsupported")) {
        toast.error(t("googleNotEnabled"));
      } else {
        toast.error(t("otpError"));
      }
      setLoading(null);
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
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>

          <div className="space-y-3">
            <Input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
              disabled={loading !== null}
            />
            <Button
              onClick={handleEmailAuth}
              className="w-full gap-2"
              disabled={loading !== null}
            >
              {loading === "email" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {t("emailButton")}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t("divider")}</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleGoogleAuth}
            className="w-full gap-2"
            disabled={loading !== null}
          >
            {loading === "google" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {t("googleButton")}
          </Button>

          <p className="text-center text-xs text-muted-foreground">{t("terms")}</p>
        </Card>
      </main>
    </div>
  );
}
