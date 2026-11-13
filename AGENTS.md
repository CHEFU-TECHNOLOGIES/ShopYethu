# ShopYethu

Next.js App Router, React, TypeScript, and Tailwind CSS. Use npm.

- Keep source files below 500 lines; split components, types, and utilities when needed.
- Run `npm ci` to install locked dependencies.
- Run `npm run dev` for local development. Next.js respects the `PORT` environment variable.
- Run `npm run typecheck` and `npm run build` before delivering code changes.
- Frontend routes live in `src/app/(frontend)/`.
- Shared UI lives in `src/components/`; domain types live in `src/types/`.
- Authentication uses the central CheFu session cookie; backend guards require current admin access.
- There is currently no marketplace database or persistent marketplace backend.
- Keep empty states useful and never report that an unavailable operation saved successfully.
