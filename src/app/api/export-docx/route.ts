import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, BorderStyle } from "docx";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(req: Request) {
  // Auth check
  const supabase = getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");

  if (!examId) {
    return NextResponse.json({ error: "examId is required" }, { status: 400 });
  }

  // Validate UUID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(examId)) {
    return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
  }

  // Fetch exam with questions
  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select(`
      id, title, subject, duration_minutes, total_marks,
      exam_questions (id, custom_question_text, position, marks, question_id)
    `)
    .eq("id", examId)
    .single();

  if (examError || !exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  // Sort questions by position
  const questions = (exam.exam_questions || []).sort(
    (a: { position: number }, b: { position: number }) => a.position - b.position
  );

  // Build document
  const children: Paragraph[] = [
    // Header
    new Paragraph({
      text: exam.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: exam.subject || "", size: 24, color: "666666" }),
      ],
    }),
    new Paragraph({ text: "" }),

    // Student info
    new Paragraph({
      children: [new TextRun({ text: "Student Name: ________________________________", size: 22 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: "Date: ________________", size: 22 })],
    }),
    exam.duration_minutes
      ? new Paragraph({
          children: [new TextRun({ text: `Duration: ${exam.duration_minutes} minutes`, size: 22 })],
        })
      : new Paragraph({ text: "" }),
    exam.total_marks
      ? new Paragraph({
          children: [new TextRun({ text: `Total Marks: ${exam.total_marks}`, size: 22 })],
        })
      : new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" } },
      children: [],
    }),
    new Paragraph({ text: "" }),

    // Instructions
    new Paragraph({
      text: "Instructions",
      heading: HeadingLevel.HEADING_2,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Answer all questions in the spaces provided. Show all working where applicable.", size: 22 }),
      ],
    }),
    new Paragraph({ text: "" }),
  ];

  // Questions
  questions.forEach((q: { custom_question_text: string; position: number; marks: number }, index: number) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${index + 1}. `, bold: true, size: 22 }),
          new TextRun({ text: q.custom_question_text || `Question ${index + 1}`, size: 22 }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: `[${q.marks} marks]`, italics: true, size: 20, color: "666666" }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "" }),
    );
  });

  const doc = new Document({
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(doc);

  // Sanitize title for filename
  const safeTitle = (exam.title || "exam")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 50);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${safeTitle}.docx"`,
    },
  });
}
