"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Trash2 } from "lucide-react";

import { useSignOut } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const handleSignOut = useSignOut();
  return (
    <Button variant="glass" size="xl" onClick={handleSignOut}>
      <LogOut /> Sign out
    </Button>
  );
}

/** Two-step delete: first click asks for confirmation, second click deletes. */
export function DeleteAccountButton() {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);
    const { error } = await authClient.deleteUser();
    if (error) {
      setError(
        error.status === 403 || error.code === "SESSION_EXPIRED"
          ? "For your safety, please sign out and sign in again, then retry."
          : (error.message ?? "Could not delete your account."),
      );
      setPending(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (!confirming) {
    return (
      <Button
        variant="destructive"
        size="xl"
        className="rounded-full"
        onClick={() => setConfirming(true)}
      >
        <Trash2 /> Delete account
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-rose-400/40 bg-rose-400/10 p-4">
      <p className="text-sm text-rose-100">
        This permanently deletes your account, progress and XP. This can&apos;t
        be undone.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full px-4"
          disabled={pending}
          onClick={handleDelete}
        >
          {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} Yes,
          delete everything
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="rounded-full px-4"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-200">
          {error}
        </p>
      )}
    </div>
  );
}
