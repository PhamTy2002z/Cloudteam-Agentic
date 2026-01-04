'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderKanban, FileText, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';

// Logo component - AI Toolkit Sync style
const Logo = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <path
      d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z"
      fill="hsl(var(--sidebar-primary))"
    />
    <path
      d="M16 8c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8z"
      fill="hsl(var(--sidebar-background))"
    />
    <path
      d="M16 11c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5z"
      fill="hsl(var(--sidebar-primary))"
    />
  </svg>
);

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'General',
    items: [{ title: 'Projects', href: '/projects', icon: FolderKanban }],
  },
  {
    title: 'Resources',
    items: [
      { title: 'Documentation', href: '/docs', icon: FileText },
      { title: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Header */}
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <Link
          href="/projects"
          className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
        >
          <Logo />
          <span className="font-semibold text-lg text-sidebar-foreground tracking-tight group-data-[collapsible=icon]:hidden">
            Cloudteam Agentic
          </span>
        </Link>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="text-sidebar-foreground/50">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + '/');
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <Icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer with toggle */}
      <SidebarFooter className="p-2 flex items-center justify-center">
        <SidebarTrigger className="hover:bg-transparent" />
      </SidebarFooter>
    </Sidebar>
  );
}
