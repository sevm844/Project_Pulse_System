import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CLAUDE.md is the single place for project rules, so skip the auto-generated AGENTS.md.
  agentRules: false,
  // The server does not announce what it runs on.
  poweredByHeader: false,
  // Headers on every page: it cannot be shown inside another site (clickjacking), files are not guessed to be something else, the address a
  // visitor came from is not sent to other sites, and powerful browser features the system never uses are switched off.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
