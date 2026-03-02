import { getTranslations } from "next-intl/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { Navbar } from "@/components/layout/navbar";
import { UploadDropzone } from "@/components/dashboard/upload-dropzone";
import { Card } from "@/components/ui/card";
import { FileText, Clock } from "lucide-react";

export default async function UploadPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  const t = await getTranslations("upload");
  const supabase = getSupabaseServerClient();

  const { data: files } = await supabase
    .from("source_files")
    .select("id, file_name, mime_type, status, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={locale} />
      <main className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <UploadDropzone locale={locale} />
          </div>

          <div className="lg:col-span-2">
            <Card>
              <h2 className="mb-4 text-lg font-semibold">{t("filesTitle")}</h2>
              {!files || files.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noFiles")}</p>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">{file.mime_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          file.status === "processed"
                            ? "bg-success/10 text-success"
                            : file.status === "processing"
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {file.status}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(file.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
