# ShopYethu

Marketplace dashboard built with Next.js, React, TypeScript, and Tailwind CSS.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Set `PORT` to change the development port.
Optionally set `NEXT_PUBLIC_SITE_URL` for the public metadata URL.

```sh
npm run typecheck
npm run build
npm start
```

Dashboard records are supplied through the `initialData` prop in
`src/components/dashboard/Dashboard.tsx`. The homepage currently supplies empty
arrays. Connect your server data and authentication before using private records.

Use the header’s **Colour theme** selector for Light, Dark, or System appearance.
The browser remembers the preference under `shopyethu-theme`. System follows the
device setting. The theme also applies to record details and the not-found page.

shadcn UI uses the New York style, Tailwind v4 CSS variables, and the existing
`@/*` aliases. Configuration is in `components.json`; shared theme tokens are in
`src/styles/theme.css`. Run `npm exec -- shadcn info` to inspect the setup, or
`npm exec -- shadcn add <component>` to add a component.
