/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // `output` est volontairement absent.
  // En particulier, PAS de `output: 'standalone'` : Vercel construit son
  // propre format de sortie a partir du dossier `.next` et le mode standalone
  // entre en conflit avec ses fonctions serverless. Le mode standalone n'a de
  // sens que pour un hebergement autogere (Docker, VPS).

  images: {
    // `remotePatterns` remplace l'option `images.domains`, depreciee depuis
    // Next.js 14 : elle accepte les jokers de sous-domaine et restreint le
    // protocole, ce que `domains` ne permet pas.
    remotePatterns: [
      // Supabase Storage — couvre tous les projets (<ref>.supabase.co),
      // qu'il s'agisse des URL publiques ou des URL signees.
      { protocol: 'https', hostname: '**.supabase.co' },
      // Images de demonstration.
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Photos de profil des comptes Google.
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  experimental: {
    serverActions: { bodySizeLimit: '4mb' },
  },
};

export default nextConfig;
