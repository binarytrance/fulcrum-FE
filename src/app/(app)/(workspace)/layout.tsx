import { WorkspaceLayout } from "@/components/workspace-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WorkspaceLayout>{children}</WorkspaceLayout>;
}
