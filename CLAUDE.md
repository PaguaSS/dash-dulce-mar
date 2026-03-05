# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context

Admin UI for managing Dulce Mar content (Categories, Catalog, Recipes, Ingredients, Social Posts, Agenda) protected by JWT authentication.

## Commands

```bash
nvm use                    # ALWAYS run before npm commands (Node v24)
npm run dev                # Vite dev server at localhost:5173
npm run build              # TypeScript check + Vite build
npm run lint               # ESLint
npm run preview            # Serve production build locally

# Testing
npx vitest                 # Run unit tests
npx vitest run             # Run unit tests once
npx vitest <file>          # Run single test file
npx cypress open           # Cypress E2E interactive
npx cypress run            # Cypress E2E headless
```

## Architecture

- **Stack**: React 19 + Vite + TypeScript + MUI v7 + Zustand + Axios
- **Rendering**: Client-side only (NO Server Components)
- **API Layer**: All calls go through `src/services/api.ts` (Axios instance with JWT interceptor and auto-refresh)
- **State**: Zustand for global (auth, user), useState for local
- **Forms**: react-hook-form + zod schemas
- **i18n**: react-i18next - NEVER hardcode strings, use `t()` hook. Maintain parity between `src/locales/en.json` and `es.json`

## Project Structure

- `src/services/` - API wrappers (one per domain: auth, category, user, etc.)
- `src/store/` - Zustand stores (authStore, userStore)
- `src/pages/` - Feature pages with colocated components (e.g., `Categories/CategoryForm.tsx`)
- `src/components/` - Shared components
- `src/types/` - TypeScript interfaces
- `src/theme/theme.ts` - MUI theme config

## UI Rules

- Use MUI components: `Box` over `div`, `Stack` for flex layouts, `sx` prop for styling
- Use theme colors (`primary.main`, `secondary.main`) not hardcoded hex
- Icons: `lucide-react` (Edit, Plus, Trash2), `@mui/icons-material`
- Tables: light blue header (`bgcolor: '#eff6ff'`), `TablePagination` with `rowsPerPageOptions={[10, 20, 50]}`
- Status: `Chip` component (variant="outlined", size="small") with success/error colors
- Navigation: Use `BackButton` component for back/cancel actions
- Forms: `TextField` for inputs, `Button variant="contained"` for primary actions

## Theme Colors

- Primary: `#FF3399` (Rosa Neón) - CTAs, emphasis
- Secondary: `#66D9EF` (Celeste Aqua) - brand, focus states
- Background: `#FFFFFF`

## Coding Standards

- Functional components with hooks
- Container/Presentational pattern for complex components
- Custom hooks for reusable logic (`useAuth`, etc.)
- API calls only in services layer, never directly in components
- Environment config via `.env` files (`VITE_API_URL`)

## Rules

- Be concise
- No explanations unless requested
