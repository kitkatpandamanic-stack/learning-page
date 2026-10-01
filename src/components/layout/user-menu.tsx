"use client";

import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth-client";

export type MenuUser = { name: string; email: string; image?: string | null };

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function UserAvatar({
  user,
  className,
}: {
  user: MenuUser;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      {user.image && <AvatarImage src={user.image} alt="" />}
      <AvatarFallback className="bg-gradient-brand font-semibold text-white">
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function useSignOut() {
  const router = useRouter();
  return () =>
    signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
}

export function UserMenu({ user }: { user: MenuUser }) {
  const t = useTranslations("auth.menu");
  const handleSignOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("label")}
        className="rounded-full ring-2 ring-neon-violet/50 transition outline-none hover:ring-neon-pink/70 focus-visible:ring-neon-cyan"
      >
        <UserAvatar user={user} className="size-9" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-60 rounded-xl border-0 bg-transparent p-1.5 glass-strong"
      >
        <DropdownMenuLabel className="flex flex-col px-2 py-1.5">
          <span className="truncate font-semibold text-white">{user.name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem asChild className="rounded-lg">
          <Link href="/dashboard">
            <LayoutDashboard /> {t("dashboard")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-lg">
          <Link href="/profile">
            <UserRound /> {t("profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          onSelect={handleSignOut}
          className="rounded-lg text-rose-300 focus:text-rose-200"
        >
          <LogOut /> {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
