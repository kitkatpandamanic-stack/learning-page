/**
 * Runs `task` once the page has finished loading and the browser is idle,
 * so optional extras (3D scenes, language runtimes) don't slow down the
 * first paint. Returns a function that cancels it.
 */
export function whenIdle(task: () => void, timeoutMs = 4000) {
  let idleHandle: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    if (typeof requestIdleCallback === "function") {
      idleHandle = requestIdleCallback(task, { timeout: timeoutMs });
    } else {
      timer = setTimeout(task, 1000);
    }
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
  return () => {
    window.removeEventListener("load", schedule);
    if (idleHandle !== undefined) cancelIdleCallback(idleHandle);
    if (timer !== undefined) clearTimeout(timer);
  };
}
