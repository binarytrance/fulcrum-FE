import { LeftNav } from "@/components/left-nav/LeftNav";

// Wraps all (workspace)/ pages with the left nav sidebar.
// Pages that don't need the sidebar (e.g. focus session, onboarding) should live
// under (app)/ directly and define their own layout, like (app)/focus/layout.tsx.
export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <LeftNav />
      {/* pt-14 offsets the fixed mobile topbar; lg:pt-0 removes it on desktop */}
      <main className="flex-1 h-full overflow-y-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
