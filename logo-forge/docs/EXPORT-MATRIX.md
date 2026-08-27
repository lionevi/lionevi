# Matrice d export

## Presets integres

| #   | Preset               | Cibles | Contenu                                                                             |
| --- | -------------------- | ------ | ----------------------------------------------------------------------------------- |
| 01  | Fichiers sources     | 5      | AI (editable et vectorise), EPS, PDF/X-4, SVG                                       |
| 02  | Web                  | 5      | SVG, PNG 500/1000/2000 px, WebP                                                     |
| 03  | Impression           | 4      | PDF/X-4 CMJN, EPS CMJN, PNG et TIFF 300 ppp                                         |
| 04  | Reseaux sociaux      | 16     | Facebook, Instagram, LinkedIn, X, YouTube, TikTok, WhatsApp, Discord, Slack, GitHub |
| 05  | Favicon              | 7      | 16, 32, 48, apple-touch 180, Chrome 192/512, `favicon.ico`                          |
| 06  | Bureautique          | 3      | PNG, JPG fond blanc, signature e-mail                                               |
| 07  | Icones d application | 6      | App Store 1024, iPhone 180/120, Play Store 512, Android 192/144                     |
| 08  | Video                | 2      | PNG 3840 et 1920 px transparents                                                    |

**48 cibles au total.** Avec trois plans de travail et trois declinaisons
activees, un pack complet compte **372 fichiers repartis dans 66 dossiers**.

## Capacites par format

| Format | Vectoriel | Transparence | CMJN | Avec perte | Limite |
| ------ | --------- | ------------ | ---- | ---------- | ------ |
| AI     | oui       | oui          | oui  | non        | —      |
| EPS    | oui       | non          | oui  | non        | —      |
| PDF    | oui       | oui          | oui  | non        | —      |
| SVG    | oui       | oui          | non  | non        | —      |
| PNG    | non       | oui          | non  | non        | —      |
| JPEG   | non       | non          | oui  | oui        | —      |
| WebP   | non       | oui          | non  | oui        | —      |
| TIFF   | non       | oui          | oui  | non        | —      |
| ICO    | non       | oui          | non  | non        | 256 px |

Ces capacites ne sont pas documentaires : le planificateur les lit pour
avertir avant l export. Demander du CMJN en SVG produit un avertissement et un
repli en RVB, pas un fichier silencieusement faux.

## Modes de taille

| Mode           | Effet                                             | Usage type                              |
| -------------- | ------------------------------------------------- | --------------------------------------- |
| `scale`        | Multiplie la taille du plan de travail            | Sources, PDF                            |
| `width`        | Largeur imposee, hauteur au ratio                 | Bandeaux                                |
| `height`       | Hauteur imposee, largeur au ratio                 | Signatures, barres de navigation        |
| `longest-edge` | Plus grand cote impose                            | Packs melangeant horizontal et vertical |
| `exact`        | Canvas fixe, logo centre dans la zone de securite | Reseaux sociaux, favicons, icones       |

`longest-edge` est le mode qui evite le piege classique : contraindre la largeur
sur un lot de logos aux ratios differents produit des fichiers dont la hauteur
varie du simple au triple.

## Declinaisons de couleur

| Declinaison             | Traitement                                     | Par defaut |
| ----------------------- | ---------------------------------------------- | ---------- |
| Couleur                 | Aucun                                          | activee    |
| Noir                    | Aplat `#000000`                                | activee    |
| Blanc                   | Aplat `#FFFFFF`                                | activee    |
| Nuances de gris         | Luminance perceptuelle (0.299 / 0.587 / 0.114) | desactivee |
| Couleur sur fond sombre | Fond `#111111` ajoute                          | desactivee |

## Tokens de nommage

`{brand}` `{asset}` `{role}` `{variant}` `{variantkind}` `{format}` `{profile}`
`{size}` `{width}` `{height}` `{dpi}` `{preset}` `{date}` `{index}`

Gabarit par defaut : `{brand}-{asset}-{variant}` — par exemple
`acme-logo-principal-couleur.png`.

Les noms sont assainis pour les trois systemes d exploitation : accents
translitteres, caracteres interdits supprimes, noms reserves par Windows
(`con`, `prn`, `aux`, `nul`, `com1`-`com9`, `lpt1`-`lpt9`) desamorces, et
collisions insensibles a la casse resolues par suffixe numerique.
