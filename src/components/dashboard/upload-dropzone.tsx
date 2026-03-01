"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UploadDropzone() {
  const [status, setStatus] = useState<string>("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    setStatus(data.message || "Uploaded");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"]
    }
  });

  return (
    <div {...getRootProps()} className={`rounded-xl border-2 border-dashed p-8 text-center transition ${isDragActive ? "border-primary bg-blue-50" : "border-border"}`}>
      <input {...getInputProps()} />
      <UploadCloud className="mx-auto mb-4 h-8 w-8 text-primary" />
      <p className="mb-2 font-medium">Drop PDF, Word or image files here</p>
      <p className="mb-4 text-sm text-muted-foreground">Examuna will extract and tag questions automatically.</p>
      <Button type="button">Choose file</Button>
      {status ? <p className="mt-3 text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
