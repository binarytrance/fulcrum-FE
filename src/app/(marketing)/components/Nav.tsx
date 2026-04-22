"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight } from "lucide-react";
import { NAV_LINKS } from "../data/content";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 backdrop-blur-xl bg-background/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-foreground hover:opacity-80 transition-opacity select-none"
        >
          <span className="text-2xl leading-none">⚡</span>
          <span className="text-lg tracking-tight">Fulcrum</span>
        </Link>

        {/* Nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={(e) => {
                e.preventDefault();
                const id = item.toLowerCase();
                document
                  .getElementById(id)
                  ?.scrollIntoView({ behavior: "smooth" });
                window.history.replaceState(null, "", `#${id}`);
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href="/signin">Sign In</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/signup">
              Start Free
              <ArrowRight className="h-3.5 w-3.5 mt-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
