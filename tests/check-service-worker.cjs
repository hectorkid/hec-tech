const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

async function check(base) {
  const handlers = {};
  const entries = new Map([[base + 'index.html', new Response('app')]]);
  const key = request => typeof request === 'string' ? request : request.url;
  const cache = {
    put: async (request, response) => entries.set(key(request), response),
    match: async request => entries.get(key(request))?.clone()
  };
  let offline = false;
  const context = {
    URL,
    self: {location: new URL(base + 'sw.js'), addEventListener: (name, fn) => handlers[name] = fn},
    caches: {open: async () => cache},
    fetch: async request => {
      if (offline) throw new Error('offline');
      return new Response(request.url.endsWith('privacy.html') ? 'privacy' : 'app updated');
    }
  };
  vm.runInNewContext(fs.readFileSync('sw.js', 'utf8'), context);
  function navigate(path) {
    let result;
    handlers.fetch({request: {url: base + path, method: 'GET', mode: 'navigate'}, respondWith: promise => result = promise});
    return result;
  }
  assert.equal(await (await navigate('privacy.html')).text(), 'privacy');
  offline = true;
  assert.equal(await (await navigate('index.html')).text(), 'app');
  assert.equal(await (await navigate('')).text(), 'app');
  assert.equal(await (await navigate('privacy.html')).text(), 'privacy');
  await assert.rejects(navigate('missing.html'), /offline/);
  offline = false;
  await navigate('');
  offline = true;
  assert.equal(await (await navigate('index.html')).text(), 'app updated');
}
Promise.all([check('https://example.com/'), check('https://example.com/hec-tech/')])
  .then(() => console.log('Service worker navigation isolation checks passed'))
  .catch(error => {console.error(error); process.exitCode = 1;});
