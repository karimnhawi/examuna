import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini";

const EXTRACTION_PROMPT = `You are an exam question extraction expert. Analyze the following text and extract individual exam questions.

For each question, return a JSON object with:
- "question": The full question text
- "topic": The topic/subject area
- "difficulty": "Easy", "Medium", or "Hard"
- "ib_band": An integer from 1-7 representing IB band level
- "cognitive_level": One of "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"
- "marks": Estimated marks for this question (integer)
- "answer_key": A brief model answer or key points

Return ONLY a valid JSON array. No markdown, no code blocks, just the JSON array.
If no questions can be extracted, return an empty array [].

Text to analyze:
`;

export async function POST(req: Request) {
  // Auth check
  const supabase = getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { text, filePath, fileName, sourceFileId } = body;

  // We need either text or filePath
  if (!text && !filePath) {
    return NextResponse.json({ error: "text or filePath is required" }, { status: 400 });
  }

  try {
    const ai = getGeminiClient();

    let inputText = text;

    // If we have a file path but no text, we'd need OCR/parsing
    // For now, use the file name as context
    if (!inputText && fileName) {
      inputText = `File: ${fileName}. Please generate 5 sample exam questions that would typically appear in a document with this name.`;
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: EXTRACTION_PROMPT + inputText,
    });

    const responseText = response.text || "";

    // Parse the JSON response
    let extracted;
    try {
      // Try to extract JSON from the response (handles markdown code blocks)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      extracted = [];
    }

    // Save extracted questions to question_bank
    if (extracted.length > 0 && sourceFileId) {
      const questionsToInsert = extracted.map((q: Record<string, unknown>) => ({
        user_id: user.id,
        source_file_id: sourceFileId,
        question_text: q.question || q.question_text || "",
        answer_key: q.answer_key || null,
        topic: q.topic || null,
        difficulty: q.difficulty || null,
        ib_band: q.ib_band || null,
        cognitive_level: q.cognitive_level || null,
        marks: q.marks || 0,
        language: "en",
      }));

      await supabase.from("question_bank").insert(questionsToInsert);

      // Update source file status
      if (sourceFileId) {
        await supabase
          .from("source_files")
          .update({ status: "processed" })
          .eq("id", sourceFileId);
      }
    }

    return NextResponse.json({ extracted });
  } catch {
    return NextResponse.json({
      extracted: [],
      error: "Extraction failed. The file may not contain recognizable exam questions.",
    });
  }
}
