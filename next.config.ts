import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // @ts-ignore - suppress ts error in next config if exists
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
