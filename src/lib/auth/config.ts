export const APP_ID = 'shopyethu'
export const SITE_URL = 'https://shopyethu-admin.chefu.co.za'
export const API_URL = 'https://api.chefu.co.za'
const ACCOUNT_URL = 'https://myaccount.chefu.co.za'

export function accountUrl(path: '/account' | '/logout' | '/login', switchAccount = false) {
    const url = new URL(path, ACCOUNT_URL)
    url.searchParams.set('app', APP_ID)
    url.searchParams.set(
        'returnTo',
        new URL(path === '/logout' ? '/login' : '/', SITE_URL).toString(),
    )
    if (switchAccount) url.searchParams.set('prompt', 'select_account')
    return url.toString()
}
