/** @type {import("next").NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', '@prisma/internals'],
  transpilePackages: [
    '@itemflow/shared',
    '@itemflow/db',
    '@itemflow/scoring',
    '@itemflow/listings',
    '@itemflow/vision',
  ],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    }
    return config
  },
}

export default nextConfig

