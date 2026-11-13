import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'

const root = resolve(import.meta.dirname, '..')
function harness() {
  const cache = new Map()
  let respond = () => {
    throw new Error('offline')
  }
  const requests = []
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports
    const module = { exports: {} }
    cache.set(file, module)
    const code = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    vm.runInNewContext(code, {
      module,
      exports: module.exports,
      URL,
      AbortSignal,
      process: { env: {} },
      require: (id) => load(resolve(dirname(file), `${id}.ts`)),
      fetch: async (...args) => {
        requests.push(args)
        return respond(...args)
      },
    })
    return module.exports
  }
  return {
    requests,
    load: (path) => load(resolve(root, path)),
    setFetch: (fn) => {
      respond = fn
    },
  }
}

test('central session uses credentialed backend requests without bearer credentials or local cookies', async () => {
  const h = harness()
  h.setFetch(() =>
    Response.json({
      app: 'shopyethu',
      user: {
        uid: 'uid',
        email: 'staff@example.test',
        name: 'Staff',
        accessToken: 'must-not-copy',
      },
    }),
  )
  const { getCentralSession } = h.load('src/lib/auth/session.ts')
  const result = await getCentralSession()
  assert.equal(result.status, 'authenticated')
  assert.equal(result.user.uid, 'uid')
  assert.equal(result.user.accessToken, undefined)
  const [url, options] = h.requests[0]
  assert.equal(url, 'https://api.chefu.co.za/auth/shopyethu/session')
  assert.equal(options.credentials, 'include')
  assert.equal(options.cache, 'no-store')
  assert.equal(
    options.headers,
    undefined,
    'no custom headers or bearer token, so no preflight is needed',
  )
})

test('expired sessions, access denial, outages, and malformed responses remain distinct', async () => {
  const h = harness()
  const { getCentralSession } = h.load('src/lib/auth/session.ts')
  for (const [status, expected] of [
    [401, 'anonymous'],
    [403, 'forbidden'],
    [500, 'unavailable'],
  ]) {
    h.setFetch(() => new Response(null, { status }))
    assert.equal((await getCentralSession()).status, expected)
  }
  for (const body of [
    null,
    {},
    { app: 'liftwise', user: { uid: 'uid', email: 'email', name: 'name' } },
    { app: 'shopyethu', user: { uid: '' } },
  ]) {
    h.setFetch(() => Response.json(body))
    assert.equal((await getCentralSession()).status, 'unavailable')
  }
  h.setFetch(() => {
    throw new Error('offline')
  })
  assert.equal((await getCentralSession()).status, 'unavailable')
  const controller = new AbortController()
  controller.abort()
  const calls = h.requests.length
  assert.equal((await getCentralSession(controller.signal)).status, 'unavailable')
  assert.equal(h.requests.length, calls, 'already unmounted consumers do not start requests')
})

test('concurrent mounts share a request; cancellation does not abort other consumers or restart work', async () => {
  const h = harness()
  let finish
  h.setFetch(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const { getCentralSession } = h.load('src/lib/auth/session.ts')
  const firstMount = new AbortController()
  const first = getCentralSession(firstMount.signal)
  firstMount.abort()
  const remount = getCentralSession()
  assert.equal(getCentralSession(), remount)
  assert.equal(h.requests.length, 1)
  assert.equal(h.requests[0][1].signal.aborted, false)
  assert.equal((await first).status, 'unavailable')
  finish(
    Response.json({
      app: 'shopyethu',
      user: { uid: 'uid', email: 'staff@example.test', name: 'Staff' },
    }),
  )
  assert.equal((await remount).status, 'authenticated')
  h.setFetch(() => new Response(null, { status: 403 }))
  assert.equal(
    (await getCentralSession()).status,
    'forbidden',
    'later requests must revalidate permissions',
  )
  assert.equal(h.requests.length, 2)
})

test('outages are shared only while in flight and an explicit retry makes a fresh request', async () => {
  const h = harness()
  const { getCentralSession } = h.load('src/lib/auth/session.ts')
  const first = getCentralSession()
  const second = getCentralSession()
  assert.equal(first, second)
  assert.equal((await first).status, 'unavailable')
  assert.equal(h.requests.length, 1)
  h.setFetch(() => new Response(null, { status: 401 }))
  assert.equal((await getCentralSession()).status, 'anonymous')
  assert.equal(h.requests.length, 2)
})

test('account links go directly to central auth and preserve only the registered return origin', () => {
  const { accountUrl } = harness().load('src/lib/auth/config.ts')
  for (const path of ['/account', '/login', '/logout']) {
    const url = new URL(accountUrl(path))
    assert.equal(url.origin, 'https://myaccount.chefu.co.za')
    assert.equal(url.pathname, path)
    assert.equal(url.searchParams.get('app'), 'shopyethu')
    assert.equal(
      url.searchParams.get('returnTo'),
      `https://shopyethu-admin.chefu.co.za${path === '/logout' ? '/login' : '/'}`,
    )
  }
  assert.equal(new URL(accountUrl('/login', true)).searchParams.get('prompt'), 'select_account')
})

test('saved accounts use the central cookies and explicit, validated mutations', async () => {
  const h = harness()
  const { listSavedAccounts, switchSavedAccount, removeSavedAccount } = h.load(
    'src/lib/auth/account-sessions.ts',
  )
  h.setFetch(() =>
    Response.json({
      accounts: [
        { slot: null, email: 'staff@example.test', fullName: 'Staff', active: true },
        { slot: 2, email: 'other@example.test', active: false },
      ],
    }),
  )
  assert.equal((await listSavedAccounts()).length, 2)
  assert.equal(h.requests[0][0], 'https://api.chefu.co.za/auth/accounts')
  assert.equal(h.requests[0][1].credentials, 'include')
  assert.equal(h.requests[0][1].headers, undefined)
  h.setFetch(() => Response.json({ ok: true }))
  await switchSavedAccount(2)
  assert.equal(h.requests[1][0], 'https://api.chefu.co.za/auth/accounts/switch')
  assert.equal(h.requests[1][1].method, 'POST')
  assert.equal(h.requests[1][1].body, '{"slot":2}')
  await removeSavedAccount(2)
  assert.equal(h.requests[2][0], 'https://api.chefu.co.za/auth/accounts/2')
  assert.equal(h.requests[2][1].method, 'DELETE')
  for (const slot of [-1, 8, 0.5, NaN]) {
    await assert.rejects(switchSavedAccount(slot), /Invalid saved account/)
    await assert.rejects(removeSavedAccount(slot), /Invalid saved account/)
  }
  assert.equal(h.requests.length, 3)
})

test('malformed account lists and unconfirmed or expired mutations report failure', async () => {
  const h = harness()
  const { listSavedAccounts, switchSavedAccount, removeSavedAccount } = h.load(
    'src/lib/auth/account-sessions.ts',
  )
  h.setFetch(() =>
    Response.json({ accounts: [{ slot: 99, email: 'bad@example.test', active: false }] }),
  )
  await assert.rejects(listSavedAccounts(), /Unable to load/)
  h.setFetch(() => Response.json({ ok: false }))
  await assert.rejects(switchSavedAccount(0), /could not confirm/)
  await assert.rejects(removeSavedAccount(0), /could not confirm/)
  h.setFetch(() => Response.json({ error: 'Session expired' }, { status: 401 }))
  await assert.rejects(switchSavedAccount(0), /Session expired/)
})
