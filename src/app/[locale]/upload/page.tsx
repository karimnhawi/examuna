import { UploadDropzone } from "@/components/dashboard/upload-dropzone";

export default function UploadPage() {
  return (
    <main className="container py-10">
      <h1 className="mb-2 text-3xl font-semibold">Upload Test Bank</h1>
      <p className="mb-8 text-muted-foreground">Add your source files so Examuna can extract, tag and organize your questions.</p>
      <UploadDropzone />
    </main>
  );
}
