import { readFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Emet `manifest.json` et les icones du plugin dans `dist/`, en synchronisant
 * la version du manifeste avec celle de `package.json` — un decalage entre les
 * deux fait echouer la validation d'Adobe lors de la soumission au Marketplace.
 */
export function uxpManifestPlugin() {
  return {
    name: 'logo-forge:uxp-manifest',
    apply: 'build',
    enforce: 'post',
    /**
     * UXP n implemente pas les modules ES ni l attribut `crossorigin` : le
     * panneau doit charger un script classique, sans quoi la vue reste blanche.
     */
    transformIndexHtml(html) {
      return html.replace(/\s*type="module"/g, '').replace(/\s*crossorigin/g, '');
    },
    async generateBundle() {
      const pkg = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
      const manifestPath = path.join(projectRoot, 'src', 'manifest.json');
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      manifest.version = pkg.version;

      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: `${JSON.stringify(manifest, null, 2)}\n`,
      });
    },
    async closeBundle() {
      const iconsSrc = path.join(projectRoot, 'src', 'assets', 'icons');
      if (!existsSync(iconsSrc)) return;
      const iconsOut = path.join(projectRoot, 'dist', 'icons');
      await mkdir(iconsOut, { recursive: true });
      for (const entry of await readdir(iconsSrc)) {
        await copyFile(path.join(iconsSrc, entry), path.join(iconsOut, entry));
      }
    },
  };
}
