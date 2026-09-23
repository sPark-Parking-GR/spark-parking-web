import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const isProd = process.env.NODE_ENV === 'production'

// BFF dashboard: the browser only talks to this Next origin, so connect-src stays
// 'self' apart from the Google Maps JS API, which the facility location picker loads
// client-side (script + tile/metadata fetches + Roboto webfont). places.googleapis.com
// is a separate origin from maps.googleapis.com — the Places API (New) autocomplete/
// place-details RPCs go there, not through the classic Maps REST endpoints.
// 'unsafe-inline'/'unsafe-eval' (dev only) cover Next's hydration bootstrap;
// 'wasm-unsafe-eval' lets the Maps vector renderer compile its WASM in prod.
// frame-ancestors 'none' blocks clickjacking.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://maps.googleapis.com ${isProd ? "'wasm-unsafe-eval'" : "'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://maps.googleapis.com https://maps.gstatic.com https://places.googleapis.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // geolocation=(self): the facility location picker's "use my location" button needs it;
  // camera/microphone stay fully disabled since nothing in the app uses them.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  ...(isProd
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
]

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@spark/ui', '@spark/types'],
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Admin pages carry tenant lifecycle/audit data — never let a shared or
      // public machine's browser cache serve them back after logout.
      {
        source: '/admin/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ]
  },
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
