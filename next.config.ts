import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
