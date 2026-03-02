"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { WizardData } from "./exam-wizard";
import {
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  Loader2,
  FileText,
  Check,
  SkipForward,
} from "lucide-react";

interface Props {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  existingFiles: { id: string; file_name: string }[];
  onNext: () => void;
  onBack: () => void;
}

export function StepMaterials({
  data,
  updateData,
  existingFiles,
  onNext,
  onBack,
}: Props) {
  const t = useTranslations("wizard");
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      setUploading(true);

      try {
        const newFiles = [...data.uploadedFiles];
        const newIds = [...data.referenceFileIds];

        for (const file of acceptedFiles) {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: form });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Upload failed");
          }
          const result = await res.json();
          newFiles.push({
            id: result.sourceFileId,
            name: file.name,
            sourceFileId: result.sourceFileId,
          });
          newIds.push(result.sourceFileId);
        }

        updateData({ uploadedFiles: newFiles, referenceFileIds: newIds });
        toast.success(`${acceptedFiles.length} file(s) uploaded`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [data.uploadedFiles, data.referenceFileIds, updateData]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    disabled: uploading,
  });

  const toggleExistingFile = (file: { id: string; file_name: string }) => {
    const isSelected = data.referenceFileIds.includes(file.id);
    if (isSelected) {
      updateData({
        referenceFileIds: data.referenceFileIds.filter((id) => id !== file.id),
      });
    } else {
      updateData({
        referenceFileIds: [...data.referenceFileIds, file.id],
      });
    }
  };

  return (
    <Card className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("step3Title")}</h2>
        <p className="text-sm text-muted-foreground">{t("step3Desc")}</p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        } ${uploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">{t("uploading")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <UploadCloud className="mx-auto h-8 w-8 text-primary" />
            <p className="text-sm font-medium">{t("uploadArea")}</p>
            <p className="text-xs text-muted-foreground">{t("uploadHint")}</p>
            <Button type="button" variant="outline" size="sm">
              {t("chooseFiles")}
            </Button>
          </div>
        )}
      </div>

      {/* Uploaded files in this session */}
      {data.uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Uploaded files</h3>
          {data.uploadedFiles.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2 rounded-lg border border-border p-2"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="truncate text-sm">{f.name}</span>
              <Check className="ml-auto h-4 w-4 text-green-600" />
            </div>
          ))}
        </div>
      )}

      {/* Previously uploaded files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t("previousFiles")}</h3>
          {existingFiles.map((f) => {
            const selected = data.referenceFileIds.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggleExistingFile(f)}
                className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left transition-all ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="truncate text-sm">{f.file_name}</span>
                {selected && (
                  <Check className="ml-auto h-4 w-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t("back")}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onNext} className="gap-2">
            <SkipForward className="h-4 w-4" /> {t("skipStep")}
          </Button>
          <Button onClick={onNext} className="gap-2">
            {t("next")} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
