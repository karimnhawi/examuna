import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locales } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!locales.includes(locale as "en" | "ar")) notFound();
  const messages = await getMessages();

  return (
    <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen">
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
        <Toaster position={locale === "ar" ? "top-left" : "top-right"} richColors closeButton />
      </NextIntlClientProvider>
    </div>
  );
}
