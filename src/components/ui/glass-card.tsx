import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

const glassCardVariants = cva("relative rounded-2xl text-card-foreground", {
  variants: {
    variant: {
      default: "glass",
      strong: "glass-strong",
    },
    glow: {
      none: "",
      violet: "shadow-glow-violet",
      cyan: "shadow-glow-cyan",
      pink: "shadow-glow-pink",
      lime: "shadow-glow-lime",
      amber: "shadow-glow-amber",
    },
    interactive: {
      true: "transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-glow-violet",
      false: "",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: {
    variant: "default",
    glow: "none",
    interactive: false,
    padding: "md",
  },
});

function GlassCard({
  className,
  variant,
  glow,
  interactive,
  padding,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof glassCardVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="glass-card"
      className={cn(
        glassCardVariants({ variant, glow, interactive, padding }),
        className,
      )}
      {...props}
    />
  );
}

export { GlassCard, glassCardVariants };
