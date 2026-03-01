import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ExportPage() {
  return (
    <main className="container py-10">
      <h1 className="mb-2 text-3xl font-semibold">Export Exam</h1>
      <p className="mb-8 text-muted-foreground">Download your exam package with a clean layout and answer key.</p>
      <Card className="flex gap-4">
        <a href="/api/export-docx?title=Midterm%20Biology"><Button>Download Word (.docx)</Button></a>
        <Button variant="outline">Download PDF (coming via renderer)</Button>
      </Card>
    </main>
  );
}
