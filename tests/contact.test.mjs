import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/contact.js';

const values = { name: 'Test Person', email: 'test@example.com', company: 'Example', serviceInterest: 'AI Automation', message: 'Please help us automate our document intake.' };
function submit(overrides = {}, env = {}, origin = 'https://alvocor.com') {
  const body = new FormData();
  for (const [key, value] of Object.entries({ ...values, ...overrides })) body.set(key, value);
  return onRequestPost({ request: new Request('https://alvocor.com/api/contact', { method: 'POST', headers: { Origin: origin, Accept: 'application/json' }, body }), env });
}
test('rejects invalid input and cross-origin submissions', async () => {
  assert.equal((await submit({ email: 'invalid' })).status, 400);
  assert.equal((await submit({ message: 'short' })).status, 400);
  assert.equal((await submit({ serviceInterest: 'Other' })).status, 400);
  assert.equal((await submit({}, {}, 'https://other.example')).status, 403);
});
test('does not claim delivery without configuration; honeypot does not send', async () => {
  assert.equal((await submit()).status, 503);
  assert.equal((await submit({ website: 'spam.example' })).status, 200);
});
test('sends validated input and handles provider failures', async () => {
  const originalFetch = globalThis.fetch;
  const env = { RESEND_API_KEY: 'test-key', CONTACT_FROM: 'website@alvocor.com' };
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://api.resend.com/emails');
      const email = JSON.parse(options.body);
      assert.equal(email.reply_to, values.email);
      assert.deepEqual(email.to, ['contact@alvocor.com']);
      assert.ok(email.text.includes(values.message));
      return new Response('{}', { status: 200 });
    };
    assert.equal((await submit({}, env)).status, 200);
    globalThis.fetch = async () => new Response('{}', { status: 429 });
    assert.equal((await submit({}, env)).status, 502);
    globalThis.fetch = async () => { throw new Error('Network unavailable'); };
    assert.equal((await submit({}, env)).status, 502);
  } finally { globalThis.fetch = originalFetch; }
});
