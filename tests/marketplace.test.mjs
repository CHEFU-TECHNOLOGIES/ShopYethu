import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'

function harness() {
  const modules = new Map(),
    requests = []
  let respond = () => Response.json({ applications: [] })
  function load(file) {
    if (modules.has(file)) return modules.get(file).exports
    const module = { exports: {} }
    modules.set(file, module)
    const code = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    vm.runInNewContext(code, {
      module,
      exports: module.exports,
      AbortSignal,
      Error,
      require: (id) => load(resolve(dirname(file), `${id}.ts`)),
      fetch: async (...args) => {
        requests.push(args)
        return respond(...args)
      },
    })
    return module.exports
  }
  const api = load(resolve(import.meta.dirname, '../src/lib/marketplace-admin.ts'))
  const { createMarketplaceStore } = load(
    resolve(import.meta.dirname, '../src/lib/marketplace-store.ts'),
  )
  return {
    api,
    createMarketplaceStore,
    store: createMarketplaceStore(),
    requests,
    respond: (fn) => {
      respond = fn
    },
  }
}

// Test fixtures only; these records are never bundled into the app.
const application = {
  id: 'test-applicant',
  ownerUid: 'test-applicant',
  businessName: 'Test business',
  contactName: 'Test contact',
  email: 'test@example.test',
  phone: '+27821234567',
  area: 'Cape Town',
  plans: 'Locally made products.',
  response: '',
  status: 'pending',
  reason: '',
  updatedAt: '2026-11-15T08:00:00Z',
}
const seller = {
  id: application.id,
  name: application.businessName,
  area: application.area,
  description: application.plans,
  status: 'active',
  reason: '',
}

test('overview and review tabs share one credentialed application read, including concurrent mounts', async () => {
  const h = harness()
  h.respond(() => Response.json({ applications: [application] }))
  await Promise.all([h.store.load('applications'), h.store.load('applications')])
  assert.equal(h.requests.length, 1)
  assert.equal(h.store.get('applications').rows[0].businessName, application.businessName)
  await h.store.load('applications')
  assert.equal(h.requests.length, 1, 'returning to a view reuses the loaded response')
  const [url, options] = h.requests[0]
  assert.equal(url, 'https://api.chefu.co.za/shopyethu/admin/applications')
  assert.equal(options.credentials, 'include')
  assert.equal(options.cache, 'no-store')
  assert.equal(options.headers, undefined, 'GET has no custom headers or extra preflight')
  await h.store.load('applications', true)
  assert.equal(h.requests.length, 2, 'explicit Refresh fetches new submissions')
})

test('only a valid empty backend response is treated as an empty list', async () => {
  const h = harness()
  for (const body of [
    null,
    {},
    { applications: null },
    { applications: [null] },
    { applications: [{ id: 'broken' }] },
  ]) {
    h.respond(() => Response.json(body))
    await h.store.load('applications', true)
    assert.equal(h.store.get('applications').status, 'error')
    assert.match(h.store.get('applications').error, /invalid response/)
  }
  h.respond(() => Response.json({ applications: [] }))
  await h.store.load('applications', true)
  assert.equal(h.store.get('applications').status, 'ready')
  assert.equal(h.store.get('applications').rows.length, 0)
})

test('permission errors, missing deployment and offline failures stay visible and recover with Refresh', async () => {
  const h = harness()
  for (const status of [401, 403, 404, 500]) {
    h.respond(() => Response.json({ message: 'Request denied' }, { status }))
    await h.store.load('applications', true)
    assert.equal(h.store.get('applications').status, 'error')
    assert.match(
      h.store.get('applications').error,
      status === 404 ? /not been deployed/ : /Request denied/,
    )
  }
  h.respond(() => {
    throw new Error('Offline')
  })
  await h.store.load('applications', true)
  assert.equal(h.store.get('applications').error, 'Offline')
  h.respond(() => Response.json({ applications: [application] }))
  await h.store.load('applications', true)
  assert.equal(h.store.get('applications').status, 'ready')
})

test('approval updates shared application data and invalidates seller records without a second application GET', async () => {
  const h = harness()
  h.respond((url, options) => {
    if (options.method === 'PUT') return Response.json({ ...application, status: 'approved' })
    return Response.json(
      url.endsWith('/sellers') ? { sellers: [seller] } : { applications: [application] },
    )
  })
  await Promise.all([h.store.load('applications'), h.store.load('sellers')])
  const updated = await h.api.marketplaceAdmin(`/applications/${application.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'approved' }),
  })
  h.store.replace('applications', updated)
  h.store.invalidate('sellers')
  assert.equal(h.store.get('applications').rows.filter((row) => row.status === 'pending').length, 0)
  assert.equal(h.store.get('sellers').status, 'idle')
  await Promise.all([h.store.load('applications'), h.store.load('sellers')])
  assert.equal(
    h.requests.filter(([url, options]) => url.endsWith('/applications') && !options.method).length,
    1,
  )
  assert.equal(h.requests.filter(([url]) => url.endsWith('/sellers')).length, 2)
})

test('a late GET cannot undo an approval or restore invalidated seller data', async () => {
  const h = harness()
  h.respond(() => Response.json({ applications: [application] }))
  await h.store.load('applications')
  let finish
  h.respond(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const pending = h.store.load('applications', true)
  await new Promise(setImmediate)
  h.store.replace('applications', { ...application, status: 'approved' })
  finish(Response.json({ applications: [application] }))
  await pending
  assert.equal(h.store.get('applications').rows[0].status, 'approved')
  const sellersPending = h.store.load('sellers')
  await new Promise(setImmediate)
  h.store.invalidate('sellers')
  finish(Response.json({ sellers: [seller] }))
  await sellersPending
  assert.equal(h.store.get('sellers').status, 'idle')
})

test('records and errors are scoped to a dashboard instance; a new account starts empty', async () => {
  const h = harness()
  h.respond(() => Response.json({ applications: [application] }))
  await h.store.load('applications')
  const other = h.createMarketplaceStore()
  assert.equal(other.get('applications').status, 'idle')
  assert.equal(other.get('applications').rows.length, 0)
  h.respond(() => Response.json({ message: 'Access removed' }, { status: 403 }))
  await h.store.load('applications', true)
  assert.equal(
    h.store.get('applications').rows.length,
    0,
    'a failed permission check clears previously loaded records',
  )
})
