import { AppSidebar } from '@/components/sidebar';
import { CreateProjectDialog } from '@/components/create-project-dialog';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Toaster } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
      <CreateProjectDialog />
      <Toaster position="bottom-right" theme="dark" richColors />
    </SidebarProvider>
  );
}
