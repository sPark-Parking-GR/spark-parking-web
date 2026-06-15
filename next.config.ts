import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@parqin/ui', '@parqin/auth', '@parqin/maps', '@parqin/types'],
}

export default nextConfig
