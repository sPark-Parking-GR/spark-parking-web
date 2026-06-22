import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

// BFF dashboard: the browser only talks to this Next origin, so connect-src stays
// 'self' apart from the Google Maps JS API, which the facility location picker loads
// client-side (script + tile/metadata fetches + Roboto webfont).
// 'unsafe-inline'/'unsafe-eval' (dev only) cover Next's hydration bootstrap;
// 'wasm-unsafe-eval' lets the Maps vector renderer compile its WASM in prod.
// frame-ancestors 'none' blocks clickjacking.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://maps.googleapis.com ${isProd ? "'wasm-unsafe-eval'" : "'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://maps.googleapis.com https://maps.gstatic.com",
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
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
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
  transpilePackages: ['@spark/ui', '@spark/types'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
