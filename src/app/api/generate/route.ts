import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getGeminiClient } from "@/lib/gemini";

export async function POST(req: Request) {
  // Auth check
  const supabase = getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject = "General Science", difficulty = "Mixed", count = 5 } = await req.json();

  // Validate count
  const safeCount = Math.min(Math.max(1, Number(count) || 5), 20);

  // Try to fetch from question bank first
  let query = supabase
    .from("question_bank")
    .select("id, question_text, answer_key, topic, difficulty, ib_band, cognitive_level, marks, usage_count")
    .order("usage_count", { ascending: true });

  if (difficulty !== "Mixed") {
    query = query.eq("difficulty", difficulty);
  }

  const { data: bankQuestions } = await query.limit(safeCount);

  if (bankQuestions && bankQuestions.length > 0) {
    // Use questions from the bank
    const questions = bankQuestions.map((q) => ({
      id: q.id,
      text: q.question_text,
      answer_key: q.answer_key,
      topic: q.topic,
      difficulty: q.difficulty,
      ib_band: q.ib_band,
      cognitive_level: q.cognitive_level,
      marks: q.marks || 4,
      source: "bank" as const,
    }));

    // Increment usage count
    for (const q of bankQuestions) {
      await supabase
        .from("question_bank")
        .update({ usage_count: (q.usage_count ?? 0) + 1 })
        .eq("id", q.id);
    }

    return NextResponse.json({ questions });
  }

  // Fallback: generate with Gemini AI
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate ${safeCount} exam questions for the subject "${subject}" at ${difficulty} difficulty level.

Return a JSON array where each item has:
- "text": The full question text
- "marks": Point value (integer, 2-8)
- "topic": The specific topic
- "difficulty": "${difficulty === "Mixed" ? "Easy/Medium/Hard mix" : difficulty}"
- "cognitive_level": One of "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"
- "answer_key": Brief model answer

Return ONLY a valid JSON array, no markdown or code blocks.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let questions;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      questions = parsed.map((q: Record<string, unknown>, i: number) => ({
        id: crypto.randomUUID(),
        text: q.text || q.question || `Question ${i + 1}`,
        marks: q.marks || 4,
        topic: q.topic || subject,
        difficulty: q.difficulty || difficulty,
        cognitive_level: q.cognitive_level || "Apply",
        answer_key: q.answer_key || "",
        source: "ai" as const,
      }));
    } catch {
      // Fallback to template questions
      questions = Array.from({ length: safeCount }).map((_, i) => ({
        id: crypto.randomUUID(),
        text: `[${subject}] Design a structured response for learning objective ${i + 1}. Include explanation and evaluation.`,
        marks: i % 2 === 0 ? 6 : 4,
        topic: subject,
        difficulty: difficulty,
        cognitive_level: "Apply",
        answer_key: "",
        source: "template" as const,
      }));
    }

    return NextResponse.json({ questions });
  } catch {
    // Last resort fallback
    const questions = Array.from({ length: safeCount }).map((_, i) => ({
      id: crypto.randomUUID(),
      text: `[${subject}] Design a structured response for learning objective ${i + 1}.`,
      marks: i % 2 === 0 ? 6 : 4,
      topic: subject,
      difficulty: difficulty,
      cognitive_level: "Apply",
      answer_key: "",
      source: "template" as const,
    }));

    return NextResponse.json({ questions });
  }
}
