"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Avatar } from "@/components/ui/avatar";
import { analytics } from "@/lib/analytics";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  if (!user) return null;

  const firstname = user.firstname ?? "";
  const lastname = user.lastname ?? "";
  const fullName = [firstname, lastname].filter(Boolean).join(" ");
  const initials = [firstname[0], lastname[0]].filter(Boolean).join("").toUpperCase();

  async function handleSignOut() {
    analytics.capture("signed_out", { from: "settings" });
    await clearAuth();
    router.replace("/signin");
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Identity */}
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <Avatar initials={initials || "?"} className="h-12 w-12" />
          <div>
            <p className="text-sm font-semibold text-foreground">{fullName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" value={firstname} />
          <Field label="Last name" value={lastname || "—"} />
          <Field label="Email" value={user.email} />
        </div>
      </section>

      {/* Sign out */}
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
        <div>
          <p className="text-sm font-medium text-foreground">Sign out</p>
          <p className="text-xs text-muted-foreground">
            Signs you out of this device and clears your session.
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-fit rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
        >
          Sign out
        </button>
      </section>
    </div>
  );
}
