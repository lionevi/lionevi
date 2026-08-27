# Contribuer a Logo Forge

## Prerequis

- Node.js 20 ou superieur (`.nvmrc` fait foi).
- Adobe Illustrator 2021 (25.0) ou superieur.
- [Adobe UXP Developer Tool](https://developer.adobe.com/photoshop/uxp/2022/guides/devtool/).

## Mise en route

```bash
cd logo-forge
npm install
npm run icons     # genere les icones du panneau
npm run build
```

Puis, dans UXP Developer Tool : **Add Plugin** et selectionner
`logo-forge/dist/manifest.json`, puis **Load**.

Pendant le developpement, `npm run dev` reconstruit `dist/` a chaque
modification ; il suffit de cliquer sur **Reload** dans UXP Developer Tool.

## Avant d ouvrir une pull request

```bash
npm run verify   # format + lint + types + tests
```

## Conventions

- Commits au format [Conventional Commits](https://www.conventionalcommits.org/fr/).
- Toute logique metier va dans `src/core/` et doit etre testable sans
  Illustrator. Si un test a besoin d Illustrator, c est que l abstraction est au
  mauvais endroit.
- L interface ne contient aucune regle metier : elle lit l etat et emet des
  actions.
- Les messages destines a l utilisateur passent par `src/i18n/`, jamais en dur
  dans un composant.
