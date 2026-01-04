# Sidebar CCS Config Refactor Plan

## Overview
Refactor sidebar component to match CCS Config design from screenshot.

## Status: Completed

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Design Analysis & CSS Variables | Completed | - |
| 2 | Sidebar Implementation | In Progress | [phase-02](./phase-02-sidebar-implementation.md) |

## Design Specs (from screenshot)

### Colors
- Background: `#1a1512` (dark warm brown)
- Text Primary: `#ffffff`
- Text Muted: `#a8a29e` (warm gray)
- Section Title: `#78716c`
- Active Item: `#c2674a` (terracotta/coral)
- Badge Border: `#c2674a`

### Typography
- Font: Inter (Google Fonts)
- Header: 18px, 600 weight
- Section: 12px, 500 weight
- Menu Item: 14px, 400-500 weight

### Structure
```
[Logo] CCS Config
─────────────────
General
  [icon] Home (active)
  [icon] Analytics

Identity & Access
  [icon] API Profiles [OpenRouter badge]
  [icon] CLIProxy Plus >
  [icon] GitHub Copilot
  [icon] Accounts >

System
  [icon] Health
  [icon] Settings
─────────────────
[Footer icon]
```

## Files to Modify
- `apps/frontend/components/sidebar.tsx` - Main sidebar
- `apps/frontend/app/globals.css` - CSS variables (if needed)
