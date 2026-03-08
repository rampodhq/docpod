import type { NextConfig } from "next";

const repo = "docpod"; // your GitHub repo name

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
