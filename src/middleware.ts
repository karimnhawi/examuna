import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

const protectedPaths = ["/dashboard"];

export async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  // Check if the path is protected
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some((p) =>
    locales.some((l) => pathname.startsWith(`/${l}${p}`))
  );

  if (!isProtected) return intlResponse;

  // Create a Supabase client to check auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const locale = locales.find((l) => pathname.startsWith(`/${l}`)) || defaultLocale;
    const loginUrl = new URL(`/${locale}/auth`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlResponse;
}

export const config = {
  matcher: ["/", "/(en|ar)/:path*"],
};
