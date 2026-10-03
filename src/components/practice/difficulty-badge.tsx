import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { Difficulty } from "@/lib/practice-meta";
import type { Tone } from "@/lib/tones";

export const difficultyTone: Record<Difficulty, Tone> = {
  easy: "lime",
  medium: "amber",
  hard: "pink",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const t = useTranslations("practice.difficulty");
  return (
    <Badge tone={difficultyTone[difficulty]} dot>
      {t(difficulty)}
    </Badge>
  );
}
