import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { subject = "General Science", difficulty = "Mixed", count = 5 } = await req.json();

  const questions = Array.from({ length: count }).map((_, i) => ({
    id: crypto.randomUUID(),
    text: `${subject}: (${difficulty}) Design a structured response for learning objective ${i + 1}. Include one short explanation and one evaluative point.`,
    marks: i % 2 === 0 ? 6 : 4
  }));

  return NextResponse.json({ questions });
}
