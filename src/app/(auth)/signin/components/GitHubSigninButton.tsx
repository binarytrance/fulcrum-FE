"use client";

import { buildOAuthStartUrl } from "@/utils/auth";
import { Github, Loader2 } from "lucide-react";
import { useState } from "react";

const GITHUB_SIGNIN_CALLBACK_PATH = "/signin/github/callback";

type GitHubSigninButtonProps = {
  className?: string;
};

export function GitHubSigninButton({ className }: GitHubSigninButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    try {
      setLoading(true);
      setError(null);
      window.location.assign(
        buildOAuthStartUrl("/github", GITHUB_SIGNIN_CALLBACK_PATH)
      );
    } catch {
      setLoading(false);
      setError("Could not start GitHub sign in. Please try again.");
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#24292f] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#2f3640] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/10 dark:text-white/90 dark:ring-1 dark:ring-white/10 dark:hover:bg-white/15"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Github className="h-4 w-4" />
        )}
        {loading ? "Redirecting\u2026" : "Continue with GitHub"}
      </button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}