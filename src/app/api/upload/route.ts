import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const path = `uploads/${Date.now()}-${file.name}`;
  const { error } = await supabaseAdmin.storage.from("test-bank-files").upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: false
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "File uploaded successfully", path });
}
