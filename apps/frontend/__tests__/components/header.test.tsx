import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '@/components/header';

describe('Header', () => {
  describe('Title/Description Variant (Backward Compatibility)', () => {
    it('renders title when provided', () => {
      render(<Header title="Test Project" />);
      const title = screen.getByText('Test Project');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H1');
    });

    it('renders description when provided', () => {
      render(<Header title="Test Project" description="Test Description" />);
      const description = screen.getByText('Test Description');
      expect(description).toBeInTheDocument();
      expect(description.tagName).toBe('P');
    });

    it('renders both title and description together', () => {
      render(
        <Header
          title="My Project"
          description="This is my project"
        />
      );
      expect(screen.getByText('My Project')).toBeInTheDocument();
      expect(screen.getByText('This is my project')).toBeInTheDocument();
    });

    it('does not render title when not provided', () => {
      render(<Header description="Only description" />);
      expect(screen.queryByText('Only description')).toBeInTheDocument();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(<Header title="Only title" />);
      expect(screen.getByText('Only title')).toBeInTheDocument();
      expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
    });

    it('applies correct styling to title', () => {
      const { container } = render(<Header title="Styled Title" />);
      const title = container.querySelector('h1');
      expect(title?.className).toContain('text-xl');
      expect(title?.className).toContain('font-semibold');
      expect(title?.className).toContain('text-foreground');
    });

    it('applies correct styling to description', () => {
      const { container } = render(
        <Header title="Title" description="Styled Description" />
      );
      const description = container.querySelector('p');
      expect(description?.className).toContain('text-sm');
      expect(description?.className).toContain('text-muted-foreground');
    });
  });

  describe('SearchBar Variant', () => {
    it('renders SearchInput when searchBar prop is provided', () => {
      const { container } = render(
        <Header
          searchBar={{
            placeholder: 'Search projects...',
            value: '',
            onChange: vi.fn(),
          }}
        />
      );
      const searchInput = container.querySelector('input');
      expect(searchInput).toBeInTheDocument();
    });

    it('passes placeholder to SearchInput', () => {
      render(
        <Header
          searchBar={{
            placeholder: 'Custom placeholder',
            value: '',
            onChange: vi.fn(),
          }}
        />
      );
      const input = screen.getByPlaceholderText('Custom placeholder');
      expect(input).toBeInTheDocument();
    });

    it('uses default placeholder when not provided', () => {
      render(
        <Header
          searchBar={{
            value: '',
            onChange: vi.fn(),
          }}
        />
      );
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
    });

    it('passes value to SearchInput', () => {
      render(
        <Header
          searchBar={{
            placeholder: 'Search',
            value: 'test value',
            onChange: vi.fn(),
          }}
        />
      );
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('test value');
    });

    it('calls onChange callback when input changes', () => {
      const handleChange = vi.fn();
      const { container } = render(
        <Header
          searchBar={{
            placeholder: 'Search',
            value: '',
            onChange: handleChange,
          }}
        />
      );
      const input = container.querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'new search' } });
      expect(handleChange).toHaveBeenCalledWith('new search');
    });

    it('does not render title/description when searchBar is provided', () => {
      render(
        <Header
          title="Should not appear"
          description="Should not appear"
          searchBar={{
            placeholder: 'Search',
            value: '',
            onChange: vi.fn(),
          }}
        />
      );
      expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
    });

    it('applies w-full class to SearchInput', () => {
      const { container } = render(
        <Header
          searchBar={{
            placeholder: 'Search',
            value: '',
            onChange: vi.fn(),
          }}
        />
      );
      const input = container.querySelector('input');
      expect(input?.className).toContain('w-full');
    });

    it('handles onChange being undefined gracefully', () => {
      const { container } = render(
        <Header
          searchBar={{
            placeholder: 'Search',
            value: '',
          }}
        />
      );
      const input = container.querySelector('input') as HTMLInputElement;
      expect(() => {
        fireEvent.change(input, { target: { value: 'test' } });
      }).not.toThrow();
    });
  });

  describe('Action Button', () => {
    it('renders action button when action prop is provided', () => {
      render(
        <Header
          title="Test"
          action={{
            label: 'Add Project',
            onClick: vi.fn(),
          }}
        />
      );
      const button = screen.getByRole('button', { name: /Add Project/i });
      expect(button).toBeInTheDocument();
    });

    it('displays action label correctly', () => {
      render(
        <Header
          title="Test"
          action={{
            label: 'Create New',
            onClick: vi.fn(),
          }}
        />
      );
      expect(screen.getByText('Create New')).toBeInTheDocument();
    });

    it('calls onClick callback when button is clicked', () => {
      const handleClick = vi.fn();
      render(
        <Header
          title="Test"
          action={{
            label: 'Click Me',
            onClick: handleClick,
          }}
        />
      );
      const button = screen.getByRole('button', { name: /Click Me/i });
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders Plus icon in action button', () => {
      const { container } = render(
        <Header
          title="Test"
          action={{
            label: 'Add',
            onClick: vi.fn(),
          }}
        />
      );
      const button = screen.getByRole('button', { name: /Add/i });
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('does not render action button when action prop is not provided', () => {
      render(<Header title="Test" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('action button works with title/description variant', () => {
      const handleClick = vi.fn();
      render(
        <Header
          title="Projects"
          description="Manage your projects"
          action={{
            label: 'New Project',
            onClick: handleClick,
          }}
        />
      );
      const button = screen.getByRole('button', { name: /New Project/i });
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalled();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Manage your projects')).toBeInTheDocument();
    });

    it('action button works with searchBar variant', () => {
      const handleClick = vi.fn();
      const handleSearch = vi.fn();
      render(
        <Header
          searchBar={{
            placeholder: 'Search',
            value: '',
            onChange: handleSearch,
          }}
          action={{
            label: 'Add',
            onClick: handleClick,
          }}
        />
      );
      const button = screen.getByRole('button', { name: /Add/i });
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalled();
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    it('applies correct styling to action button', () => {
      const { container } = render(
        <Header
          title="Test"
          action={{
            label: 'Action',
            onClick: vi.fn(),
          }}
        />
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-primary');
      expect(button.className).toContain('hover:bg-primary/90');
      expect(button.className).toContain('text-primary-foreground');
    });
  });

  describe('Header Layout & Structure', () => {
    it('renders header element', () => {
      const { container } = render(<Header title="Test" />);
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('applies correct header styling', () => {
      const { container } = render(<Header title="Test" />);
      const header = container.querySelector('header');
      expect(header?.className).toContain('h-16');
      expect(header?.className).toContain('border-b');
      expect(header?.className).toContain('flex');
      expect(header?.className).toContain('items-center');
      expect(header?.className).toContain('justify-between');
      expect(header?.className).toContain('sticky');
      expect(header?.className).toContain('top-0');
      expect(header?.className).toContain('z-10');
    });

    it('has flex layout with space between', () => {
      const { container } = render(
        <Header
          title="Test"
          action={{
            label: 'Action',
            onClick: vi.fn(),
          }}
        />
      );
      const header = container.querySelector('header');
      expect(header?.className).toContain('justify-between');
    });
  });
});
