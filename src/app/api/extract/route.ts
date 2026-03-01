import { NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Extract up to 10 exam questions from this text and return JSON array with fields: question, topic, difficulty, ib_band, cognitive_level. Text: ${text}`
    );

    return NextResponse.json({ extracted: result.response.text() });
  } catch {
    return NextResponse.json({
      extracted: [
        { question: "Explain the process of osmosis in plant cells.", topic: "Cell Biology", difficulty: "Medium", ib_band: 5, cognitive_level: "Apply" }
      ],
      mode: "fallback"
    });
  }
}
