// Focus layout — full-width, no nav chrome.
// All authenticated (auth gate from parent (app)/layout.tsx) but no sidebar.

export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-full overflow-hidden">
      {children}
    </div>
  );
}
