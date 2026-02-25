/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    },
    transpilePackages: ['react-markdown', 'remark-gfm', 'unified', 'is-plain-obj', 'reactflow', 'recharts'],
};

module.exports = nextConfig;
