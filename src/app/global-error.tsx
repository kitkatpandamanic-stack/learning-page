"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/** Last-resort error page when even the root layout fails to render. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#070814",
          color: "#e8e8f3",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 16,
        }}
      >
        <main>
          <p style={{ fontSize: 48, margin: 0 }}>🐼</p>
          <h1 style={{ fontSize: 28 }}>Something went wrong</h1>
          <p style={{ color: "#a6a8c4" }}>
            We&apos;ve been told about it. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 8,
              padding: "10px 20px",
              borderRadius: 999,
              border: 0,
              background: "#8b5cf6",
              color: "white",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
