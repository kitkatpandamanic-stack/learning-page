"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ListTree } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Course outline in a slide-out sheet for screens without the sidebar. */
export function MobileContents({ children }: { children: ReactNode }) {
  const t = useTranslations("lesson");
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="glass" size="lg" className="px-4 lg:hidden">
          <ListTree /> {t("courseContents")}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[85%] overflow-y-auto border-r-white/10 bg-transparent p-5 glass-strong"
      >
        <SheetTitle className="mb-2 text-white">
          {t("courseContents")}
        </SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
