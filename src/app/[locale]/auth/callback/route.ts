import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request, { params }: { params: { locale: string } }) {
  const { searchParams, origin } = new URL(request.url);
  const locale = params.locale || "en";
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? `/${locale}/dashboard`;

  // Handle error params from Supabase (e.g. provider not enabled)
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  if (error || errorCode) {
    const errorType = errorDescription?.includes("provider")
      ? "provider_not_enabled"
      : "auth_failed";
    return NextResponse.redirect(`${origin}/${locale}/auth?error=${errorType}`);
  }

  if (code) {
    const supabase = getSupabaseServerClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/${locale}/auth?error=auth_failed`);
}
