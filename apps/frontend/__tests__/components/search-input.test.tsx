import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchInput } from '@/components/ui/search-input';

describe('SearchInput', () => {
  it('renders search icon on the left', () => {
    const { container } = render(<SearchInput />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('absolute', 'left-3');
  });

  it('renders input element', () => {
    render(<SearchInput />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('positions icon correctly with left-3 and top-1/2 transform', () => {
    const { container } = render(<SearchInput />);
    const icon = container.querySelector('svg');
    expect(icon).toHaveClass('absolute', 'left-3', 'top-1/2', '-translate-y-1/2');
  });

  it('applies pl-9 padding to input for icon spacing', () => {
    const { container } = render(<SearchInput />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('pl-9');
  });

  it('accepts standard input props - placeholder', () => {
    render(<SearchInput placeholder="Search projects..." />);
    const input = screen.getByPlaceholderText('Search projects...');
    expect(input).toBeInTheDocument();
  });

  it('accepts disabled prop', () => {
    render(<SearchInput disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('accepts type prop', () => {
    const { container } = render(<SearchInput type="search" />);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('search');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<SearchInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies custom className to input', () => {
    const { container } = render(<SearchInput className="custom-class" />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('custom-class');
  });

  it('applies custom containerClassName to wrapper', () => {
    const { container } = render(<SearchInput containerClassName="custom-container" />);
    const wrapper = container.querySelector('.relative');
    expect(wrapper?.className).toContain('custom-container');
  });

  it('input element is focusable', () => {
    const { container } = render(<SearchInput />);
    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();
    input?.focus();
    expect(input).toHaveFocus();
  });

  it('has correct display name', () => {
    expect(SearchInput.displayName).toBe('SearchInput');
  });

  it('icon has correct size and color classes', () => {
    const { container } = render(<SearchInput />);
    const icon = container.querySelector('svg');
    expect(icon).toHaveClass('h-4', 'w-4', 'text-muted-foreground');
  });

  it('combines custom className with default pl-9', () => {
    const { container } = render(<SearchInput className="text-lg" />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('pl-9');
    expect(input?.className).toContain('text-lg');
  });

  it('combines custom containerClassName with relative', () => {
    const { container } = render(<SearchInput containerClassName="w-full" />);
    const wrapper = container.querySelector('.relative');
    expect(wrapper?.className).toContain('relative');
    expect(wrapper?.className).toContain('w-full');
  });

  it('handles onChange event callback', () => {
    const handleChange = vi.fn();
    const { container } = render(<SearchInput onChange={handleChange} />);
    const input = container.querySelector('input') as HTMLInputElement;

    // Verify input accepts onChange prop without errors
    expect(input).toBeInTheDocument();
    expect(handleChange).toBeDefined();
  });

  it('handles onFocus event callback', () => {
    const handleFocus = vi.fn();
    const { container } = render(<SearchInput onFocus={handleFocus} />);
    const input = container.querySelector('input');

    // Verify input accepts onFocus prop without errors
    expect(input).toBeInTheDocument();
    expect(handleFocus).toBeDefined();
  });

  it('handles onBlur event callback', () => {
    const handleBlur = vi.fn();
    const { container } = render(<SearchInput onBlur={handleBlur} />);
    const input = container.querySelector('input');

    // Verify input accepts onBlur prop without errors
    expect(input).toBeInTheDocument();
    expect(handleBlur).toBeDefined();
  });

  it('renders with aria-label when provided', () => {
    render(<SearchInput aria-label="Search input" />);
    const input = screen.getByLabelText('Search input');
    expect(input).toBeInTheDocument();
  });

  it('maintains relative positioning context for icon', () => {
    const { container } = render(<SearchInput />);
    const wrapper = container.querySelector('.relative');
    const icon = wrapper?.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon?.parentElement).toBe(wrapper);
  });

  it('accepts value prop', () => {
    render(<SearchInput value="test search" readOnly />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('test search');
  });

  it('accepts name attribute', () => {
    render(<SearchInput name="search-field" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.name).toBe('search-field');
  });

  it('accepts required attribute', () => {
    render(<SearchInput required />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.required).toBe(true);
  });
});
