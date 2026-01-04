import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Plus } from 'lucide-react';

interface HeaderProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'neutral';
  };
  searchBar?: {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
  };
}

export function Header({ title, description, action, searchBar }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-sidebar/80 backdrop-blur sticky top-0 z-10">
      <div className="flex-1 max-w-md">
        {searchBar ? (
          <SearchInput
            placeholder={searchBar.placeholder || 'Search...'}
            value={searchBar.value}
            onChange={(e) => searchBar.onChange?.(e.target.value)}
            className="w-full"
          />
        ) : (
          <>
            {title && <h1 className="text-xl font-semibold text-foreground">{title}</h1>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick} variant={action.variant || 'default'}>
          <Plus className="w-4 h-4 mr-2" />
          {action.label}
        </Button>
      )}
    </header>
  );
}
