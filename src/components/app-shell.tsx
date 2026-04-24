// AppShell — wraps all authenticated routes.
//
// Responsibilities (current):
//   – ErrorBoundary boundary for the entire authenticated surface
//
// Responsibilities (planned):
//   – WebSocket / realtime provider (add here, not in individual layouts)
//   – ⌘K command palette provider
//   – Auth-scoped analytics listeners

export function AppShell({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
