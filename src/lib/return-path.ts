/** Only allow same-site relative paths as post-sign-in destinations. */
export function safeReturnPath(value: unknown, fallback = "/dashboard") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    // Browsers ignore tabs/newlines and treat "\" like "/", so "/\t/evil.com"
    // or "/\\evil.com" would leave the site.
    /[\u0000-\u001f\u007f\\]/.test(value)
  ) {
    return fallback;
  }
  const base = "https://pandadev.invalid";
  const url = new URL(value, base);
  return url.origin === base ? url.pathname + url.search + url.hash : fallback;
}
