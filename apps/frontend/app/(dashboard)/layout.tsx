import { Sidebar } from '@/components/sidebar';
import { CreateProjectDialog } from '@/components/create-project-dialog';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-60">{children}</main>
      <CreateProjectDialog />
    </div>
  );
}
