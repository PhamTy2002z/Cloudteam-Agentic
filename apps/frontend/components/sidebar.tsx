'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, FileText, Settings, Database, Menu, X } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';

const navItems = [
  { title: 'Dashboard', href: '/projects', icon: Home },
  { title: 'Documentation', href: '/docs', icon: FileText },
  { title: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-60 bg-brand-dark-darker border-r border-border flex flex-col z-50 transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-lg bg-brand-cyan flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-foreground">AI Toolkit Sync</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition cursor-pointer',
                  isActive
                    ? 'bg-brand-cyan/20 text-brand-cyan'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-cyan to-primary flex items-center justify-center text-sm font-medium text-white">
              TL
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-foreground">Tech Lead</div>
              <div className="text-xs text-muted-foreground truncate">team@example.com</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-card rounded-lg border border-border"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
}
