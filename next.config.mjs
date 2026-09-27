/** @type {import('next').NextConfig} */
// LeadScout NECESITA servidor: las rutas /api/* hacen fetch a websites de
// terceros, llaman a OpenRouter y a la API de Reddit, y validan la sesión.
// Por eso NO usamos `output: "export"` (a diferencia de cvmakerapp).
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
  },
};
export default nextConfig;
