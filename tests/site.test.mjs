import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('production pages preserve routes, metadata and local asset links', { skip: !existsSync('dist/index.html') }, () => {
  for (const page of ['index', 'About', 'Services', 'Portfolio', 'Contact', 'Privacy', '404']) {
    const html = readFileSync(`dist/${page}.html`, 'utf8');
    assert.ok(!/asp-(?:page|for|validation)|@RenderBody|~\//.test(html));
    assert.ok(html.includes('<h1'));
    assert.ok(html.includes('rel="canonical"'));
    const scripts = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)];
    assert.equal(scripts.length, 2);
    scripts.forEach(match => JSON.parse(match[1]));
    for (const match of html.matchAll(/(?:src|href)="(\/[^"?#]*)/g)) {
      const pathname = match[1];
      if (pathname.startsWith('//')) continue;
      assert.ok(existsSync(resolve('dist', '.' + pathname)) || existsSync(resolve('dist', '.' + pathname + '.html')), `${page}: missing ${pathname}`);
    }
    if (!['404', 'Privacy'].includes(page)) assert.ok(html.includes('aria-current="page"'), `${page}: missing active navigation`);
  }
});
