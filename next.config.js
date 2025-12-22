/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable Next.js dev indicators completely
  devIndicators: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      
      // Fix for @deck.gl/react module resolution
      config.resolve.alias = {
        ...config.resolve.alias,
        '@deck.gl/react': require.resolve('@deck.gl/react/dist/esm/index.js'),
      };
    }
    
    // Handle DuckDB WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });
    
    return config;
  },
};

module.exports = nextConfig;

