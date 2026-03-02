import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function getSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: Record<string, unknown>) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // set() is not available in Server Components, only in Route Handlers and Server Actions
          }
        },
        remove: (name: string, options: Record<string, unknown>) => {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // remove() is not available in Server Components
          }
        },
      },
    }
  );
}
