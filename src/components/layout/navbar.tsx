"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { LogOut, Menu, X, FileText } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export function Navbar({ locale }: { locale: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("nav");
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border glass">
      <div className="container flex h-16 items-center justify-between">
        <Link href={user ? `/${locale}/dashboard` : `/${locale}`} className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <FileText className="h-6 w-6 text-primary" />
          <span>Examuna</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link href={`/${locale}/dashboard`}>
                <Button variant="ghost" size="sm">{t("dashboard")}</Button>
              </Link>
              <div className="mx-2 h-6 w-px bg-border" />
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1 h-4 w-4" /> {t("signOut")}
              </Button>
            </>
          ) : (
            <Link href={`/${locale}/auth`}>
              <Button>{t("signIn")}</Button>
            </Link>
          )}
        </nav>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border glass p-4 md:hidden animate-fade-in">
          <nav className="flex flex-col gap-2">
            {user ? (
              <>
                <Link href={`/${locale}/dashboard`} onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">{t("dashboard")}</Button>
                </Link>
                <div className="my-2 h-px bg-border" />
                <p className="px-4 text-sm text-muted-foreground">{user.email}</p>
                <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> {t("signOut")}
                </Button>
              </>
            ) : (
              <Link href={`/${locale}/auth`} onClick={() => setMobileOpen(false)}>
                <Button className="w-full">{t("signIn")}</Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
