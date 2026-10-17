/** The parts of Telegram.WebApp (telegram-web-app.js) the Mini App uses. */
export type WebApp = {
  initData: string;
  initDataUnsafe: {
    user?: { language_code?: string; is_premium?: boolean };
    start_param?: string;
  };
  version: string;
  ready(): void;
  expand(): void;
  isVersionAtLeast(version: string): boolean;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  setBottomBarColor?(color: string): void;
  openLink(url: string): void;
  openTelegramLink(url: string): void;
  shareMessage?(id: string, callback?: (sent: boolean) => void): void;
  shareToStory?(
    mediaUrl: string,
    params?: { text?: string; widget_link?: { url: string; name?: string } },
  ): void;
  addToHomeScreen?(): void;
  HapticFeedback?: {
    impactOccurred(style: "light" | "medium" | "heavy"): void;
    notificationOccurred(type: "error" | "success" | "warning"): void;
    selectionChanged(): void;
  };
  BackButton: {
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
  CloudStorage?: {
    getItem(
      key: string,
      callback: (error: unknown, value?: string) => void,
    ): void;
    setItem(
      key: string,
      value: string,
      callback?: (error: unknown) => void,
    ): void;
  };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: WebApp };
  }
}

export const telegramScript = "https://telegram.org/js/telegram-web-app.js?64";

export function webApp() {
  return typeof window === "undefined" ? undefined : window.Telegram?.WebApp;
}

/** Calls the Mini App's API with the launch's signed data. */
export async function callApi<T>(path: string, body: object = {}): Promise<T> {
  const response = await fetch(`/api/tg/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": webApp()?.initData ?? "",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return (await response.json()) as T;
}

export function haptic(kind: "success" | "error" | "tap") {
  const h = webApp()?.HapticFeedback;
  if (!h) return;
  if (kind === "tap") h.selectionChanged();
  else h.notificationOccurred(kind);
}
