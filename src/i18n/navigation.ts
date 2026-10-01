import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/** Locale-aware Link, redirect and hooks: "/learn" becomes "/ru/learn" in Russian. */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
