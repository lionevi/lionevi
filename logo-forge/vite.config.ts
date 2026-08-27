import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { uxpManifestPlugin } from './scripts/vite-plugin-uxp.mjs';

/**
 * Le panneau UXP est charge depuis le systeme de fichiers par Adobe UXP Developer
 * Tool : toutes les URLs doivent donc etre relatives et le bundle mono-fichier
 * (UXP ne supporte pas le code-splitting par imports dynamiques ES).
 */
export default defineConfig({
  root: fileURLToPath(new URL('./src', import.meta.url)),
  base: './',
  plugins: [react(), uxpManifestPlugin()],
  // Le repo parent porte sa propre config PostCSS : on l isole explicitement.
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
    },
  },
  build: {
    target: 'es2021',
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    sourcemap: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      // Modules fournis par l'hote UXP : ils ne doivent jamais etre bundles.
      external: ['uxp', 'illustrator', 'photoshop'],
      output: {
        // UXP charge le panneau comme un script classique : pas de module ES,
        // pas de code-splitting, pas d attribut crossorigin.
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
