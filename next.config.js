/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
    webpack: (config, { isServer }) => {
        // 解决 Windows 上 Watchpack 扫描 System Volume Information 的错误
        if (isServer) {
            config.watchOptions = {
                ...config.watchOptions,
                ignored: [
                    '**/node_modules',
                    '**/.git',
                    '**/System Volume Information',
                ],
            };
        }
        return config;
    },
};

module.exports = nextConfig;