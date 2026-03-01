import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  return (
    <main className="container py-10">
      <h1 className="mb-2 text-3xl font-semibold">Teacher Dashboard</h1>
      <p className="mb-8 text-muted-foreground">Upload source material and build a fresh exam with just a few clicks.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold">Upload test bank</h2>
          <p className="text-sm text-muted-foreground">Import existing papers, worksheet scans and source files.</p>
          <Link href={`/${locale}/upload`}><Button>Open uploader</Button></Link>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold">Create exam</h2>
          <p className="text-sm text-muted-foreground">Generate an exam draft, review questions, then export.</p>
          <Link href={`/${locale}/builder`}><Button>Create new exam</Button></Link>
        </Card>
      </div>
    </main>
  );
}
