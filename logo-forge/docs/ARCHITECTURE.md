# Architecture

## Principe directeur

**Toute la logique metier ignore Illustrator.** `src/core/` ne contient que des
fonctions pures operant sur des donnees : plans de travail, declinaisons,
cibles d export. L application n intervient qu au moment d ecrire les octets.

Cette separation a trois consequences concretes :

1. Le pack complet peut etre calcule et affiche **avant** tout export — l
   utilisateur voit les 372 fichiers qu il va produire, pas une barre de
   progression opaque.
2. Le moteur est testable en entier sans Illustrator : 72 tests s executent en
   deux secondes en integration continue.
3. Un second hote (Photoshop, InDesign, un service en ligne) ne demanderait qu
   une nouvelle implementation de `FileWriter`.

## Couches

```
src/
├── types/          Modele de domaine, sans dependance
├── core/
│   ├── naming/     Gabarits a tokens, assainissement, unicite des chemins
│   ├── presets/    Les 48 cibles d export integrees, en donnees
│   ├── variants/   Declinaisons de couleur et controle de contraste WCAG
│   ├── export/     Tailles, capacites des formats, planificateur, moteur
│   ├── packaging/  LISEZ-MOI, charte, extraits d integration
│   ├── report/     Rapport d execution
│   ├── fs/         Adaptateur du systeme de fichiers UXP
│   └── illustrator/ Seule couche qui parle a l application
├── ui/             React : etat, panneaux, composants, styles
└── i18n/           Catalogues francais et anglais
```

La regle de dependance est unidirectionnelle : `ui → core → types`. Aucun module
de `core/` n importe `ui/`.

## Le plan comme source de verite

`buildPackagePlan(settings)` transforme les reglages en `PackagePlan` : une
liste de `PlannedFile` avec leur chemin final, plus les avertissements. Ce plan
est **derive**, jamais stocke dans l etat React (`useMemo` dans
`ui/state/store.tsx`). Il est donc impossible que l apercu affiche autre chose
que ce qui sera exporte.

Le planificateur resout dans l ordre :

1. **Filtrage** — cibles actives x plans de travail selectionnes x declinaisons
   activees, en respectant les restrictions de role (`assetRoles`) et de
   declinaison (`variantKinds`) portees par chaque cible.
2. **Taille** — `resolvePixelSize` convertit un `SizeSpec` en pixels reels ;
   les formats vectoriels n en recoivent aucune.
3. **Nom** — le gabarit de la cible prime sur le gabarit global, puis le nom est
   assaini et rendu unique.
4. **Dossier** — determine par le mode de regroupement choisi (`usage`,
   `format`, `variant`, `asset`).
5. **Controles** — CMJN sur un format qui ne le gere pas, transparence
   impossible, contraste insuffisant, depassement de la taille maximale.

## Le moteur

`runExport(plan, settings, writer, options)` sequence les ecritures. Trois
regles y sont non negociables :

- **Un echec n interrompt jamais le lot.** Un pack de 300 fichiers ne doit pas
  etre perdu parce qu une police manque sur une declinaison.
- **Les fichiers annexes ne peuvent pas faire echouer un export reussi** — leur
  ecriture est encapsulee (`safeWrite`).
- **L annulation est verifiee entre deux fichiers**, jamais au milieu d une
  ecriture : aucun fichier tronque ne peut subsister.

`FileWriter` est injecte. `createDryRunWriter()` fournit la simulation utilisee
par l apercu et par les tests ; l implementation Illustrator est le prochain
jalon (voir [ROADMAP.md](./ROADMAP.md)).

## Ne jamais modifier le document de l utilisateur

Les declinaisons monochromes exigent de recolorer le graphisme. Logo Forge le
fait **sur un duplicata temporaire**, ferme sans enregistrement une fois les
fichiers ecrits (`core/illustrator/recolor.ts`). C est la seule maniere de
garantir qu un export interrompu ne laisse pas un document a moitie recolore.
