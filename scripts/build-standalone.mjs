import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Inline the production bundle so file:// needs no server, imports, or network.
const root = resolve(import.meta.dirname, '..');
let html = await readFile(resolve(root, 'dist/index.html'), 'utf8');
const icon = `data:image/svg+xml;base64,${(await readFile(resolve(root, 'public/favicon.svg'))).toString('base64')}`;
const scriptTag = html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/);
const styleTag = html.match(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
if (!scriptTag || !styleTag) throw new Error('Expected a single Vite JS and CSS bundle');
let js = await readFile(resolve(root, 'dist', scriptTag[1].replace(/^\//, '')), 'utf8');
const css = await readFile(resolve(root, 'dist', styleTag[1].replace(/^\//, '')), 'utf8');
js = js.replaceAll('/favicon.svg', icon).replaceAll('</script', '<\\/script');
html = html.replace(scriptTag[0], '').replace(styleTag[0], `<style>${css}</style>`)
  .replace('href="/favicon.svg"', `href="${icon}"`)
  .replace(/\s*<meta property="og:image"[^>]*>/, '')
  .replace('</body>', `<script type="module">${js}</script>\n</body>`);
const output = resolve(root, 'ouo-play.html');
await writeFile(output, html);
console.log(`Standalone game: ${output} (${Buffer.byteLength(html)} bytes)`);
