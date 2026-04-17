"use client";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { useState } from "react";

const GoalsPage = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    await clearAuth();
    router.replace("/signin");
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 sm:p-8">
      <div className="flex flex-col gap-3 rounded-md border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-sm text-muted-foreground">
            {user?.email
              ? `Signed in as ${String(user.email)}`
              : "Signed in with cookie session"}
          </p>
        </div>

        <Button
          variant="destructive"
          onClick={handleLogout}
          disabled={logoutLoading}
        >
          {logoutLoading ? "Logging out..." : "Logout"}
        </Button>
      </div>

      <section className="rounded-md border p-5">
        <Button>Create goal</Button>
        <p className="mt-3 text-sm text-muted-foreground">List of goals if present</p>
      </section>
    </main>
  );
};

export default GoalsPage;
