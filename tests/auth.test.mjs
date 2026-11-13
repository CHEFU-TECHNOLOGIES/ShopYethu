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
  assert.equal(options.headers['x-chefu-app'], 'shopyethu')
  assert.equal(options.headers.Authorization, undefined)
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
  h.setFetch((url, options) => {
    assert.equal(options.signal.aborted, true)
    throw new Error('aborted')
  })
  assert.equal((await getCentralSession(controller.signal)).status, 'unavailable')
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
