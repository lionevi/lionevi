# Feuille de route

## v0.1 — Fondations (fait)

- Structure du projet, manifeste UXP v5, chaine Vite, empaquetage `.ccx`.
- Modele de domaine complet et planificateur de pack.
- 48 cibles d export reparties en 8 presets.
- Declinaisons de couleur, controle de contraste WCAG.
- Moteur d export avec injection de `FileWriter`, simulation a blanc.
- Generation du LISEZ-MOI, de la charte, du rapport et des extraits favicon.
- Interface a cinq onglets, francais et anglais, 72 tests unitaires.

## v0.2 — Ecriture reelle dans Illustrator

- `IllustratorWriter` : implementation de `FileWriter` sur `exportFile` et
  `saveAs`, avec duplication du document par declinaison.
- Recoloration effective (aplat monochrome, niveaux de gris) sur le duplicata.
- Composition sur canvas exact pour les cibles `mode: 'exact'` (reseaux sociaux,
  favicons) en s appuyant sur `fitInside`.
- Assemblage du `favicon.ico` multi-resolution a partir des PNG generes.
- Barre de progression reelle et annulation depuis le panneau.

## v0.3 — Livraison

- Archive ZIP du pack (`output.createZip`).
- Charte d utilisation rendue en PDF depuis Illustrator, pas seulement en
  Markdown.
- Planche de contrôle : une page recapitulant toutes les declinaisons.
- Extraction automatique des couleurs de la marque depuis les nuanciers du
  document, avec equivalences CMJN et Pantone.

## v0.4 — Productivite

- Presets personnalises, enregistres et exportables en JSON.
- Traitement par lots : plusieurs documents `.ai` en une passe.
- Profils clients : reglages memorises par marque.
- Detection automatique de la zone de protection et de la taille minimale.

## v1.0 — Distribution

- Soumission au Marketplace Adobe Exchange.
- Documentation utilisateur illustree.
- Verification d accessibilite du pack : contraste de chaque declinaison sur les
  fonds de reference.
