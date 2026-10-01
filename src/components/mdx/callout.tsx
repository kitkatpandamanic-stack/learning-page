import type { ReactNode } from "react";
import {
  AlertTriangle,
  Info,
  Lightbulb,
  OctagonAlert,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";

const variants: Record<
  "note" | "tip" | "warning" | "danger",
  { icon: LucideIcon; label: string; className: string; iconClass: string }
> = {
  note: {
    icon: Info,
    label: "note",
    className: "border-neon-cyan/35 bg-neon-cyan/8",
    iconClass: "text-cyan-300",
  },
  tip: {
    icon: Lightbulb,
    label: "tip",
    className: "border-neon-lime/35 bg-neon-lime/8",
    iconClass: "text-lime-300",
  },
  warning: {
    icon: AlertTriangle,
    label: "warning",
    className: "border-neon-amber/35 bg-neon-amber/8",
    iconClass: "text-amber-300",
  },
  danger: {
    icon: OctagonAlert,
    label: "danger",
    className: "border-rose-400/40 bg-rose-400/10",
    iconClass: "text-rose-300",
  },
};

export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: keyof typeof variants;
  title?: string;
  children: ReactNode;
}) {
  const v = variants[type];
  const t = useTranslations("lesson.callout");
  const Icon = v.icon;

  return (
    <aside
      className={cn(
        "not-prose my-6 flex gap-3 rounded-2xl border px-4 py-3.5 backdrop-blur-md",
        v.className,
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", v.iconClass)} />
      <div className="min-w-0 text-[0.95rem] leading-relaxed text-white/85 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_p]:my-1">
        <p className={cn("font-semibold", v.iconClass)}>
          {title ?? t(v.label as keyof typeof variants)}
        </p>
        {children}
      </div>
    </aside>
  );
}
