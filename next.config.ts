import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  // @ts-expect-error - allowedDevOrigins may not exist in the local Next type package yet
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
