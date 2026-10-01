/**
 * Node's list of time zones (Intl.supportedValuesOf) misses many current
 * names, such as Asia/Kolkata and Europe/Kyiv, so ask Intl directly instead.
 */
export function isValidTimeZone(tz: string) {
  if (!/^[A-Za-z][A-Za-z0-9_+\-/]{0,63}$/.test(tz)) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
