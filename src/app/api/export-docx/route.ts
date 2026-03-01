import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Examuna Generated Exam";

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "Examuna", heading: HeadingLevel.TITLE }),
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph("1) Explain one key concept from your unit and support your answer with evidence."),
          new Paragraph("2) Compare two methods used in this course and evaluate which is more effective."),
          new Paragraph("3) Provide a model answer outline for teachers.")
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${title.replace(/\s+/g, "-").toLowerCase()}.docx"`
    }
  });
}
