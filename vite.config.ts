import { defineConfig } from 'vite';

// Supply the public HTTPS root URL when deploying. Social crawlers read static HTML.
export default defineConfig({
  plugins: [{
    name: 'public-social-metadata',
    transformIndexHtml(html) {
      const configured = process.env.PUBLIC_SITE_URL;
      if (!configured) return html;
      const url = new URL(configured);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('PUBLIC_SITE_URL must be an HTTP(S) URL');
      if (url.pathname !== '/' || url.search || url.hash) throw new Error('Deploy this build at the origin root; PUBLIC_SITE_URL must not include a path, query, or hash');
      const escaped = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
      return html.replace('content="/ogp.png"', `content="${escaped(new URL('/ogp.png', url).href)}"`)
        .replace('</head>', `  <meta property="og:url" content="${escaped(url.href)}" />\n  <link rel="canonical" href="${escaped(url.href)}" />\n</head>`);
    },
  }],
});
