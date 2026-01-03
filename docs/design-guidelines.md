# AI Toolkit Sync Platform - Design Guidelines

## Overview
Design system for a developer-focused docs synchronization platform. Emphasizes clarity, efficiency, and professional aesthetics with dark mode as primary theme.

---

## Color Palette

### Dark Theme (Primary)
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0F172A` | Main background |
| `--bg-secondary` | `#1E293B` | Cards, panels |
| `--bg-tertiary` | `#334155` | Elevated elements |
| `--border` | `#475569` | Borders, dividers |
| `--text-primary` | `#F1F5F9` | Primary text |
| `--text-secondary` | `#94A3B8` | Secondary text |
| `--text-muted` | `#64748B` | Muted text, placeholders |

### Accent Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-primary` | `#3B82F6` | Primary actions, links |
| `--accent-hover` | `#2563EB` | Hover states |
| `--success` | `#22C55E` | Unlocked status, success |
| `--error` | `#EF4444` | Locked status, errors |
| `--warning` | `#F59E0B` | Warnings, pending states |

### Light Theme
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary-light` | `#FFFFFF` | Main background |
| `--bg-secondary-light` | `#F8FAFC` | Cards, panels |
| `--text-primary-light` | `#0F172A` | Primary text |
| `--text-secondary-light` | `#475569` | Secondary text |

---

## Typography

### Font Stack
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

### Type Scale
| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `h1` | 24px | 700 | 1.2 | Page titles |
| `h2` | 20px | 600 | 1.3 | Section headers |
| `h3` | 16px | 600 | 1.4 | Card titles |
| `body` | 14px | 400 | 1.5 | Body text |
| `small` | 12px | 400 | 1.4 | Captions, labels |
| `code` | 13px | 400 | 1.5 | Code, monospace |

---

## Spacing System

Based on 4px base unit:
| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing |
| `--space-2` | 8px | Icon gaps |
| `--space-3` | 12px | Button padding |
| `--space-4` | 16px | Card padding |
| `--space-5` | 20px | Section gaps |
| `--space-6` | 24px | Large gaps |
| `--space-8` | 32px | Section margins |

---

## Components

### Status Indicators

**Locked Status (Red)**
```html
<span class="status-locked">
  <span class="status-dot bg-red-500"></span>
  Locked
</span>
```
- Background: `#EF4444` (solid dot)
- Text: `#FCA5A5` (light red)
- Use pulse animation for active lock

**Unlocked Status (Green)**
```html
<span class="status-unlocked">
  <span class="status-dot bg-green-500"></span>
  Unlocked
</span>
```
- Background: `#22C55E` (solid dot)
- Text: `#86EFAC` (light green)

### Buttons

**Primary Button**
```css
.btn-primary {
  background: #3B82F6;
  color: #FFFFFF;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: background 150ms;
}
.btn-primary:hover {
  background: #2563EB;
}
```

**Secondary Button**
```css
.btn-secondary {
  background: transparent;
  border: 1px solid #475569;
  color: #F1F5F9;
  padding: 8px 16px;
  border-radius: 6px;
}
```

**Danger Button**
```css
.btn-danger {
  background: #DC2626;
  color: #FFFFFF;
}
```

### Cards
```css
.card {
  background: #1E293B;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 16px;
}
```

### Form Inputs
```css
.input {
  background: #0F172A;
  border: 1px solid #475569;
  border-radius: 6px;
  padding: 8px 12px;
  color: #F1F5F9;
}
.input:focus {
  border-color: #3B82F6;
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
```

### Lock Status Banner
```css
.lock-banner {
  background: linear-gradient(90deg, #7F1D1D 0%, #991B1B 100%);
  border-left: 4px solid #EF4444;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
```

---

## Layout Patterns

### Sidebar Navigation
- Width: 240px (desktop), collapsible
- Background: `--bg-secondary`
- Logo area: 64px height
- Nav items: 40px height, 8px padding

### Content Area
- Max-width: 1200px (centered)
- Padding: 24px
- Card grid: 1 col mobile, 2-3 cols desktop

### Responsive Breakpoints
| Name | Width | Usage |
|------|-------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |

---

## Icons

Use Lucide Icons (consistent with Tailwind ecosystem):
- Size: 16px (small), 20px (default), 24px (large)
- Stroke width: 1.5px
- Color: inherit from parent

Common icons:
- Lock: `<LockIcon />`
- Unlock: `<UnlockIcon />`
- Settings: `<SettingsIcon />`
- Git: `<GitBranchIcon />`
- Save: `<SaveIcon />`
- Push: `<UploadCloudIcon />`
- Edit: `<PencilIcon />`

---

## Animations

### Micro-interactions
```css
/* Hover transitions */
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;

/* Status pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.pulse { animation: pulse 2s infinite; }
```

### Loading States
- Skeleton: `animate-pulse` with `bg-slate-700`
- Spinner: 20px circle, 2px border, rotating

---

## Accessibility

- Minimum contrast ratio: 4.5:1 (WCAG AA)
- Focus states: visible 2px ring
- Interactive elements: minimum 44x44px touch target
- Reduced motion: respect `prefers-reduced-motion`
- Keyboard navigation: all interactive elements focusable

---

## Dark/Light Mode Toggle

```javascript
// Toggle class on <html> element
document.documentElement.classList.toggle('dark');
```

CSS variable approach:
```css
:root { /* Light theme variables */ }
.dark { /* Dark theme variables */ }
```

---

## File Structure
```
docs/wireframes/
  dashboard.html        # Projects list view
  project-settings.html # Project configuration
  docs-editor.html      # Monaco editor view
```

---

*Last updated: 2026-01-03*
