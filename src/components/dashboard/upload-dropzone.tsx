"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslations } from "next-intl";
import { UploadCloud, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ExtractedQuestion {
  question: string;
  topic: string;
  difficulty: string;
  ib_band: number;
  cognitive_level: string;
}

export function UploadDropzone({ locale }: { locale: string }) {
  const t = useTranslations("upload");
  const [status, setStatus] = useState<"idle" | "uploading" | "extracting" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [extracted, setExtracted] = useState<ExtractedQuestion[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is too large. Maximum size is 10MB.");
      return;
    }

    setStatus("uploading");
    setProgress(0);
    setExtracted([]);

    try {
      // Upload file
      const form = new FormData();
      form.append("file", file);

      // Simulate progress (real progress requires XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 200);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      clearInterval(progressInterval);
      setProgress(100);

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Upload failed");
      }

      const uploadData = await uploadRes.json();
      toast.success(t("uploaded"));

      // Extract questions
      setStatus("extracting");
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: uploadData.path,
          fileName: file.name,
          sourceFileId: uploadData.sourceFileId,
        }),
      });

      if (!extractRes.ok) {
        throw new Error("Extraction failed");
      }

      const extractData = await extractRes.json();
      const questions = extractData.extracted || [];
      setExtracted(questions);
      setStatus("done");

      if (questions.length > 0) {
        toast.success(`${questions.length} ${t("extracted")}`);
      }
    } catch (err) {
      setStatus("error");
      toast.error(err instanceof Error ? err.message : t("error"));
    }
  }, [t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
    disabled: status === "uploading" || status === "extracting",
  });

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
          isDragActive
            ? "border-primary bg-primary/5"
            : status === "error"
            ? "border-destructive/50 bg-destructive/5"
            : status === "done"
            ? "border-success/50 bg-success/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        } ${(status === "uploading" || status === "extracting") ? "pointer-events-none opacity-70" : ""}`}
      >
        <input {...getInputProps()} />

        {status === "uploading" ? (
          <div className="space-y-3">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="font-medium">{t("uploading")}</p>
            <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : status === "extracting" ? (
          <div className="space-y-3">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="font-medium">{t("extracting")}</p>
          </div>
        ) : status === "done" ? (
          <div className="space-y-3">
            <CheckCircle className="mx-auto h-8 w-8 text-success" />
            <p className="font-medium">{extracted.length} {t("extracted")}</p>
            <p className="text-sm text-muted-foreground">Drop another file to continue.</p>
          </div>
        ) : status === "error" ? (
          <div className="space-y-3">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="font-medium">{t("error")}</p>
            <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setStatus("idle"); }}>
              {t("chooseFile")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <UploadCloud className="mx-auto h-8 w-8 text-primary" />
            <p className="font-medium">{t("dropzone")}</p>
            <p className="text-sm text-muted-foreground">{t("dropzoneHint")}</p>
            <Button type="button" variant="outline">{t("chooseFile")}</Button>
          </div>
        )}
      </div>

      {/* Show extracted questions */}
      {extracted.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Extracted Questions</h3>
          {extracted.map((q, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-muted-foreground">
                    Q{i + 1} &middot; {q.topic} &middot; {q.difficulty} &middot; Band {q.ib_band}
                  </p>
                  <p className="text-sm">{q.question}</p>
                </div>
                <span className="flex-shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {q.cognitive_level}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
