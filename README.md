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

The homepage requires a central account with the `admin` role. The Overview,
Applications, Sellers and Complaints screens load the shared marketplace API at
`https://api.chefu.co.za/shopyethu/admin`. Mobile applications submitted to
`POST /shopyethu/application` and admin application reviews use the same
Firestore collection, `shopyethu_applications`.

Overview and review tabs share records for the current dashboard session.
Switching tabs or returning to the browser does not reread them; use Refresh to
check for new submissions. Review responses update the loaded application and
approval invalidates the seller list. Data is cleared when the signed-in account
changes. Failed or malformed responses show an error rather than an empty list.
The current API returns at most 100 records per section; the overview counts and
queue describe those loaded records. Listings, Orders and Activity still use
the legacy `initialData` prop and are not connected to admin endpoints yet.

SSO uses the existing central CheFu session, following the company website's
browser flow. ShopYethu calls `GET /auth/shopyethu/session` on the central backend
with `credentials: 'include'`. The backend validates the session through
`AuthGuard`, then `ShopYethuAdminGuard` reads the current roles from the central
user profile. Removing the admin role denies the next protected request even if
old signed session metadata still contains it. The UI checks once on page load
or explicit retry. Returning to the browser, switching tabs and minimizing do
not trigger requests or hide the dashboard. Concurrent checks share one request,
including development StrictMode remounts; completed results are not cached.
Session GETs use no custom headers, avoiding an extra CORS preflight. The backend
shares profile reads within a single request, so authentication and authorization
use at most one Firestore profile read, with no profile writes. Rate-limit storage
and Firebase revocation checks remain in place. Marketplace admin endpoints apply both guards;
the client session gate alone does not protect backend data.

Login, account settings, account selection and global sign-out go directly to
CheFu-Account. ShopYethu has no auth route handlers, local session cookie,
OAuth callback, token storage or authentication secret.

The sidebar account switcher follows CheFu-Account: avatar and email, saved
accounts, account settings, adding another account, and confirmed removal or
global sign-out. Saved accounts load only on the first opening of the panel;
reopening, browser focus and tab switching do not fetch the list again. Switching
uses the existing central endpoint and reloads the workspace so the session gate
checks the selected account's administrator permissions before rendering it.

These public settings are included at build time. Deploy the backend session
endpoint and the CheFu-Account return-origin registration before testing against
the hosted SSO. Only `https://shopyethu-admin.chefu.co.za` is registered for
ShopYethu; localhost is not an allowed return origin. The browser sends the
backend's existing HTTP-only session cookie; ShopYethu does not need to read it.
Deploy the backend marketplace module and this admin frontend to expose shared records.

Use the **Colour theme** selector beside the sidebar’s Workspace label for Light, Dark, or System appearance.
The browser remembers the preference under `shopyethu-theme`. System follows the
device setting. The theme also applies to record details and the not-found page.

shadcn UI uses the New York style, Tailwind v4 CSS variables, and the existing
`@/*` aliases. Configuration is in `components.json`; shared theme tokens are in
`src/styles/theme.css`. Run `npm exec -- shadcn info` to inspect the setup, or
`npm exec -- shadcn add <component>` to add a component.
