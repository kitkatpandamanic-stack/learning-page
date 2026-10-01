"use client";

import * as React from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// UI only for now: subscriptions get wired up once the backend exists (Phase 5).
export function NewsletterForm() {
  const [submitted, setSubmitted] = React.useState(false);

  if (submitted) {
    return (
      <p className="text-sm text-cyan-300">
        Thanks! The newsletter is launching soon. 🐼
      </p>
    );
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <Input
        id="newsletter-email"
        type="email"
        required
        placeholder="you@example.com"
        className="h-10 rounded-full bg-white/5 px-4"
      />
      <Button
        type="submit"
        variant="gradient"
        size="icon-lg"
        className="size-10 shrink-0"
        aria-label="Subscribe"
      >
        <Send />
      </Button>
    </form>
  );
}
