import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' em script: único script inline do app é o ThemeScript
  // (antiflash de tema do next-themes); sem ele há FOUC no primeiro load.
  "script-src 'self' 'unsafe-inline'",
  // worker-src blob: libera o worker em blob do canvas-confetti (confete);
  // sem ele o confete cai para fallback no main thread com erro de console.
  "worker-src 'self' blob:",
  // 'unsafe-inline' em style: transform inline do dnd-kit (drag & drop)
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  // HSTS só tem efeito sobre HTTPS; inofensivo em localhost/HTTP.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
