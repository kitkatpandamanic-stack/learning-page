import { getTranslations } from "next-intl/server";
import { Bell, Send, Trophy } from "lucide-react";
import { cn } from "cn";

import {
  connectTelegram,
  disconnectTelegram,
  setTelegramOption,
} from "@/app/actions/telegram";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import type { Locale } from "@/lib/i18n";
import type { TelegramLink } from "@/lib/telegram/links";

/** Profile card: link Telegram to the bot, then choose reminders and the leaderboard. */
export async function TelegramCard({
  link,
  locale,
  bot,
}: {
  link: TelegramLink | null;
  locale: Locale;
  bot: string;
}) {
  const t = await getTranslations("profile.telegram");

  return (
    <GlassCard className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <Send className="size-5 text-sky-300" /> {t("title")}
      </h2>
      {link ? (
        <>
          <p className="text-white/75">
            {link.username
              ? t.rich("connectedAs", {
                  name: `@${link.username}`,
                  bot: `@${bot}`,
                  b: (chunks) => (
                    <span className="font-semibold text-white">{chunks}</span>
                  ),
                })
              : t.rich("connected", {
                  bot: `@${bot}`,
                  b: (chunks) => (
                    <span className="font-semibold text-white">{chunks}</span>
                  ),
                })}
          </p>
          <div className="flex flex-col gap-3">
            <Option
              option="reminders"
              on={link.reminders}
              locale={locale}
              icon={<Bell className="size-4 text-amber-300" />}
              label={t("reminders")}
              hint={t("remindersHint")}
            />
            <Option
              option="leaderboard"
              on={link.leaderboard}
              locale={locale}
              icon={<Trophy className="size-4 text-lime-300" />}
              label={t("leaderboard")}
              hint={t("leaderboardHint")}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="glass">
              <a href={`https://t.me/${bot}`} target="_blank" rel="noreferrer">
                {t("openBot")}
              </a>
            </Button>
            <form action={disconnectTelegram}>
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="ghost" className="text-white/60">
                {t("disconnect")}
              </Button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md text-white/75">{t("intro")}</p>
          <form action={connectTelegram}>
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="glass" size="lg">
              <Send /> {t("connect")}
            </Button>
          </form>
        </div>
      )}
    </GlassCard>
  );
}

function Option({
  option,
  on,
  locale,
  icon,
  label,
  hint,
}: {
  option: "reminders" | "leaderboard";
  on: boolean;
  locale: Locale;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <form
      action={setTelegramOption}
      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/4 px-4 py-3"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="option" value={option} />
      <input type="hidden" name="value" value={on ? "off" : "on"} />
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-2 font-medium text-white">
          {icon} {label}
        </span>
        <span className="text-sm text-white/55">{hint}</span>
      </div>
      <button
        type="submit"
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border transition",
          on
            ? "border-neon-violet/60 bg-neon-violet/50"
            : "border-white/15 bg-white/10",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5.5 rounded-full bg-white shadow transition-all",
            on ? "left-[1.4rem]" : "left-0.5",
          )}
        />
      </button>
    </form>
  );
}
