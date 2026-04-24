import { LeftNav } from "@/components/left-nav/LeftNav";

export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <LeftNav />
      {/* pt-14 offsets the fixed mobile topbar; lg:pt-0 removes it on desktop */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
