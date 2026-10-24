const services = new Set(['Enterprise Software Development', 'AI Automation', 'Cloud Solutions', 'API Development & Integration', 'Application Modernization', 'Technology Consulting']);
const fallback = 'The inquiry could not be sent right now. Please email contact@alvocor.com directly.';
export async function onRequestPost({ request, env }) {
  const reply = (message, status = 200, code) => {
    if (request.headers.get('Accept')?.includes('application/json')) {
      return Response.json({ message, ...(code ? { code } : {}) }, { status, headers: { 'Cache-Control': 'no-store' } });
    }
    const safe = message.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Contact ALVOCOR</title><p>${safe}</p><a href="/Contact">Return to contact page</a></html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  };
  if (request.headers.get('Origin') !== new URL(request.url).origin) return reply('Invalid request origin.', 403);
  if (Number(request.headers.get('Content-Length')) > 20000) return reply('Inquiry is too large.', 413);
  let data;
  try { data = await request.formData(); } catch { return reply('Invalid form submission.', 400); }
  const get = (key) => typeof data.get(key) === 'string' ? data.get(key).trim() : '';
  if (get('website')) return reply('Thank you. Your inquiry has been received.');
  const { name, email, company, serviceInterest, message } = Object.fromEntries(['name', 'email', 'company', 'serviceInterest', 'message'].map(key => [key, get(key)]));
  if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || /[\r\n]/.test(email) || company.length > 150 || !services.has(serviceInterest) || message.length < 20 || message.length > 3000) {
    return reply('Please provide a valid name, email, service interest, and project details (20–3000 characters).', 400);
  }
  const missing = ['RESEND_API_KEY', 'CONTACT_FROM'].filter(key => !env[key]?.trim());
  if (missing.length) {
    console.error('Contact email configuration missing', { missing });
    return reply(fallback, 503, 'EMAIL_NOT_CONFIGURED');
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.CONTACT_FROM.trim(), to: [env.CONTACT_TO?.trim() || 'contact@alvocor.com'], reply_to: email,
        subject: `ALVOCOR inquiry: ${serviceInterest}`,
        text: `Name: ${name}\nEmail: ${email}\nCompany: ${company}\nService interest: ${serviceInterest}\n\nProject details:\n${message}` }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      // Never log the provider body: it can contain email addresses or other submitted data.
      console.error('Contact email provider rejected request', { status: response.status });
      const code = response.status === 401 ? 'EMAIL_AUTH_FAILED'
        : response.status === 403 ? 'EMAIL_SENDER_REJECTED'
        : response.status === 429 ? 'EMAIL_RATE_LIMITED' : 'EMAIL_PROVIDER_ERROR';
      return reply(fallback, 502, code);
    }
    return reply('Thank you. Your inquiry has been sent.');
  } catch {
    console.error('Contact email provider request failed or timed out');
    return reply(fallback, 502, 'EMAIL_PROVIDER_UNAVAILABLE');
  }
}

export function onRequestGet() {
  return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
}
