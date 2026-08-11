# DevLens Web

Frontend foundation for the DevLens Engineering Intelligence Platform.

## Stack

- React
- Vite
- TypeScript
- TanStack Router
- TanStack Query
- Zustand
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Apache ECharts
- TanStack Table
- Vitest
- React Testing Library
- Playwright

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

3. Generate OpenAPI types:

   ```bash
   npm run generate:api
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

## Available scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run generate:api`

## Architecture

- `src/app`: app providers, query client, and router bootstrap
- `src/routes`: route definitions and route-level placeholders
- `src/features`: feature-scoped API hooks and schemas
- `src/components`: shared layout and UI primitives
- `src/lib`: env parsing, API client, and utilities
- `src/store`: Zustand client state
- `src/api/generated`: OpenAPI-generated TypeScript contracts

## Data flow

`Page -> Query Hook -> API Client -> Backend`

- Pages render route-level UI and delegate backend reads to feature hooks.
- Query hooks use TanStack Query for caching, retries, and loading/error state.
- The shared API client centralizes base URL handling and response parsing.
- OpenAPI-generated types keep the frontend aligned with backend contracts.
