"use client";

import { useTranslations } from "next-intl";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useSaved, useToggleSaved } from "@/components/learning/use-learning";

/** Saves a lesson or problem for later; signed-out learners are asked to sign in. */
export function BookmarkButton({
  permalink,
  className,
}: {
  permalink: string;
  className?: string;
}) {
  const t = useTranslations("saved");
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useSaved();
  const toggle = useToggleSaved();
  const saved = data?.saved.includes(permalink) ?? false;

  const onClick = async () => {
    if (data && !data.signedIn) {
      toast(t("signIn"), {
        icon: "🔖",
        action: {
          label: t("signInAction"),
          onClick: () =>
            router.push({
              pathname: "/sign-in",
              query: { next: pathname, reason: "save" },
            }),
        },
      });
      return;
    }
    const result = await toggle(permalink, !saved);
    if (result.ok) {
      toast.success(result.saved ? t("savedToast") : t("removedToast"), {
        icon: result.saved ? "🔖" : undefined,
      });
    } else if (result.reason === "signed-out") {
      toast(t("signIn"));
    } else {
      toast.error(t("failed"));
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!data}
      aria-pressed={saved}
      aria-label={saved ? t("unsave") : t("save")}
      title={saved ? t("unsave") : t("save")}
      className={cn(
        "flex size-9 items-center justify-center rounded-full ring-1 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50",
        saved
          ? "bg-amber-300/15 text-amber-300 ring-amber-300/40 hover:bg-amber-300/25"
          : "text-white/60 ring-white/15 hover:bg-white/8 hover:text-white",
        className,
      )}
    >
      {saved ? (
        <BookmarkCheck className="size-4.5" />
      ) : (
        <Bookmark className="size-4.5" />
      )}
    </button>
  );
}
