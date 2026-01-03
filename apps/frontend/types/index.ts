// Re-export API types
export type {
  Project,
  Doc,
  Lock,
  ApiKey,
  CreateProjectData,
} from '@/lib/api';

// UI-specific types
export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}

export interface BreadcrumbItem {
  title: string;
  href?: string;
}
