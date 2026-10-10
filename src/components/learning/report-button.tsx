"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { CheckCircle2, Flag, Loader2, XIcon } from "lucide-react";
import { cn } from "cn";

import { reportProblem } from "@/app/actions/report";
import { Button } from "@/components/ui/button";
import {
  MESSAGE_MAX,
  MESSAGE_MIN,
  reportCategories,
  type ReportCategory,
} from "@/lib/report-format";

/** "Report a problem" under a lesson or practice problem. */
export function ReportButton({ permalink }: { permalink: string }) {
  const t = useTranslations("report");
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<ReportCategory>("typo");
  const [message, setMessage] = React.useState("");
  const [state, setState] = React.useState<
    "idle" | "sending" | "sent" | "invalid" | "rate-limited" | "failed"
  >("idle");
  const honeypot = React.useRef<HTMLInputElement>(null);

  function changeOpen(next: boolean) {
    setOpen(next);
    // Start fresh after a report went through.
    if (!next && state === "sent") {
      setMessage("");
      setCategory("typo");
      setState("idle");
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (message.trim().length < MESSAGE_MIN) {
      setState("invalid");
      return;
    }
    setState("sending");
    const result = await reportProblem({
      permalink,
      category,
      message,
      locale,
      website: honeypot.current?.value,
    }).catch(() => ({ ok: false as const, reason: "failed" as const }));
    setState(result.ok ? "sent" : result.reason);
  }

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Trigger className="inline-flex items-center gap-2 self-start rounded-lg px-2 py-1 text-sm text-white/45 transition hover:bg-white/6 hover:text-white/80 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
        <Flag className="size-4" /> {t("button")}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-space-950/60 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-2xl p-5 text-white glass-strong data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="flex items-center gap-2 text-lg font-semibold">
                <Flag className="size-5 text-pink-300" /> {t("title")}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-white/60">
                {t("intro")}
              </Dialog.Description>
            </div>
            <Dialog.Close className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
              <XIcon className="size-4" />
              <span className="sr-only">{t("close")}</span>
            </Dialog.Close>
          </div>

          {state === "sent" ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="size-10 text-lime-300" />
              <p className="font-medium">{t("thanks")}</p>
              <p className="text-sm text-white/60">{t("thanksText")}</p>
              <Dialog.Close asChild>
                <Button variant="glass">{t("close")}</Button>
              </Dialog.Close>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-medium text-white/80">
                  {t("whatsWrong")}
                </legend>
                {reportCategories.map((c) => (
                  <label
                    key={c}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition",
                      category === c
                        ? "border-neon-violet/60 bg-neon-violet/15 text-white"
                        : "border-white/10 bg-white/4 text-white/75 hover:bg-white/6",
                    )}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={c}
                      checked={category === c}
                      onChange={() => setCategory(c)}
                      className="accent-violet-400"
                    />
                    {t(`categories.${c}`)}
                  </label>
                ))}
              </fieldset>
              <label className="flex flex-col gap-2 text-sm font-medium text-white/80">
                {t("details")}
                <textarea
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    if (state === "invalid") setState("idle");
                  }}
                  maxLength={MESSAGE_MAX}
                  rows={4}
                  placeholder={t("placeholder")}
                  className="resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-normal text-white placeholder:text-white/35 focus:border-neon-violet/60 focus:outline-none"
                />
              </label>
              {/* Hidden from people: bots fill in every field they find. */}
              <input
                ref={honeypot}
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="absolute -left-[9999px] size-px opacity-0"
              />
              <p className="text-xs text-white/45">{t("public")}</p>
              {state !== "idle" && state !== "sending" && (
                <p role="alert" className="text-sm text-pink-300">
                  {t(`errors.${state}`)}
                </p>
              )}
              <Button
                type="submit"
                variant="gradient"
                disabled={state === "sending"}
                className="self-end"
              >
                {state === "sending" && <Loader2 className="animate-spin" />}
                {t("send")}
              </Button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
