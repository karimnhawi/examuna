import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini";

interface IBCriterion {
  criterion: string;
  levelMin: number;
  levelMax: number;
}

interface TopicInput {
  name: string;
  chapter?: string;
  weight?: number;
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
  const {
    title,
    curriculum,
    grade,
    subject = "General Science",
    language = "en",
    ibCriteria = [] as IBCriterion[],
    topics = [] as TopicInput[],
    referenceFileIds = [] as string[],
    questionCount: count = 5,
    convertFrom = null,
    // Legacy fields
    difficulty = "Mixed",
  } = body;

  const safeCount = Math.min(Math.max(1, Number(count) || 5), 20);
  const isEnhancedMode = !!(curriculum || topics.length > 0);

  // If not using enhanced mode, fall back to legacy behavior
  if (!isEnhancedMode) {
    return handleLegacyGenerate(supabase, subject, difficulty, safeCount, user.id);
  }

  // Enhanced generation with full criteria
  try {
    const ai = getGeminiClient();

    // ── 1. Deduplication: fetch all questions already used in past exams ──
    let usedQuestionsContext = "";
    const { data: pastExamQuestions } = await supabase
      .from("exam_questions")
      .select("custom_question_text, exam_id, exams!inner(user_id)")
      .limit(200);

    const { data: bankUsed } = await supabase
      .from("question_bank")
      .select("question_text")
      .gt("usage_count", 0)
      .order("usage_count", { ascending: false })
      .limit(100);

    const usedTexts = new Set<string>();
    if (pastExamQuestions) {
      for (const eq of pastExamQuestions) {
        if (eq.custom_question_text) {
          usedTexts.add(eq.custom_question_text.trim());
        }
      }
    }
    if (bankUsed) {
      for (const bq of bankUsed) {
        if (bq.question_text) {
          usedTexts.add(bq.question_text.trim());
        }
      }
    }

    if (usedTexts.size > 0) {
      const usedList = [...usedTexts].slice(0, 50);
      usedQuestionsContext = `\n\nPREVIOUSLY USED QUESTIONS — DO NOT repeat or closely paraphrase any of these. Generate completely new and original questions:\n${usedList
        .map((q, i) => `${i + 1}. ${q.length > 150 ? q.slice(0, 150) + "..." : q}`)
        .join("\n")}`;
    }

    // ── 2. Style learning: sample the teacher's question bank ──
    let styleContext = "";
    const { data: styleQuestions } = await supabase
      .from("question_bank")
      .select("question_text, topic, difficulty, marks, cognitive_level")
      .order("created_at", { ascending: false })
      .limit(30);

    if (styleQuestions && styleQuestions.length >= 3) {
      const avgMarks = Math.round(
        styleQuestions.reduce((sum, q) => sum + (q.marks || 0), 0) / styleQuestions.length
      );
      const diffCounts: Record<string, number> = {};
      const cognitiveCounts: Record<string, number> = {};
      for (const q of styleQuestions) {
        if (q.difficulty) diffCounts[q.difficulty] = (diffCounts[q.difficulty] || 0) + 1;
        if (q.cognitive_level) cognitiveCounts[q.cognitive_level] = (cognitiveCounts[q.cognitive_level] || 0) + 1;
      }
      const topDifficulty = Object.entries(diffCounts).sort((a, b) => b[1] - a[1]).map(([k]) => k);
      const topCognitive = Object.entries(cognitiveCounts).sort((a, b) => b[1] - a[1]).map(([k]) => k);

      const sample = styleQuestions.slice(0, 10);

      styleContext = `\n\nTEACHER'S STYLE PROFILE (learn from these patterns):
- Average marks per question: ${avgMarks}
- Preferred difficulty distribution: ${topDifficulty.join(", ")}
- Preferred cognitive levels: ${topCognitive.join(", ")}
- Sample questions from their past exams (match this writing style, tone, and complexity):
${sample.map((q, i) => `  ${i + 1}. [${q.topic || "General"}] (${q.difficulty || "?"}, ${q.marks}m) ${q.question_text.length > 200 ? q.question_text.slice(0, 200) + "..." : q.question_text}`).join("\n")}

IMPORTANT: Match the teacher's question style — similar sentence structure, phrasing patterns, and complexity level. But create ORIGINAL questions, not copies.`;
    }

    // ── 3. Build context from selected reference files ──
    let referenceContext = "";
    if (referenceFileIds.length > 0) {
      const { data: refQuestions } = await supabase
        .from("question_bank")
        .select("question_text, topic, difficulty, marks, cognitive_level")
        .in("source_file_id", referenceFileIds)
        .limit(20);

      if (refQuestions && refQuestions.length > 0) {
        referenceContext = `\n\nReference questions from uploaded materials (use these as style/level examples):\n${refQuestions
          .map((q, i) => `${i + 1}. [${q.topic || "General"}] (${q.difficulty || "Medium"}, ${q.marks} marks) ${q.question_text}`)
          .join("\n")}`;
      }
    }

    // ── 4. Handle conversion mode ──
    let conversionContext = "";
    if (convertFrom) {
      const { data: sourceQuestions } = await supabase
        .from("question_bank")
        .select("question_text, topic, difficulty, marks")
        .eq("source_file_id", convertFrom)
        .limit(20);

      if (sourceQuestions && sourceQuestions.length > 0) {
        conversionContext = `\n\nSOURCE EXAM TO CONVERT (adapt these questions to the target curriculum format):\n${sourceQuestions
          .map((q, i) => `${i + 1}. (${q.marks} marks) ${q.question_text}`)
          .join("\n")}`;
      }
    }

    // Build topics section
    const topicsSection = topics.length > 0
      ? `\nTopics to cover:\n${topics
          .map((tp: TopicInput) => `- ${tp.name}${tp.chapter ? ` (${tp.chapter})` : ""}${tp.weight ? ` [weight: ${tp.weight}%]` : ""}`)
          .join("\n")}`
      : "";

    // Build IB criteria section
    const ibSection = ibCriteria.length > 0
      ? `\nIB Assessment Criteria:\n${ibCriteria
          .map((c: IBCriterion) => `- Criterion ${c.criterion}: target achievement levels ${c.levelMin}-${c.levelMax}`)
          .join("\n")}`
      : "";

    // Build curriculum-specific pedagogy instructions
    const currLower = (curriculum || "").toLowerCase();
    const isIB = currLower.includes("ib") || currLower.includes("myp") || currLower.includes("dp");
    const isLebanese = currLower.includes("leban");

    let pedagogyBlock = "";
    if (isIB) {
      pedagogyBlock = `
IB EXAM WRITING RULES — follow these strictly:
- Use official IB command terms precisely: "State" (1-2 marks), "Describe" (2-3 marks), "Explain" (3-4 marks), "Analyse" (4-5 marks), "Evaluate" / "Discuss" / "To what extent" (5-8 marks)
- Each question MUST start with a command term — never start with "What" or "How" for higher-order questions
- Structure multi-part questions as (a), (b), (c) that scaffold from low to high cognitive demand
- Include stimulus material where appropriate: a short quote, data table, map, scenario, or case study description that students must interpret
- For Criterion A (Knowledge): test factual recall and conceptual understanding
- For Criterion B (Investigation): ask students to formulate research questions, collect/process data
- For Criterion C (Communication): require structured responses with subject-specific terminology
- For Criterion D (Critical Thinking): demand evaluation of perspectives, evidence-based arguments, justified conclusions
- Mark allocations must match cognitive demand: recall = 1-2 marks, application = 3-4 marks, analysis/evaluation = 5-8 marks
- Use real-world contexts and scenarios relevant to ${grade || "the grade level"} students`;
    } else if (isLebanese) {
      pedagogyBlock = `
LEBANESE CURRICULUM EXAM WRITING RULES:
- Follow the official Lebanese Brevet/Baccalaureate exam format
- Include both knowledge-based questions (definitions, short answers) and application questions
- Use clear, direct language appropriate for the grade level
- Structure: start with easier recall questions, progress to analysis and synthesis
- Include questions that reference specific textbook content and chapters where specified
- For Arabic-medium subjects, use formal Arabic (فصحى) with proper academic terminology
- Balance between objective questions (fill-in-the-blank, match) and subjective questions (explain, compare, discuss)`;
    } else {
      pedagogyBlock = `
EXAM WRITING BEST PRACTICES:
- Use precise command terms: "Define" (1 mark), "Describe" (2-3 marks), "Explain" (3-4 marks), "Compare and contrast" (4-5 marks), "Evaluate" / "Justify" (5-8 marks)
- Start each question with a clear command term — avoid vague phrasing like "Talk about" or "Tell us about"
- Include stimulus material where appropriate: a short scenario, quote, diagram description, or data that students must interpret before answering
- Structure multi-part questions that scaffold: part (a) tests recall, part (b) tests understanding, part (c) tests higher-order thinking
- Use real-world, age-appropriate contexts that make questions engaging and meaningful`;
    }

    const prompt = `You are a veteran ${subject} teacher with 20 years of experience writing exams for the ${curriculum || "general"} curriculum. You write questions that genuinely test student understanding, not questions that can be answered by copying a textbook sentence.

TASK: Generate ${safeCount} high-quality exam questions.

EXAM DETAILS:
- Title: ${title || subject}
- Curriculum: ${curriculum || "General"}
- Grade level: ${grade || "not specified"}
- Subject: ${subject}
- Language: ${language === "ar" ? "Arabic — write ALL question text in formal Arabic (فصحى)" : "English"}
${topicsSection}
${ibSection}
${pedagogyBlock}

QUESTION QUALITY REQUIREMENTS:
1. Every question must test a SPECIFIC learning objective — not vague general knowledge
2. Higher-mark questions (4+) MUST include context: a scenario, case study, data, quote, or real-world situation the student must analyze
3. Vary question types: some short-answer, some structured multi-part, some extended response
4. Answer keys must be detailed enough for a substitute teacher to mark accurately — include key points, acceptable alternatives, and mark breakdown
5. Questions should be something a student CANNOT answer by just Googling — they must demonstrate understanding
6. Use age-appropriate vocabulary and scenarios for ${grade || "the specified grade level"}
${referenceContext}
${styleContext}
${usedQuestionsContext}
${conversionContext}

${convertFrom ? "IMPORTANT: You are converting an existing exam to a new format. Adapt the source questions to match the target curriculum and criteria while preserving the content/topics." : ""}

Use Google Search to look up the latest ${curriculum || ""} curriculum guide, subject guide, and official assessment criteria for ${subject}${grade ? ` at ${grade} level` : ""}. Base your questions on real curriculum content and learning objectives — not generic textbook knowledge.

OUTPUT FORMAT — return ONLY a valid JSON array, no markdown or code blocks. Each object must have:
- "text": The full question text (including any stimulus material, context, and all sub-parts)${language === "ar" ? " — written entirely in Arabic" : ""}
- "marks": Point value (integer, 2-8) — must match the cognitive demand
- "topic": The specific topic from the topics list
- "difficulty": "Easy", "Medium", or "Hard"
- "cognitive_level": One of "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"
- "answer_key": Detailed model answer with mark breakdown (e.g., "1 mark for identifying X, 2 marks for explaining Y with an example, 1 mark for linking to Z")
${ibCriteria.length > 0 ? '- "ib_criterion": The IB criterion letter (A, B, C, or D) this question assesses\n- "ib_level": The target achievement level (integer)' : ""}

Distribute questions across the topics${topics.some((t: TopicInput) => t.weight) ? " according to their weights" : " roughly equally"}.
${ibCriteria.length > 0 ? "Distribute questions across the specified IB criteria." : ""}
Include a MIX of difficulty levels: roughly 30% Easy, 50% Medium, 20% Hard.`;

    console.log("[generate] Calling Gemini API with model:", GEMINI_MODEL);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const responseText = response.text || "";
    console.log("[generate] Gemini response length:", responseText.length);
    console.log("[generate] Gemini response preview:", responseText.slice(0, 300));

    // Extract token usage from response
    const usage = response.usageMetadata;

    let questions;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("[generate] No JSON array found in Gemini response. Full response:", responseText.slice(0, 1000));
      }
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      questions = parsed.map((q: Record<string, unknown>, i: number) => ({
        id: crypto.randomUUID(),
        text: q.text || q.question || `Question ${i + 1}`,
        marks: q.marks || 4,
        topic: q.topic || subject,
        difficulty: q.difficulty || "Medium",
        cognitive_level: q.cognitive_level || "Apply",
        answer_key: q.answer_key || "",
        ib_criterion: q.ib_criterion || null,
        ib_level: q.ib_level || null,
        source: "ai" as const,
      }));
      console.log("[generate] Successfully parsed", questions.length, "AI questions");
    } catch (parseErr) {
      console.error("[generate] JSON parse error:", parseErr);
      console.error("[generate] Raw response:", responseText.slice(0, 1000));

      // Log failed generation
      await supabase.from("generation_logs").insert({
        user_id: user.id,
        endpoint: "generate",
        model: GEMINI_MODEL,
        subject,
        curriculum: curriculum || null,
        grade: grade || null,
        language,
        questions_requested: safeCount,
        questions_returned: 0,
        success: false,
        error_message: "JSON parse error: AI returned invalid response",
        prompt_tokens: usage?.promptTokenCount ?? null,
        output_tokens: usage?.candidatesTokenCount ?? null,
        total_tokens: usage?.totalTokenCount ?? null,
        google_search_used: true,
      });

      return NextResponse.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 502 }
      );
    }

    // Log successful generation
    await supabase.from("generation_logs").insert({
      user_id: user.id,
      endpoint: "generate",
      model: GEMINI_MODEL,
      subject,
      curriculum: curriculum || null,
      grade: grade || null,
      language,
      questions_requested: safeCount,
      questions_returned: questions.length,
      success: true,
      prompt_tokens: usage?.promptTokenCount ?? null,
      output_tokens: usage?.candidatesTokenCount ?? null,
      total_tokens: usage?.totalTokenCount ?? null,
      google_search_used: true,
    });

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[generate] Gemini API call FAILED:", err);

    // Log API failure
    await supabase.from("generation_logs").insert({
      user_id: user.id,
      endpoint: "generate",
      model: GEMINI_MODEL,
      subject,
      curriculum: curriculum || null,
      grade: grade || null,
      language,
      questions_requested: safeCount,
      questions_returned: 0,
      success: false,
      error_message: err instanceof Error ? err.message : "Gemini API call failed",
      google_search_used: true,
    }).then(() => {}, () => {}); // don't let logging failure mask the real error

    return NextResponse.json(
      { error: "Question generation is temporarily unavailable. Please try again in a moment." },
      { status: 503 }
    );
  }
}

async function handleLegacyGenerate(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  subject: string,
  difficulty: string,
  safeCount: number,
  userId?: string,
) {
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

    for (const q of bankQuestions) {
      await supabase
        .from("question_bank")
        .update({ usage_count: (q.usage_count ?? 0) + 1 })
        .eq("id", q.id);
    }

    return NextResponse.json({ questions });
  }

  // Fallback: generate with Gemini AI + Google Search grounding
  try {
    const ai = getGeminiClient();

    const prompt = `You are a veteran ${subject} teacher writing an exam. Generate ${safeCount} high-quality exam questions at ${difficulty} difficulty.

QUESTION QUALITY REQUIREMENTS:
- Each question must test a SPECIFIC concept — not vague general knowledge
- Use precise command terms: "Define" (1m), "Describe" (2-3m), "Explain" (3-4m), "Evaluate" (5-8m)
- Higher-mark questions (4+) MUST include a real-world scenario, case study, or data that students must analyze
- Vary question types: short-answer, structured multi-part, and extended response
- Answer keys must include key points and mark breakdown so any teacher can mark them
- Questions should require genuine understanding — not just memorization

Use Google Search to look up the latest curriculum standards and subject content for ${subject} to ensure questions are accurate and aligned with real learning objectives.

Return ONLY a valid JSON array (no markdown, no code blocks). Each object:
- "text": Full question text including any stimulus/context and sub-parts
- "marks": Point value (integer, 2-8) matching cognitive demand
- "topic": The specific topic
- "difficulty": "${difficulty === "Mixed" ? "Easy/Medium/Hard mix" : difficulty}"
- "cognitive_level": One of "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"
- "answer_key": Detailed model answer with mark breakdown (e.g. "1 mark for X, 2 marks for explaining Y with example")`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const responseText = response.text || "";
    const usage = response.usageMetadata;

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
    } catch (parseErr) {
      console.error("[generate:legacy] JSON parse error:", parseErr);

      if (userId) {
        await supabase.from("generation_logs").insert({
          user_id: userId,
          endpoint: "generate",
          model: GEMINI_MODEL,
          subject,
          language: "en",
          questions_requested: safeCount,
          questions_returned: 0,
          success: false,
          error_message: "JSON parse error: AI returned invalid response",
          prompt_tokens: usage?.promptTokenCount ?? null,
          output_tokens: usage?.candidatesTokenCount ?? null,
          total_tokens: usage?.totalTokenCount ?? null,
          google_search_used: true,
        });
      }

      return NextResponse.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 502 }
      );
    }

    if (userId) {
      await supabase.from("generation_logs").insert({
        user_id: userId,
        endpoint: "generate",
        model: GEMINI_MODEL,
        subject,
        language: "en",
        questions_requested: safeCount,
        questions_returned: questions.length,
        success: true,
        prompt_tokens: usage?.promptTokenCount ?? null,
        output_tokens: usage?.candidatesTokenCount ?? null,
        total_tokens: usage?.totalTokenCount ?? null,
        google_search_used: true,
      });
    }

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[generate:legacy] Gemini API call FAILED:", err);

    if (userId) {
      await supabase.from("generation_logs").insert({
        user_id: userId,
        endpoint: "generate",
        model: GEMINI_MODEL,
        subject,
        language: "en",
        questions_requested: safeCount,
        questions_returned: 0,
        success: false,
        error_message: err instanceof Error ? err.message : "Gemini API call failed",
        google_search_used: true,
      }).then(() => {}, () => {});
    }

    return NextResponse.json(
      { error: "Question generation is temporarily unavailable. Please try again in a moment." },
      { status: 503 }
    );
  }
}
