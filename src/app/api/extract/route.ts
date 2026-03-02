import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini";
import mammoth from "mammoth";

const EXTRACTION_PROMPT = `You are an exam question extraction expert. Analyze the following text and extract individual exam questions.

For each question, return a JSON object with:
- "question": The full question text (preserve the original language — Arabic or English)
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

async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  return result.value;
}

async function logExtraction(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
  opts: {
    questionsReturned: number;
    success: boolean;
    errorMessage?: string;
    usage?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
  }
) {
  await supabase.from("generation_logs").insert({
    user_id: userId,
    endpoint: "extract",
    model: GEMINI_MODEL,
    questions_returned: opts.questionsReturned,
    success: opts.success,
    error_message: opts.errorMessage ?? null,
    prompt_tokens: opts.usage?.promptTokenCount ?? null,
    output_tokens: opts.usage?.candidatesTokenCount ?? null,
    total_tokens: opts.usage?.totalTokenCount ?? null,
  }).then(() => {}, () => {}); // don't let logging failure mask real errors
}

export const maxDuration = 60;

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

    // If we have a file path but no direct text, download and extract from storage
    if (!inputText && filePath) {
      const supabaseAdmin = getSupabaseAdminClient();
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from("test-bank-files")
        .download(filePath);

      if (downloadError || !fileData) {
        // Fall back to filename-based generation
        inputText = `File: ${fileName || filePath}. Please generate 5 sample exam questions that would typically appear in a document with this name.`;
      } else {
        const mimeType = fileName?.endsWith(".docx")
          ? "docx"
          : fileName?.endsWith(".pdf")
          ? "pdf"
          : "other";

        if (mimeType === "docx") {
          const buffer = await fileData.arrayBuffer();
          inputText = await extractTextFromDocx(buffer);
        } else if (mimeType === "pdf") {
          // For PDFs, send the raw content to Gemini with a note
          // Gemini 3 Flash can handle PDF content natively via multimodal
          const buffer = await fileData.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");

          const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
              {
                role: "user",
                parts: [
                  { inlineData: { mimeType: "application/pdf", data: base64 } },
                  { text: EXTRACTION_PROMPT + "\n[See the attached PDF document above]" },
                ],
              },
            ],
          });

          const responseText = response.text || "";
          let extracted;
          try {
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
          } catch {
            extracted = [];
          }

          await logExtraction(supabase, user.id, {
            questionsReturned: extracted.length,
            success: extracted.length > 0,
            errorMessage: extracted.length === 0 ? "No questions extracted from PDF" : undefined,
            usage: response.usageMetadata,
          });

          // Save and return early for PDF path
          if (extracted.length > 0 && sourceFileId) {
            await saveExtractedQuestions(supabase, extracted, user.id, sourceFileId);
          }
          return NextResponse.json({ extracted });
        } else {
          // Images — send to Gemini multimodally
          const buffer = await fileData.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const imageMime = fileName?.endsWith(".png") ? "image/png"
            : fileName?.endsWith(".webp") ? "image/webp"
            : "image/jpeg";

          const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
              {
                role: "user",
                parts: [
                  { inlineData: { mimeType: imageMime, data: base64 } },
                  { text: EXTRACTION_PROMPT + "\n[See the attached image above]" },
                ],
              },
            ],
          });

          const responseText = response.text || "";
          let extracted;
          try {
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
          } catch {
            extracted = [];
          }

          await logExtraction(supabase, user.id, {
            questionsReturned: extracted.length,
            success: extracted.length > 0,
            errorMessage: extracted.length === 0 ? "No questions extracted from image" : undefined,
            usage: response.usageMetadata,
          });

          if (extracted.length > 0 && sourceFileId) {
            await saveExtractedQuestions(supabase, extracted, user.id, sourceFileId);
          }
          return NextResponse.json({ extracted });
        }
      }
    }

    // Text-based extraction (DOCX text or direct text input)
    if (!inputText || !inputText.trim()) {
      inputText = `File: ${fileName || "unknown"}. Please generate 5 sample exam questions that would typically appear in a document with this name.`;
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: EXTRACTION_PROMPT + inputText,
    });

    const responseText = response.text || "";

    let extracted;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      extracted = [];
    }

    await logExtraction(supabase, user.id, {
      questionsReturned: extracted.length,
      success: extracted.length > 0,
      errorMessage: extracted.length === 0 ? "No questions extracted from text" : undefined,
      usage: response.usageMetadata,
    });

    if (extracted.length > 0 && sourceFileId) {
      await saveExtractedQuestions(supabase, extracted, user.id, sourceFileId);
    }

    return NextResponse.json({ extracted });
  } catch (err) {
    console.error("Extract error:", err);

    await logExtraction(supabase, user.id, {
      questionsReturned: 0,
      success: false,
      errorMessage: err instanceof Error ? err.message : "Extraction failed",
    });

    return NextResponse.json({
      extracted: [],
      error: "Extraction failed. The file may not contain recognizable exam questions.",
    });
  }
}

async function saveExtractedQuestions(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  extracted: Record<string, unknown>[],
  userId: string,
  sourceFileId: string
) {
  const questionsToInsert = extracted.map((q) => ({
    user_id: userId,
    source_file_id: sourceFileId,
    question_text: (q.question as string) || (q.question_text as string) || "",
    answer_key: (q.answer_key as string) || null,
    topic: (q.topic as string) || null,
    difficulty: (q.difficulty as string) || null,
    ib_band: (q.ib_band as number) || null,
    cognitive_level: (q.cognitive_level as string) || null,
    marks: (q.marks as number) || 0,
    language: "en",
  }));

  await supabase.from("question_bank").insert(questionsToInsert);

  await supabase
    .from("source_files")
    .update({ status: "processed" })
    .eq("id", sourceFileId);
}
