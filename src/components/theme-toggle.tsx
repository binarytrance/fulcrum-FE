"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

// ─── Component ────────────────────────────────────────────────────────────────
// Dumb component — owns no state. All theme state lives in ThemeProvider.
// Multiple instances of this component can exist without race conditions.

export function ThemeToggle() {
  const { theme, mounted, toggle } = useTheme();

  // Render an invisible placeholder before mount to prevent layout shift.
  // ThemeProvider handles reading localStorage and applying the class.
  if (!mounted) return <div className="size-9" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
