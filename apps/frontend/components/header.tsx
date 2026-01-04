import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-brand-dark/80 backdrop-blur sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick} className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {action.label}
        </Button>
      )}
    </header>
  );
}
