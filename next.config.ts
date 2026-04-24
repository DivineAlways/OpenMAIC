import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : 'standalone',
  transpilePackages: ['mathml2omml', 'pptxgenjs'],
  serverExternalPackages: ['undici'],
  // Bundle pre-seeded classroom JSON files into the serverless function on Vercel
  outputFileTracingIncludes: {
    '/api/classroom': ['./data/classrooms/**/*.json'],
  },
};

export default nextConfig;
