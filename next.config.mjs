/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Embarque l'index de recherche (généré au build) DANS la fonction serverless
  // de l'API, pour qu'il soit lisible en ligne (Vercel) sans dépendre du disque local.
  outputFileTracingIncludes: {
    "/api/salaires/search": ["./data/search-index.json"],
  },
};

export default nextConfig;
