# AI Toolkit Sync Platform - Design Guidelines

## Overview
Design system for a developer-focused documentation synchronization platform. Features a warm dark theme with coral/orange accents, prioritizing clarity, efficiency, and professional aesthetics.

---

## Design Philosophy

- **Warm Dark Theme**: Reduces eye strain with warm undertones (#1A1917 base)
- **Coral Accent**: Distinguishes from typical blue-heavy dev tools (#D97755)
- **Token-based System**: HSL CSS variables for consistency and theming
- **Shadcn/ui Pattern**: Leverages proven component architecture
- **Accessibility First**: WCAG AA compliant, keyboard navigable

---

## Color Palette

### Brand Colors
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--primary` | `191 89% 45%` | `#0DA8D6` | Primary CTAs, links, focus rings |
| `--sidebar-primary` | `18 65% 59%` | `#D97755` | Sidebar accent, active states |
| `--success` | `142 71% 45%` | `#22C55E` | Success states, unlocked |
| `--destructive` | `0 62% 30%` | `#7F1D1D` | Error states, locked |
| `--warning` | `38 92% 50%` | `#F59E0B` | Non-critical alerts, pending states |
| `--info` | `217 91% 60%` | `#60A5FA` | Informational messages, tips |

### Dark Theme (Primary)
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--background` | `0 0% 10%` | `#1A1A1A` | Main content background |
| `--foreground` | `0 0% 95%` | `#F2F2F2` | Primary text |
| `--card` | `0 0% 13%` | `#212121` | Cards, elevated surfaces |
| `--border` | `0 0% 22%` | `#383838` | Borders, dividers |
| `--muted` | `0 0% 18%` | `#2E2E2E` | Muted backgrounds |
| `--muted-foreground` | `0 0% 60%` | `#999999` | Secondary text, placeholders |

### Sidebar Theme (Dark)
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--sidebar-background` | `24 10% 10%` | `#1A1917` | Warm dark base |
| `--sidebar-foreground` | `0 0% 93%` | `#EDEDED` | Sidebar text |
| `--sidebar-primary` | `18 65% 59%` | `#D97755` | Active item, accents |
| `--sidebar-accent` | `18 65% 59%` | `#D97755` | Hover/active backgrounds |
| `--sidebar-border` | `0 0% 20%` | `#333333` | Sidebar borders |
| `--sidebar-muted` | `0 0% 45%` | `#737373` | Section labels |

### Light Theme
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--background` | `0 0% 100%` | `#FFFFFF` | Main background |
| `--foreground` | `0 0% 15%` | `#262626` | Primary text |
| `--sidebar-background` | `0 0% 98%` | `#FAFAFA` | Sidebar background |
| `--sidebar-primary` | `240 5.9% 10%` | `#18181B` | Active states |

---

## Typography

### Font Stack
```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale
| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `h1` | 24px | 700 | 1.2 | Page titles |
| `h2` | 20px | 600 | 1.3 | Section headers |
| `h3` | 18px | 600 | 1.4 | Card/sidebar titles |
| `body` | 14px | 400 | 1.5 | Body text, menu items |
| `label` | 12px | 500 | 1.4 | Section labels, badges |
| `small` | 11px | 400 | 1.4 | Captions, tooltips |
| `code` | 13px | 400 | 1.5 | Monospace content |

### Font Weights
- **400 Regular**: Body text, descriptions
- **500 Medium**: Labels, badges, section headers
- **600 Semibold**: Titles, nav items, buttons
- **700 Bold**: Page headings, emphasis

---

## Spacing System

Based on 4px base unit (Tailwind scale):
| Token | Tailwind | Pixels | Usage |
|-------|----------|--------|-------|
| `1` | `p-1` | 4px | Tight gaps, icon spacing |
| `2` | `p-2` | 8px | Button icon gaps, collapsed padding |
| `3` | `p-3` | 12px | Menu item padding |
| `4` | `p-4` | 16px | Card padding, header padding |
| `5` | `p-5` | 20px | Section padding |
| `6` | `p-6` | 24px | **Standard card content**, large gaps |
| `8` | `p-8` | 32px | Page margins |

### Component Spacing Standards (Phase 02)
- **Cards**: `p-6` (24px) padding, `rounded-lg` (8px) radius
- **Grid gaps**: `gap-6` (24px) between cards
- **Project cards**: `p-6` with `rounded-lg` borders

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `0.5rem` (8px) | Default (cards, modals) |
| `rounded-lg` | `8px` | **Standard cards**, containers (normalized in Phase 02) |
| `rounded-md` | `6px` | Buttons, inputs |
| `rounded-sm` | `4px` | Badges, small elements |
| `rounded-full` | `9999px` | Avatars, pills |

---

## Components

### Sidebar (shadcn/ui)

**Structure:**
```tsx
<SidebarProvider>
  <Sidebar collapsible="icon">
    <SidebarHeader />      // Logo, 32px icon
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel />  // Section title
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive tooltip />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter />      // Toggle trigger
  </Sidebar>
  <SidebarInset>{children}</SidebarInset>
</SidebarProvider>
```

**Dimensions:**
| State | Width | Mobile Width | Icon Width |
|-------|-------|--------------|------------|
| Expanded | 256px (16rem) | 288px (18rem) | - |
| Collapsed | 48px (3rem) | - | 48px |

**Behavior:**
- Keyboard shortcut: `Cmd/Ctrl + B` to toggle
- Cookie persistence for state
- Mobile: Sheet overlay
- Desktop: Icon-only collapse with tooltips

### Buttons

**Variants (6):**
| Variant | Background | Text | Border |
|---------|------------|------|--------|
| `default` | `--primary` | `--primary-foreground` | none |
| `destructive` | `--destructive` | `--destructive-foreground` | none |
| `outline` | transparent | `--foreground` | `--border` |
| `secondary` | `--secondary` | `--secondary-foreground` | none |
| `ghost` | transparent | `--foreground` | none |
| `link` | transparent | `--primary` | none |

**Sizes:**
| Size | Height | Padding | Font |
|------|--------|---------|------|
| `sm` | 32px | 12px | 12px |
| `default` | 40px | 16px | 14px |
| `lg` | 44px | 24px | 14px |
| `icon` | 40px | 0 | - |

### Cards
```css
.card {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 24px; /* p-6 */
}
```

### Form Inputs
```css
.input {
  height: 40px;
  padding: 8px 12px;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--input));
  border-radius: calc(var(--radius) - 2px); /* 6px */
}
.input:focus {
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}
```

### Status Indicators

**Locked (Red):**
```css
.status-locked {
  background: linear-gradient(90deg, #7F1D1D, #991B1B);
  border-left: 4px solid #EF4444;
  color: #FCA5A5;
}
```

**Unlocked (Green):**
```css
.status-unlocked {
  background: hsl(142 71% 45% / 0.1);
  color: #22C55E;
}
```

---

## Layout Patterns

### Sidebar + Inset Layout
```tsx
<div className="flex min-h-screen w-full">
  <Sidebar />           // Fixed left
  <SidebarInset>        // Flexible main content
    {children}
  </SidebarInset>
</div>
```

### Content Area
- Max-width: 1200px (centered)
- Padding: 24px (p-6)
- Background: `--background`

### Grid System
| Breakpoint | Columns | Gap |
|------------|---------|-----|
| Mobile | 1 | 16px |
| `md` (768px) | 2 | 24px |
| `lg` (1024px) | 3 | 24px |

### Responsive Breakpoints
| Name | Width | Usage |
|------|-------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop (sidebar visible) |
| `xl` | 1280px | Large desktop |

---

## Icons

**Library:** Lucide React (consistent with shadcn/ui)

**Sizes:**
| Size | Pixels | Class | Usage |
|------|--------|-------|-------|
| Small | 16px | `size-4` | Inline, badges |
| Default | 20px | `size-5` | Menu items, buttons |
| Large | 24px | `size-6` | Headers, empty states |

**Common Icons:**
- Navigation: `FolderKanban`, `FileText`, `Settings`
- Actions: `PanelLeft`, `PanelLeftClose` (sidebar toggle)
- Status: `Lock`, `Unlock`, `AlertCircle`
- Git: `GitBranch`, `GitCommit`, `Upload`

---

## Animations

### Transitions
```css
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
--transition-slow: 300ms ease;

/* Sidebar transition */
transition-[width] duration-200 ease-linear
```

### Micro-interactions
- **Hover**: Background color shift, 150ms
- **Focus**: Ring outline, 0ms (immediate)
- **Active**: Scale 0.98, 100ms
- **Sidebar collapse**: Width transition, 200ms

### Status Animations
```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}
.pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
```

---

## Card Elevation System (Phase 03)

### Utility Classes

**`card-hover-lift`** - Subtle elevation effect on hover:
```css
.card-hover-lift {
  @apply transition-all duration-200;
}
.card-hover-lift:hover {
  @apply -translate-y-0.5 shadow-lg;
  border-color: hsl(var(--border) / 0.6);
}
```

**Usage:**
- **Project cards**: `<Card className="p-6 card-hover-lift rounded-lg">`
- **Add New cards**: `<button className="card-hover-lift rounded-lg">`

**Behavior:**
- Transform: -2px Y-axis lift on hover
- Shadow: Elevates from default to `shadow-lg`
- Border: Softens border opacity to 60%
- Duration: 200ms smooth transition

**`card-elevated`** - Static elevated state:
```css
.card-elevated {
  @apply shadow-xl;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
```

### Component Applications

| Component | Class Combination | Effect |
|-----------|------------------|--------|
| ProjectCard | `p-6 card-hover-lift rounded-lg` | Hover elevation + border fade |
| Add New Project | `card-hover-lift rounded-lg` | Dashed border + hover lift |
| Settings Button | `hover:bg-secondary` | Background change only |

---

## Accessibility

- **Contrast**: Minimum 4.5:1 (WCAG AA)
- **Focus states**: 2px ring with `--ring` color
- **Touch targets**: Minimum 44x44px
- **Keyboard**: All interactive elements focusable
- **Screen readers**: Proper ARIA labels, sr-only text
- **Reduced motion**: Respects `prefers-reduced-motion`
- **Tooltips**: Shown on collapsed sidebar items

---

## Dark/Light Mode

**Implementation:**
```tsx
// Tailwind class strategy
<html className="dark">
  {/* CSS variables switch automatically */}
</html>
```

**CSS Variables:**
```css
:root { /* Light theme */ }
.dark { /* Dark theme */ }
```

**Primary Theme:** Dark mode (developer preference)

---

## UI Components Inventory

### Shadcn/ui Components (12)
`Button`, `Input`, `Card`, `Badge`, `Label`, `Skeleton`, `Sidebar`, `Sheet`, `Dialog`, `Tooltip`, `Collapsible`, `Separator`

### Custom Components (9)
`AppSidebar`, `ProjectCard`, `Header`, `LockStatus`, `LockBanner`, `FileTree`, `MarkdownPreview`, `MonacoEditor`, `CreateProjectDialog`

---

## File Structure
```
apps/frontend/
├── app/
│   ├── globals.css          # CSS variables, base styles
│   └── (dashboard)/layout.tsx # SidebarProvider wrapper
├── components/
│   ├── ui/                  # Shadcn/ui primitives
│   │   ├── sidebar.tsx      # Full sidebar component system
│   │   └── ...
│   └── sidebar.tsx          # AppSidebar implementation
└── tailwind.config.ts       # Theme extension
```

---

*Last updated: 2026-01-04 (Phase 03: Component consistency - card-hover-lift utility, button refactor)*
