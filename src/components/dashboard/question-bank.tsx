"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

interface BankQuestion {
  id: string;
  question_text: string;
  topic: string | null;
  difficulty: string | null;
  marks: number;
  cognitive_level: string | null;
}

export function QuestionBank() {
  const t = useTranslations("dashboard");
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicFilter, setTopicFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let query = supabase
      .from("question_bank")
      .select("id, question_text, topic, difficulty, marks, cognitive_level")
      .order("created_at", { ascending: false })
      .limit(50);

    if (topicFilter) query = query.eq("topic", topicFilter);
    if (difficultyFilter) query = query.eq("difficulty", difficultyFilter);

    query.then(({ data }) => {
      setQuestions(data || []);
      setLoading(false);
    });
  }, [topicFilter, difficultyFilter]);

  // Get unique topics/difficulties for filters
  const topics = [...new Set(questions.map((q) => q.topic).filter(Boolean))] as string[];
  const difficulties = [...new Set(questions.map((q) => q.difficulty).filter(Boolean))] as string[];

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="">{t("allTopics")}</option>
          {topics.map((tp) => (
            <option key={tp} value={tp}>
              {tp}
            </option>
          ))}
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="">{t("allDifficulties")}</option>
          {difficulties.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {questions.length === 0 ? (
        <Card className="py-8 text-center">
          <p className="text-sm text-muted-foreground">{t("noQuestions")}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <Card key={q.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm leading-relaxed line-clamp-2">
                  {q.question_text}
                </p>
                <div className="flex flex-shrink-0 gap-1">
                  {q.topic && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {q.topic}
                    </span>
                  )}
                  {q.difficulty && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        q.difficulty === "Hard"
                          ? "bg-destructive/10 text-destructive"
                          : q.difficulty === "Medium"
                          ? "bg-warning/10 text-warning"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  )}
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {q.marks} marks
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
