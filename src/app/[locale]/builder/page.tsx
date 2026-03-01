import { ExamBuilderClient } from "@/components/dashboard/exam-builder-client";

export default function BuilderPage() {
  return (
    <main className="container py-10">
      <h1 className="mb-2 text-3xl font-semibold">Exam Builder</h1>
      <p className="mb-8 text-muted-foreground">Choose your criteria, generate an exam draft, and refine each question.</p>
      <ExamBuilderClient />
    </main>
  );
}
