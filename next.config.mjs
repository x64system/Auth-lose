/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  images: {
    remotePatterns: [
      // FIX HIGH-04: Restrito a domínios explícitos (sem wildcard) para prevenir SSRF
      { protocol: 'https', hostname: 'loselost.vercel.app' },
      { protocol: 'https', hostname: 'auth-lose-kappa.vercel.app' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    // FIX HIGH-04: dangerouslyAllowSVG desativado — SVGs podem conter scripts
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    // FIX CRIT-04: CORS restrito ao domínio real — wildcard + credentials é inválido por spec
    const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "https://loselost.vercel.app";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // FIX HIGH-05: Content-Security-Policy adicionada
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://loselost.vercel.app https://auth-lose-kappa.vercel.app; frame-ancestors 'none'; object-src 'none'; base-uri 'self';" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
            : [])
        ]
      },
      {
        source: "/api/:path*",
        headers: [
          // FIX CRIT-04: Origem específica em vez de wildcard
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: allowedOrigin },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
          { key: "Vary", value: "Origin" }
        ]
      }
    ];
  }
};

export default nextConfig;
