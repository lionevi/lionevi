# Developpement

## Installation

```bash
cd logo-forge
npm install
npm run icons
npm run build
```

## Charger le plugin dans Illustrator

1. Installer [Adobe UXP Developer Tool](https://developer.adobe.com/photoshop/uxp/2022/guides/devtool/)
   depuis Creative Cloud Desktop.
2. Ouvrir Illustrator (2021 / version 25.0 minimum).
3. Dans UXP Developer Tool : **Add Plugin** → selectionner
   `logo-forge/dist/manifest.json`.
4. Cliquer sur **Load**. Le panneau apparait dans
   **Fenetre → Extensions → Logo Forge**.

En cas de panneau blanc, ouvrir **Debug** dans UXP Developer Tool : la console
donne l erreur exacte. La cause la plus frequente est une icone manquante —
relancer `npm run icons`.

## Boucle de developpement

```bash
npm run dev     # reconstruit dist/ a chaque modification
```

Puis **Reload** dans UXP Developer Tool. Le rechargement a chaud n existe pas
dans UXP : chaque modification demande un rechargement explicite.

## Verifications

```bash
npm run verify        # format + lint + types + tests
npm run test:watch    # tests en continu pendant le developpement
npm run test:coverage # couverture de src/core/
```

## Produire une archive distribuable

```bash
npm run package       # build puis logo-forge-<version>.ccx
```

Le `.ccx` est une archive ZIP dont la racine contient `manifest.json`. C est le
format attendu par Creative Cloud et par le Marketplace Adobe. La version du
manifeste est synchronisee automatiquement depuis `package.json` a chaque build :
un decalage entre les deux fait echouer la validation Adobe.

## Contraintes UXP a connaitre

- **Pas de modules ES.** Le bundle est produit en IIFE et `type="module"` est
  retire du HTML par `scripts/vite-plugin-uxp.mjs`.
- **Pas de `fetch` vers un domaine non declare** dans `requiredPermissions`.
- **Le systeme de fichiers passe par `uxp.storage`**, pas par `node:fs` :
  l acces a un dossier exige un jeton obtenu via le selecteur natif.
- **CSS partiel.** UXP n implemente qu un sous-ensemble de CSS : pas de `grid`
  complet, pas de pseudo-elements complexes. La feuille de styles s en tient a
  flexbox.
- `require('illustrator')` n existe qu a l interieur de l hote ;
  `core/illustrator/host.ts` retourne `null` ailleurs, ce qui permet a tout le
  reste de fonctionner hors Illustrator.
