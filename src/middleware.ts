import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/i18n/routing";

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

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

  // Create a response we can modify to set refreshed cookies
  const response = intlResponse;

  // Create a Supabase client that can refresh the session and update cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options: Record<string, unknown>) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          response.cookies.set(name, value, { ...options, maxAge: COOKIE_MAX_AGE } as any);
        },
        remove: (name: string, options: Record<string, unknown>) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          response.cookies.set(name, "", { ...options, maxAge: 0 } as any);
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const locale = locales.find((l) => pathname.startsWith(`/${l}`)) || defaultLocale;
    const loginUrl = new URL(`/${locale}/auth`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/", "/(en|ar)/:path*"],
};
