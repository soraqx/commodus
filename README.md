# Facilitas

School facility reservation and management — React, Vite, TypeScript, Tailwind, shadcn/ui, and Convex.

## Development

```bash
npm install
npm run dev:convex   # terminal 1
npm run dev          # terminal 2
```

In the Convex dashboard, run the `seed:seedUsers` mutation once, then sign in:

| Role | Email | Password |
|------|-------|----------|
| Student | student@facilitas.edu | student123 |
| Admin | admin@facilitas.edu | admin123 |
| Superadmin | superadmin@facilitas.edu | super123 |

Sessions persist via `localStorage` (`facilitas_user_id`).
