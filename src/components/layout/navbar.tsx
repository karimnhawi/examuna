import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar({ locale }: { locale: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href={`/${locale}`} className="text-xl font-semibold">Examuna</Link>
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/auth`}><Button variant="ghost">Sign in</Button></Link>
          <Link href={`/${locale}/dashboard`}><Button>Open dashboard</Button></Link>
        </div>
      </div>
    </header>
  );
}
