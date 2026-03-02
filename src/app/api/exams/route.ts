import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, subject, duration_minutes, total_marks, questions } = body;

  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "Title and at least one question are required" }, { status: 400 });
  }

  // Create exam
  const { data: exam, error: examError } = await supabase
    .from("exams")
    .insert({
      user_id: user.id,
      title,
      subject: subject || null,
      duration_minutes: duration_minutes || null,
      total_marks: total_marks || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (examError || !exam) {
    return NextResponse.json({ error: examError?.message || "Failed to create exam" }, { status: 500 });
  }

  // Insert exam questions
  const examQuestions = questions.map((q: Record<string, unknown>) => ({
    exam_id: exam.id,
    question_id: q.question_id || null,
    custom_question_text: q.custom_question_text || null,
    position: q.position || 0,
    marks: q.marks || 0,
    action_state: "keep",
  }));

  const { error: questionsError } = await supabase
    .from("exam_questions")
    .insert(examQuestions);

  if (questionsError) {
    return NextResponse.json({ error: "Exam created but failed to save questions" }, { status: 500 });
  }

  return NextResponse.json({ id: exam.id, message: "Exam saved successfully" });
}

export async function GET(req: Request) {
  const supabase = getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("id");

  if (examId) {
    // Get single exam with questions
    const { data: exam, error } = await supabase
      .from("exams")
      .select(`
        id, title, subject, language, duration_minutes, total_marks, status, created_at,
        exam_questions (id, question_id, custom_question_text, position, marks, action_state)
      `)
      .eq("id", examId)
      .single();

    if (error || !exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json(exam);
  }

  // List all exams
  const { data: exams, error } = await supabase
    .from("exams")
    .select("id, title, subject, status, total_marks, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ exams: exams || [] });
}

export async function DELETE(req: Request) {
  const supabase = getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("id");

  if (!examId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Delete exam questions first, then the exam
  await supabase.from("exam_questions").delete().eq("exam_id", examId);
  const { error } = await supabase.from("exams").delete().eq("id", examId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Exam deleted" });
}
