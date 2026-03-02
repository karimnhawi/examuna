"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { WizardData, Topic } from "./exam-wizard";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";

interface Props {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepTopics({ data, updateData, onNext, onBack }: Props) {
  const t = useTranslations("wizard");

  const addTopic = () => {
    updateData({
      topics: [
        ...data.topics,
        { id: crypto.randomUUID(), name: "", chapter: "", weight: 0 },
      ],
    });
  };

  const updateTopic = (id: string, partial: Partial<Topic>) => {
    updateData({
      topics: data.topics.map((tp) =>
        tp.id === id ? { ...tp, ...partial } : tp
      ),
    });
  };

  const removeTopic = (id: string) => {
    updateData({ topics: data.topics.filter((tp) => tp.id !== id) });
  };

  const canProceed = data.topics.length > 0 && data.topics.every((tp) => tp.name.trim());

  return (
    <Card className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("step2Title")}</h2>
        <p className="text-sm text-muted-foreground">{t("step2Desc")}</p>
      </div>

      {data.topics.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("noTopics")}</p>
      )}

      <div className="space-y-3">
        {data.topics.map((topic, idx) => (
          <div
            key={topic.id}
            className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("topicName")} {idx + 1}
              </label>
              <Input
                value={topic.name}
                onChange={(e) => updateTopic(topic.id, { name: e.target.value })}
                placeholder={t("topicNamePlaceholder")}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("chapter")}
              </label>
              <Input
                value={topic.chapter}
                onChange={(e) => updateTopic(topic.id, { chapter: e.target.value })}
                placeholder={t("chapterPlaceholder")}
              />
            </div>
            <div className="w-24 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("weight")}
              </label>
              <Input
                type="number"
                value={topic.weight || ""}
                onChange={(e) =>
                  updateTopic(topic.id, { weight: Number(e.target.value) })
                }
                min={0}
                max={100}
                placeholder="0"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeTopic(topic.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={addTopic} className="gap-2">
        <Plus className="h-4 w-4" /> {t("addTopic")}
      </Button>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t("back")}
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="gap-2">
          {t("next")} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
