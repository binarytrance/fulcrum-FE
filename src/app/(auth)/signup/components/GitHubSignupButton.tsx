"use client";

import { buildOAuthStartUrl } from "@/utils/auth";
import { generateCodeVerifier, generateCodeChallenge, saveCodeVerifier } from "@/utils/pkce";
import { Github, Loader2 } from "lucide-react";
import { useState } from "react";

const GITHUB_SIGNUP_CALLBACK_PATH = "/signup/github/callback";

type GitHubSignupButtonProps = {
  className?: string;
};

export function GitHubSignupButton({ className }: GitHubSignupButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      setLoading(true);
      setError(null);
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      saveCodeVerifier(verifier);
      window.location.assign(
        buildOAuthStartUrl("/github", GITHUB_SIGNUP_CALLBACK_PATH, challenge)
      );
    } catch {
      setLoading(false);
      setError("Could not start GitHub sign up. Please try again.");
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
        {loading ? "Redirecting…" : "Continue with GitHub"}
      </button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}