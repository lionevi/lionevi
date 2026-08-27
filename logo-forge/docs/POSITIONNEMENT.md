# Positionnement

> **Avertissement.** Ce document decrit les partis pris de Logo Forge. Les
> mentions d outils concurrents refletent leur positionnement general, pas un
> audit de leur version courante. Avant toute publication commerciale, verifier
> chaque comparaison contre la documentation a jour de l editeur concerne.

## Les partis pris

### 1. Le pack est visible avant d etre produit

Un exportateur classique demande des reglages puis affiche une barre de
progression. Logo Forge calcule le plan complet a chaque frappe : nombre exact
de fichiers, arborescence, noms finaux, avertissements. L utilisateur valide ce
qu il va obtenir, pas ce qu il espere obtenir.

C est possible parce que le planificateur ne depend pas d Illustrator
(voir [ARCHITECTURE.md](./ARCHITECTURE.md)).

### 2. Les avertissements arrivent avant l export, pas apres la livraison

Le planificateur signale :

- un format demande en CMJN qui ne gere pas le CMJN ;
- une declinaison transparente exportee dans un format sans canal alpha ;
- un contraste insuffisant entre le logo et son fond (seuil WCAG 3:1) ;
- un depassement de la taille maximale d un format (256 px pour le `.ico`) ;
- une collision de noms, y compris celles qui ne different que par la casse et
  qui ecraseraient silencieusement un fichier sur macOS ou Windows.

### 3. Le pack contient l integration, pas seulement les fichiers

Sont generes automatiquement a cote des exports :

- `LISEZ-MOI.md` — quel fichier utiliser dans quel contexte, arborescence,
  couleurs de la marque ;
- `charte-utilisation.md` — declinaisons, zone de protection, taille minimale,
  interdits ;
- `05-favicon/integration.html` et `site.webmanifest` — balises pretes a coller,
  coherentes avec les tailles reellement exportees ;
- `rapport-export.md` — ce qui a ete ecrit, ignore, echoue, et pourquoi.

Le developpeur qui recoit le pack n a plus a deviner les balises ni les
dimensions.

### 4. Le nommage est un systeme, pas une case a cocher

Quatorze tokens, quatre casses, assainissement multiplateforme, resolution
deterministe des collisions. Un studio peut imposer sa convention de nommage a
tous ses packs sans renommer un seul fichier a la main.

### 5. Le document de l utilisateur n est jamais modifie

Chaque declinaison travaille sur un duplicata temporaire. Un export interrompu
ne peut pas laisser un document a moitie recolore.

## Ce qui n est pas encore fait

Voir [ROADMAP.md](./ROADMAP.md). En v0.1, l ecriture reelle des fichiers par
Illustrator n est pas implementee : le panneau fonctionne en planification et en
simulation. Ne rien annoncer publiquement avant le jalon v0.2.
