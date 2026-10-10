"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "cn";
import {
  ArrowRight,
  LayoutDashboard,
  LogOut,
  Menu,
  SearchIcon,
  UserRound,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import {
  UserAvatar,
  UserMenu,
  useSignOut,
} from "@/components/layout/user-menu";
import {
  Kbd,
  loadSearchIndex,
  SearchDialog,
} from "@/components/search/search-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";
import { mainNav } from "@/lib/site";

const subscribeNothing = () => () => {};

export function Navbar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const ts = useTranslations("search");
  const locale = useLocale();
  const [searchOpen, setSearchOpen] = React.useState(false);
  // "⌘K" on Apple devices, "Ctrl K" elsewhere (known only in the browser).
  const isMac = React.useSyncExternalStore(
    subscribeNothing,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => true,
  );
  // Start downloading the index as soon as someone reaches for search.
  const prefetchSearch = () => void loadSearchIndex(locale).catch(() => {});
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const handleSignOut = useSignOut();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    !href.includes("#") &&
    (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <nav
        aria-label={t("main")}
        className={cn(
          "mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 transition-all duration-300 sm:px-5",
          scrolled ? "glass-strong" : "glass",
        )}
      >
        <Link
          href="/"
          aria-label={t("home")}
          className="rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {mainNav.map((link) => (
            <li
              key={link.href}
              className={cn(link.wideOnly && "hidden lg:block")}
            >
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap text-white/70 transition-colors hover:bg-white/8 hover:text-white",
                  "aria-[current=page]:bg-white/10 aria-[current=page]:text-white",
                )}
              >
                {t(link.label as Parameters<typeof t>[0])}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            onPointerEnter={prefetchSearch}
            onFocus={prefetchSearch}
            aria-label={ts("open")}
            aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
            className="flex size-9 items-center justify-center gap-2 rounded-full text-sm text-white/70 ring-1 ring-white/12 transition-colors hover:bg-white/8 hover:text-white focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none xl:w-auto xl:px-3"
          >
            <SearchIcon className="size-4" />
            <span className="hidden xl:inline">{ts("open")}</span>
            <Kbd className="hidden xl:inline">{isMac ? "⌘K" : "Ctrl K"}</Kbd>
          </button>
          <LanguageSwitcher />
          {isPending ? (
            <span
              aria-hidden
              className="size-9 animate-pulse rounded-full bg-white/10"
            />
          ) : user ? (
            <>
              <Button asChild variant="gradient" size="lg" className="px-5">
                <Link href="/dashboard">
                  {t("continueLearning")} <ArrowRight />
                </Link>
              </Button>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="rounded-full px-4 text-white/80"
              >
                <Link href="/sign-in">{t("signIn")}</Link>
              </Button>
              <Button asChild variant="gradient" size="lg" className="px-5">
                <Link href="/languages">
                  {t("startLearning")} <ArrowRight />
                </Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="glass"
            size="icon-lg"
            aria-label={ts("open")}
            onClick={() => setSearchOpen(true)}
            onPointerDown={prefetchSearch}
          >
            <SearchIcon />
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="glass" size="icon-lg" aria-label={t("openMenu")}>
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[85%] border-l-white/10 bg-transparent p-6 glass-strong"
            >
              <SheetTitle asChild>
                <span>
                  <Logo />
                </span>
              </SheetTitle>
              <ul className="mt-6 flex flex-col gap-1">
                {mainNav.map((link) => (
                  <li key={link.href}>
                    <SheetClose asChild>
                      <Link
                        href={link.href}
                        aria-current={isActive(link.href) ? "page" : undefined}
                        className="block rounded-xl px-4 py-3 text-base font-medium text-white/80 hover:bg-white/8 hover:text-white aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
                      >
                        {t(link.label as Parameters<typeof t>[0])}
                      </Link>
                    </SheetClose>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-3">
                <LanguageSwitcher className="self-start text-sm" />
                {user ? (
                  <>
                    <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                      <UserAvatar user={user} className="size-10" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <SheetClose asChild>
                        <Button asChild variant="glass" size="xl">
                          <Link href="/dashboard">
                            <LayoutDashboard /> {t("dashboard")}
                          </Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button asChild variant="glass" size="xl">
                          <Link href="/profile">
                            <UserRound /> {t("profile")}
                          </Link>
                        </Button>
                      </SheetClose>
                    </div>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        size="xl"
                        className="rounded-full text-rose-300"
                        onClick={handleSignOut}
                      >
                        <LogOut /> {t("signOut")}
                      </Button>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="glass" size="xl">
                        <Link href="/sign-in">{t("signIn")}</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild variant="gradient" size="xl">
                        <Link href="/languages">
                          {t("startLearning")} <ArrowRight />
                        </Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
