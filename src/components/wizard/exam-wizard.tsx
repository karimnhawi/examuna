"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { StepSetup } from "./step-setup";
import { StepTopics } from "./step-topics";
import { StepMaterials } from "./step-materials";
import { StepGenerate } from "./step-generate";
import { StepExport } from "./step-export";
import { Check } from "lucide-react";

export interface IBCriterion {
  criterion: "A" | "B" | "C" | "D";
  levelMin: number;
  levelMax: number;
  enabled: boolean;
}

export interface Topic {
  id: string;
  name: string;
  chapter: string;
  weight: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  sourceFileId: string;
}

export interface Question {
  id: string;
  text: string;
  marks: number;
  topic?: string;
  difficulty?: string;
  cognitive_level?: string;
  answer_key?: string;
  ib_criterion?: string;
  ib_level?: number;
  source?: "bank" | "ai" | "template";
}

export interface WizardData {
  // Step 1
  title: string;
  curriculum: string;
  grade: string;
  subject: string;
  language: "en" | "ar";
  ibCriteria: IBCriterion[];
  // Step 2
  topics: Topic[];
  // Step 3
  referenceFileIds: string[];
  uploadedFiles: UploadedFile[];
  // Step 4
  questionCount: number;
  questions: Question[];
  // Step 5
  savedExamId: string | null;
}

const INITIAL_DATA: WizardData = {
  title: "",
  curriculum: "",
  grade: "",
  subject: "",
  language: "en",
  ibCriteria: [
    { criterion: "A", levelMin: 1, levelMax: 8, enabled: false },
    { criterion: "B", levelMin: 1, levelMax: 8, enabled: false },
    { criterion: "C", levelMin: 1, levelMax: 8, enabled: false },
    { criterion: "D", levelMin: 1, levelMax: 8, enabled: false },
  ],
  topics: [],
  referenceFileIds: [],
  uploadedFiles: [],
  questionCount: 8,
  questions: [],
  savedExamId: null,
};

const STEPS = [1, 2, 3, 4, 5] as const;

export function ExamWizard({
  locale,
  existingFiles,
}: {
  locale: string;
  existingFiles: { id: string; file_name: string }[];
}) {
  const t = useTranslations("wizard");
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    ...INITIAL_DATA,
    language: locale as "en" | "ar",
  });

  const updateData = (partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const stepTitles = [
    t("step1Title"),
    t("step2Title"),
    t("step3Title"),
    t("step4Title"),
    t("step5Title"),
  ];

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <nav className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => s < step && setStep(s)}
              disabled={s > step}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all ${
                s === step
                  ? "bg-primary text-primary-foreground shadow-md"
                  : s < step
                  ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </button>
            <span
              className={`hidden text-sm sm:inline ${
                s === step ? "font-medium" : "text-muted-foreground"
              }`}
            >
              {stepTitles[i]}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-px w-8 ${
                  s < step ? "bg-primary/40" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </nav>

      {/* Step content */}
      {step === 1 && (
        <StepSetup
          data={data}
          updateData={updateData}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <StepTopics
          data={data}
          updateData={updateData}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepMaterials
          data={data}
          updateData={updateData}
          existingFiles={existingFiles}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <StepGenerate
          data={data}
          updateData={updateData}
          onNext={() => setStep(5)}
          onBack={() => setStep(3)}
        />
      )}
      {step === 5 && (
        <StepExport
          data={data}
          updateData={updateData}
          locale={locale}
          onBack={() => setStep(4)}
          onDone={() => router.push(`/${locale}/dashboard`)}
        />
      )}
    </div>
  );
}
