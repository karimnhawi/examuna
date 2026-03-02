"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { WizardData } from "./exam-wizard";
import { ArrowRight } from "lucide-react";

const CURRICULA = [
  { value: "lebanese", key: "curriculumLebanese" },
  { value: "ib_myp", key: "curriculumIBMYP" },
  { value: "ib_dp", key: "curriculumIBDP" },
  { value: "american", key: "curriculumAmerican" },
  { value: "british", key: "curriculumBritish" },
  { value: "custom", key: "curriculumCustom" },
] as const;

const GRADES_STANDARD = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);
const GRADES_MYP = Array.from({ length: 5 }, (_, i) => `MYP Year ${i + 1}`);
const GRADES_DP = ["DP Year 1", "DP Year 2"];

function getGrades(curriculum: string) {
  if (curriculum === "ib_myp") return GRADES_MYP;
  if (curriculum === "ib_dp") return GRADES_DP;
  return GRADES_STANDARD;
}

function isIB(curriculum: string) {
  return curriculum === "ib_myp" || curriculum === "ib_dp";
}

interface Props {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  onNext: () => void;
}

export function StepSetup({ data, updateData, onNext }: Props) {
  const t = useTranslations("wizard");
  const [showErrors, setShowErrors] = useState(false);
  const grades = getGrades(data.curriculum);
  const showIB = isIB(data.curriculum);

  const canProceed = data.title.trim() && data.curriculum && data.grade && data.subject.trim();

  return (
    <Card className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("step1Title")}</h2>
        <p className="text-sm text-muted-foreground">{t("step1Desc")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Exam Title */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">{t("examTitle")}</label>
          <Input
            value={data.title}
            onChange={(e) => updateData({ title: e.target.value })}
            placeholder={t("examTitlePlaceholder")}
          />
          {showErrors && !data.title.trim() && (
            <p className="text-xs text-destructive">{t("required")}</p>
          )}
        </div>

        {/* Curriculum */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("curriculum")}</label>
          <select
            value={data.curriculum}
            onChange={(e) => updateData({ curriculum: e.target.value, grade: "" })}
            className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">{t("curriculumPlaceholder")}</option>
            {CURRICULA.map((c) => (
              <option key={c.value} value={c.value}>
                {t(c.key)}
              </option>
            ))}
          </select>
          {showErrors && !data.curriculum && (
            <p className="text-xs text-destructive">{t("required")}</p>
          )}
        </div>

        {/* Grade */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("grade")}</label>
          <select
            value={data.grade}
            onChange={(e) => updateData({ grade: e.target.value })}
            className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">{t("gradePlaceholder")}</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {showErrors && !data.grade && (
            <p className="text-xs text-destructive">{t("required")}</p>
          )}
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("subject")}</label>
          <Input
            value={data.subject}
            onChange={(e) => updateData({ subject: e.target.value })}
            placeholder={t("subjectPlaceholder")}
          />
          {showErrors && !data.subject.trim() && (
            <p className="text-xs text-destructive">{t("required")}</p>
          )}
        </div>

        {/* Language */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("language")}</label>
          <select
            value={data.language}
            onChange={(e) => updateData({ language: e.target.value as "en" | "ar" })}
            className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      </div>

      {/* IB Criteria */}
      {showIB && (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold">{t("ibCriteria")}</h3>
          {data.ibCriteria.map((ic, idx) => {
            const labels = {
              A: t("criterionA"),
              B: t("criterionB"),
              C: t("criterionC"),
              D: t("criterionD"),
            };
            return (
              <div key={ic.criterion} className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 min-w-[280px]">
                  <input
                    type="checkbox"
                    checked={ic.enabled}
                    onChange={(e) => {
                      const updated = [...data.ibCriteria];
                      updated[idx] = { ...updated[idx], enabled: e.target.checked };
                      updateData({ ibCriteria: updated });
                    }}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="text-sm">{labels[ic.criterion]}</span>
                </label>
                {ic.enabled && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{t("levelRange")}:</span>
                    <select
                      value={ic.levelMin}
                      onChange={(e) => {
                        const newMin = Number(e.target.value);
                        const updated = [...data.ibCriteria];
                        updated[idx] = {
                          ...updated[idx],
                          levelMin: newMin,
                          levelMax: Math.max(newMin, updated[idx].levelMax),
                        };
                        updateData({ ibCriteria: updated });
                      }}
                      className="h-8 rounded border border-border bg-white px-2 text-sm"
                    >
                      {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <span>-</span>
                    <select
                      value={ic.levelMax}
                      onChange={(e) => {
                        const newMax = Number(e.target.value);
                        const updated = [...data.ibCriteria];
                        updated[idx] = {
                          ...updated[idx],
                          levelMax: newMax,
                          levelMin: Math.min(newMax, updated[idx].levelMin),
                        };
                        updateData({ ibCriteria: updated });
                      }}
                      className="h-8 rounded border border-border bg-white px-2 text-sm"
                    >
                      {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end">
        <div onClick={() => { if (!canProceed) setShowErrors(true); }}>
          <Button onClick={onNext} disabled={!canProceed} className="gap-2">
            {t("next")} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
