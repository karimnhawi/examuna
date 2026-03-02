import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Examuna - Build High-Quality Exams in Minutes", template: "%s | Examuna" },
  description: "Upload test banks, let AI extract and tag questions, then generate polished exams and answer keys for your students.",
  keywords: ["exam builder", "AI exam generator", "test bank", "IB exams", "teacher tools"],
  metadataBase: new URL("https://examuna.com"),
  openGraph: {
    title: "Examuna - Build High-Quality Exams in Minutes",
    description: "Upload test banks, let AI extract and tag questions, then generate polished exams.",
    url: "https://examuna.com",
    siteName: "Examuna",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
