import * as React from "react";
import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import type { Tone } from "@/lib/tones";

function SectionHeading({
  className,
  eyebrow,
  eyebrowTone = "violet",
  title,
  description,
  align = "center",
  as: Heading = "h2",
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  eyebrow?: React.ReactNode;
  eyebrowTone?: Tone;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div
      data-slot="section-heading"
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
      {...props}
    >
      {eyebrow && (
        <Badge tone={eyebrowTone} dot>
          {eyebrow}
        </Badge>
      )}
      <Heading className="max-w-3xl text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
        {title}
      </Heading>
      {description && (
        <p className="max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}

export { SectionHeading };
