import * as React from "react";
import { cn } from "cn";

function GradientText({
  className,
  variant = "brand",
  ...props
}: React.ComponentProps<"span"> & { variant?: "brand" | "cool" }) {
  return (
    <span
      data-slot="gradient-text"
      className={cn(
        variant === "brand" ? "text-gradient" : "text-gradient-cool",
        className,
      )}
      {...props}
    />
  );
}

export { GradientText };
