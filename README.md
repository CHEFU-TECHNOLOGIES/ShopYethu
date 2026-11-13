# ShopYethu

Marketplace dashboard built with Next.js, React, TypeScript, and Tailwind CSS.

```sh
npm ci
npm run dev
```

Set `PORT` to change the development server port. SSO returns to the registered hosted domain.
The registered SSO domain is `https://shopyethu-admin.chefu.co.za`.

```sh
npm run typecheck
npm run build
npm start
```

Dashboard records are supplied through the `initialData` prop in
`src/components/dashboard/Dashboard.tsx`. The homepage currently supplies empty
arrays. The homepage requires a CheFu account with the `admin` role. Marketplace
data is not connected to a persistent backend yet.

SSO uses the existing central CheFu session, following the company website's
browser flow. ShopYethu calls `GET /auth/shopyethu/session` on the central backend
with `credentials: 'include'`. The backend validates the session through
`AuthGuard`, then `ShopYethuAdminGuard` reads the current roles from the central
user profile. Removing the admin role denies the next protected request even if
old signed session metadata still contains it. The UI rechecks on load and when
the tab regains focus. Future marketplace endpoints must also apply both guards;
the client session gate alone does not protect backend data.

Login, account settings, account selection and global sign-out go directly to
CheFu-Account. ShopYethu has no auth route handlers, local session cookie,
OAuth callback, token storage or authentication secret.


These public settings are included at build time. Deploy the backend session
endpoint and the CheFu-Account return-origin registration before testing against
the hosted SSO. Only `https://shopyethu-admin.chefu.co.za` is registered for
ShopYethu; localhost is not an allowed return origin. The browser sends the
backend's existing HTTP-only session cookie; ShopYethu does not need to read it.
Dashboard records remain empty until a persistent marketplace backend is added.

Use the header’s **Colour theme** selector for Light, Dark, or System appearance.
The browser remembers the preference under `shopyethu-theme`. System follows the
device setting. The theme also applies to record details and the not-found page.

shadcn UI uses the New York style, Tailwind v4 CSS variables, and the existing
`@/*` aliases. Configuration is in `components.json`; shared theme tokens are in
`src/styles/theme.css`. Run `npm exec -- shadcn info` to inspect the setup, or
`npm exec -- shadcn add <component>` to add a component.
