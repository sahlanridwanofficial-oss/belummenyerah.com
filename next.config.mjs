/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/downloads/visual-breakdown-generation-instructions.md',
        headers: [
          {
            key: 'Content-Disposition',
            value: 'attachment; filename="visual-breakdown-generation-instructions.md"',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
