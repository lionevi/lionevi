# Logo Forge

Exportateur de packs de logos professionnels pour **Adobe Illustrator**, bati
sur UXP.

Un document, un clic : les fichiers sources, les declinaisons de couleur, les
formats web et impression, les canvas des reseaux sociaux, les favicons, la
charte d utilisation et le LISEZ-MOI destine au client.

> **Etat : v0.1 — fondations.** Le planificateur, les presets, le nommage, le
> moteur et l interface sont operationnels. L ecriture reelle des fichiers par
> Illustrator arrive au jalon v0.2 ; en v0.1 le panneau planifie et simule le
> pack. Voir [docs/ROADMAP.md](docs/ROADMAP.md).

---

## Sommaire

- [Ce que produit Logo Forge](#ce-que-produit-logo-forge)
- [Partis pris](#partis-pris)
- [Demarrage rapide](#demarrage-rapide)
- [Arborescence du projet](#arborescence-du-projet)
- [Scripts](#scripts)
- [Documentation](#documentation)
- [Compatibilite](#compatibilite)
- [Licence](#licence)

---

## Ce que produit Logo Forge

**48 cibles d export** reparties en 8 presets. Avec trois plans de travail et
trois declinaisons activees, un pack complet compte **372 fichiers dans 66
dossiers** — tous nommes, ranges et documentes.

```
acme-pack-logo/
├── LISEZ-MOI.md
├── charte-utilisation.md
├── rapport-export.md
├── 01-fichiers-sources/      AI, AI vectorise, EPS, PDF/X-4, SVG
├── 02-web/                   SVG, PNG 500/1000/2000, WebP
├── 03-impression/            PDF/X-4 CMJN, EPS CMJN, PNG et TIFF 300 ppp
├── 04-reseaux-sociaux/       10 plateformes, 16 emplacements
├── 05-favicon/               16 → 512 px, favicon.ico, integration.html, site.webmanifest
├── 06-bureautique/           PNG, JPG fond blanc, signature e-mail
├── 07-icones-application/    iOS et Android
└── 08-video/                 PNG 4K et 1080 transparents
```

Le detail complet est dans [docs/EXPORT-MATRIX.md](docs/EXPORT-MATRIX.md).

## Partis pris

**Le pack est visible avant d etre produit.** Le plan complet — nombre exact de
fichiers, arborescence, noms finaux — est recalcule a chaque frappe. Aucune
surprise a l export.

**Les avertissements arrivent avant, pas apres.** CMJN demande sur un format qui
ne le gere pas, transparence impossible, contraste insuffisant (seuil WCAG 3:1),
collision de noms insensible a la casse : tout est signale au moment du reglage.

**Le pack contient l integration.** Le LISEZ-MOI explique quel fichier utiliser
dans quel contexte ; les balises favicon et le `site.webmanifest` sont generes
en coherence avec les tailles reellement exportees.

**Le nommage est un systeme.** Quatorze tokens, quatre casses, assainissement
pour les trois systemes d exploitation, resolution deterministe des collisions.

**Le document de l utilisateur n est jamais modifie.** Chaque declinaison
travaille sur un duplicata temporaire, ferme sans enregistrement.

Le raisonnement complet est dans [docs/POSITIONNEMENT.md](docs/POSITIONNEMENT.md).

## Demarrage rapide

```bash
cd logo-forge
npm install
npm run icons
npm run build
```

Puis, dans [Adobe UXP Developer Tool](https://developer.adobe.com/photoshop/uxp/2022/guides/devtool/) :
**Add Plugin** → `logo-forge/dist/manifest.json` → **Load**.

Le panneau apparait dans **Fenetre → Extensions → Logo Forge**.

Procedure detaillee et depannage : [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Arborescence du projet

```
logo-forge/
├── src/
│   ├── manifest.json         Manifeste UXP v5 (hote ILST, panneau)
│   ├── index.html            Point de montage du panneau
│   ├── main.tsx              Amorcage React
│   ├── types/                Modele de domaine, sans dependance
│   ├── core/
│   │   ├── naming/           Gabarits a tokens, assainissement, unicite
│   │   ├── presets/          Les 48 cibles integrees, en donnees
│   │   ├── variants/         Declinaisons de couleur, contraste WCAG
│   │   ├── export/           Tailles, capacites, planificateur, moteur
│   │   ├── packaging/        LISEZ-MOI, charte, extraits d integration
│   │   ├── report/           Rapport d execution
│   │   ├── fs/               Adaptateur du systeme de fichiers UXP
│   │   └── illustrator/      Seule couche liee a l application
│   ├── ui/                   Etat, panneaux, composants, styles
│   ├── i18n/                 Catalogues francais et anglais
│   └── assets/icons/         Icones du panneau (generees)
├── tests/unit/               72 tests Vitest, sans Illustrator
├── scripts/                  Plugin Vite UXP, icones, archive .ccx
└── docs/                     Architecture, developpement, matrice, feuille de route
```

## Scripts

| Commande          | Effet                                           |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | Reconstruit `dist/` a chaque modification       |
| `npm run build`   | Verifie les types puis construit le plugin      |
| `npm run package` | Construit et produit `logo-forge-<version>.ccx` |
| `npm run icons`   | Regenere les icones du panneau                  |
| `npm run test`    | Execute les tests unitaires                     |
| `npm run verify`  | Formatage + lint + types + tests                |

## Compatibilite

|                      |                                            |
| -------------------- | ------------------------------------------ |
| Hote                 | Adobe Illustrator 2021 (25.0) et superieur |
| Plateforme           | Adobe UXP, manifeste v5                    |
| Langage              | TypeScript strict, React 18                |
| Construction         | Vite 5, sortie IIFE mono-fichier           |
| Node (developpement) | 20 ou superieur                            |
| Langues              | Francais, anglais                          |

## Licence

MIT — voir [LICENSE](LICENSE).
