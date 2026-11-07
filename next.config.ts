import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CLAUDE.md is the single place for project rules, so skip the auto-generated AGENTS.md.
  agentRules: false,
};

export default nextConfig;
