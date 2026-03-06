import type { NextConfig } from "next";

const repo = "docpod"; // your GitHub repo name

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "export",
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
  trailingSlash: true,
};

export default nextConfig;
