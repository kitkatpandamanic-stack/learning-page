// Types for next-intl: translation keys are checked against the English files.
// Keep in sync with namespaces.ts (a test checks both languages have the same keys).
import type { routing } from "./routing";
import type common from "../../messages/en/common.json";
import type metadata from "../../messages/en/metadata.json";
import type nav from "../../messages/en/nav.json";
import type footer from "../../messages/en/footer.json";
import type levels from "../../messages/en/levels.json";
import type languageInfo from "../../messages/en/languageInfo.json";
import type home from "../../messages/en/home.json";
import type pages from "../../messages/en/pages.json";
import type auth from "../../messages/en/auth.json";
import type dashboard from "../../messages/en/dashboard.json";
import type profile from "../../messages/en/profile.json";
import type progress from "../../messages/en/progress.json";
import type achievements from "../../messages/en/achievements.json";
import type languages from "../../messages/en/languages.json";
import type course from "../../messages/en/course.json";
import type lesson from "../../messages/en/lesson.json";
import type runner from "../../messages/en/runner.json";
import type playground from "../../messages/en/playground.json";
import type practice from "../../messages/en/practice.json";
import type search from "../../messages/en/search.json";
import type notFound from "../../messages/en/notFound.json";

type Messages = {
  common: typeof common;
  metadata: typeof metadata;
  nav: typeof nav;
  footer: typeof footer;
  levels: typeof levels;
  languageInfo: typeof languageInfo;
  home: typeof home;
  pages: typeof pages;
  auth: typeof auth;
  dashboard: typeof dashboard;
  profile: typeof profile;
  progress: typeof progress;
  achievements: typeof achievements;
  languages: typeof languages;
  course: typeof course;
  lesson: typeof lesson;
  runner: typeof runner;
  playground: typeof playground;
  practice: typeof practice;
  search: typeof search;
  notFound: typeof notFound;
};

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Messages;
  }
}
