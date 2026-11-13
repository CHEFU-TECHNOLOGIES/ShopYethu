import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function gate() {
  const values = []
  const pending = []
  const events = new Map()
  const redirects = []
  let index = 0
  let effect
  const jsx = (type, props) => ({ type, props })
  const module = { exports: {} }
  const code = ts.transpileModule(readFileSync(new URL('../src/components/auth/SessionGate.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  vm.runInNewContext(code, {
    module, exports: module.exports, AbortController,
    window: {
      location: { replace: url => redirects.push(url) },
      addEventListener: (name, listener) => events.set(name, listener),
      removeEventListener: name => events.delete(name),
    },
    document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
    require(id) {
      if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx }
      if (id === 'react') return {
        useState(initial) {
          const current = index++
          if (!(current in values)) values[current] = initial
          return [values[current], value => { values[current] = value }]
        },
        useEffect(fn) { effect ??= fn },
      }
      if (id.endsWith('/Dashboard')) return { __esModule: true, default: 'Dashboard' }
      if (id.endsWith('/brand-logo')) return { BrandLogo: 'BrandLogo' }
      if (id.endsWith('/config')) return { accountUrl: () => 'https://myaccount.chefu.co.za/login?app=shopyethu' }
      if (id.endsWith('/session')) return { getCentralSession: signal => new Promise(resolve => pending.push({ signal, resolve })) }
      throw new Error(id)
    },
  })
  const render = () => { index = 0; return module.exports.default({ initialData: {} }) }
  return { pending, redirects, events, render, mount: () => effect() }
}

const flush = () => new Promise(resolve => setImmediate(resolve))

test('dashboard stays hidden until central authorization succeeds and rechecks on focus', async () => {
  const h = gate()
  assert.equal(h.render().type, 'main')
  const cleanup = h.mount()
  h.pending[0].resolve({ status: 'authenticated', user: { uid: 'uid', email: 'staff@example.test', name: 'Staff' } })
  await flush()
  assert.equal(h.render().type, 'Dashboard')
  h.events.get('focus')()
  assert.equal(h.render().type, 'main')
  h.pending[1].resolve({ status: 'forbidden' })
  await flush()
  assert.equal(h.render().type, 'main')
  assert.equal(h.redirects.length, 0)
  cleanup()
})

test('anonymous sessions redirect centrally while forbidden and unavailable sessions remain recoverable', async () => {
  for (const status of ['anonymous', 'forbidden', 'unavailable']) {
    const h = gate()
    h.render()
    const cleanup = h.mount()
    h.pending[0].resolve({ status })
    await flush()
    assert.equal(h.render().type, 'main')
    assert.equal(h.redirects.length, status === 'anonymous' ? 1 : 0)
    cleanup()
  }
})

test('superseded and unmounted session reads cannot expose the dashboard or redirect', async () => {
  const h = gate()
  h.render()
  const cleanup = h.mount()
  h.events.get('focus')()
  assert.equal(h.pending[0].signal.aborted, true)
  h.pending[0].resolve({ status: 'authenticated', user: { uid: 'old-user' } })
  await flush()
  assert.equal(h.render().type, 'main')
  cleanup()
  assert.equal(h.pending[1].signal.aborted, true)
  h.pending[1].resolve({ status: 'anonymous' })
  await flush()
  assert.equal(h.redirects.length, 0)
})
