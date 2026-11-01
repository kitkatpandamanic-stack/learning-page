import { callApi, haptic, webApp } from "@/components/tg/telegram";

type Share = {
  messageId: string | null;
  storyUrl: string;
  storyText: string;
  link: string;
  text: string;
};

/**
 * Sends a Blitz result, the panda or code (path "snippet") to a chat, the
 * newest way the Telegram app supports.
 */
export async function shareToChat(body: object, path = "share") {
  const tg = webApp();
  const share = await callApi<Pick<Share, "messageId" | "link" | "text">>(
    path,
    body,
  );
  haptic("tap");
  if (share.messageId && tg?.shareMessage && tg.isVersionAtLeast("8.0")) {
    tg.shareMessage(share.messageId);
    return;
  }
  const url = `https://t.me/share/url?url=${encodeURIComponent(share.link)}&text=${encodeURIComponent(share.text)}`;
  tg?.openTelegramLink(url);
}

export const canShareStory = () =>
  Boolean(webApp()?.shareToStory && webApp()?.isVersionAtLeast("7.8"));

/** Opens Telegram's story editor with the picture (links in stories are Premium only). */
export async function shareToStory(body: object) {
  const tg = webApp();
  const share = await callApi<Share>("share", body);
  haptic("tap");
  tg?.shareToStory?.(share.storyUrl, {
    text: share.storyText,
    ...(tg.initDataUnsafe.user?.is_premium
      ? { widget_link: { url: share.link, name: "PandaDev" } }
      : {}),
  });
}
