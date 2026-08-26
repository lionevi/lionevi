# IdeaMarket Africa

Marketplace de vente et d'achat d'idees et de projets innovants, pensee pour l'Afrique
de l'Ouest francophone et ouverte a l'international. Interface integralement en francais.

Une idee documentee y devient un actif transferable : elle est scellee par une empreinte
SHA-256 horodatee, controlee en unicite, evaluee automatiquement, exposee en trois couches
de confidentialite, puis cedee par contrat genere automatiquement.

---

## Sommaire

- [Stack technique](#stack-technique)
- [Demarrage rapide](#demarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Modele de donnees](#modele-de-donnees)
- [Systeme d'unicite et d'anteriorite](#systeme-dunicite-et-danteriorite)
- [Les trois couches de divulgation](#les-trois-couches-de-divulgation)
- [Evaluation par IA](#evaluation-par-ia)
- [Encheres](#encheres)
- [Paiements et portefeuille](#paiements-et-portefeuille)
- [Contrats et certificats PDF](#contrats-et-certificats-pdf)
- [Messagerie moderee](#messagerie-moderee)
- [Temps reel](#temps-reel)
- [Arborescence](#arborescence)
- [Deploiement sur Vercel](#deploiement-sur-vercel)
- [Fonctionnement en mode degrade](#fonctionnement-en-mode-degrade)
- [Verifications](#verifications)

---

## Stack technique

| Domaine | Choix |
| --- | --- |
| Framework | Next.js 14 (App Router), TypeScript strict |
| UI | Tailwind CSS + composants shadcn/ui (Radix) |
| Base de donnees | PostgreSQL (Supabase) via Prisma |
| Authentification | NextAuth.js v5 — email/mot de passe et Google OAuth |
| Temps reel | Supabase Realtime, avec repli par sondage |
| Fichiers | Supabase Storage (public et prive avec URL signee) |
| IA | API Anthropic Claude — evaluation, similarite, teaser, moderation |
| Paiements | Stripe Checkout + stubs Wave, Orange Money, MTN MoMo |
| Emails | Resend |
| PDF | pdf-lib (contrat de cession, certificat d'anteriorite) |
| Hachage | `node:crypto` (SHA-256) |
| Deploiement | Vercel (cron inclus) |

## Demarrage rapide

```bash
npm install
cp .env.example .env.local        # renseignez au minimum DATABASE_URL et AUTH_SECRET
npm run db:push                   # cree le schema en base
npm run db:seed                   # jeu de donnees de demonstration (optionnel)
npm run dev
```

L'application est disponible sur `http://localhost:3000`.

Comptes de demonstration crees par le seed (mot de passe commun `IdeaMarket2024`) :

| Email | Role |
| --- | --- |
| `admin@ideamarket.africa` | Administration |
| `awa@ideamarket.africa` | Vendeur et acheteur |
| `kofi@ideamarket.africa` | Vendeur |
| `fatou@ideamarket.africa` | Acheteur (portefeuille approvisionne) |

Scripts disponibles :

```bash
npm run dev         # serveur de developpement
npm run build       # generation du client Prisma puis build de production
npm run start       # serveur de production
npm run lint        # ESLint
npm run typecheck   # TypeScript en mode strict
npm run db:push     # synchronise le schema Prisma avec la base
npm run db:migrate  # migration versionnee
npm run db:seed     # jeu de donnees de demonstration
```

## Variables d'environnement

Seules `DATABASE_URL` et `AUTH_SECRET` sont obligatoires. Toutes les integrations externes
sont optionnelles : leur absence declenche un mode degrade documente plus bas, jamais une
erreur au demarrage. Le detail complet figure dans `.env.example`.

## Modele de donnees

`prisma/schema.prisma` definit dix modeles metier — `User`, `Project`, `Bid`, `Transaction`,
`NDAgreement`, `Message`, `Notification`, `SavedProject`, `Review` — plus les tables
`Account`, `Session` et `VerificationToken` requises par NextAuth pour Google OAuth.

Le modele `Project` porte les trois couches de contenu, l'etat du pipeline
(`content_hash`, `submitted_at`, `similarity_status`, `similar_projects`), l'evaluation
(`ai_score`, `ai_evaluation`, `ai_teaser`, `display_level`) et les parametres de vente.

## Systeme d'unicite et d'anteriorite

Le pipeline de soumission (`src/server/pipeline.ts`) s'execute integralement avant toute
publication, dans cet ordre :

1. **Empreinte et horodatage** — le contenu des trois couches est normalise (minuscules,
   sans accents, espaces reduits) puis hache en SHA-256. L'empreinte et la date de depot
   sont enregistrees. Une resoumission dont le contenu n'a pas change **conserve** la date
   de depot initiale ; un contenu modifie produit une nouvelle empreinte et une nouvelle date.
2. **Doublon exact** — toute empreinte deja presente parmi les projets publies, vendus ou en
   attente entraine un rejet immediat, sans consommer de ressources d'analyse.
3. **Similarite** — presetection lexicale (indice de Jaccard sur les tokens significatifs)
   des 200 projets publies les plus recents, puis verdict de l'IA sur les 8 meilleurs
   candidats. Le statut suit les seuils du cahier des charges :

   | Score | Statut | Consequence |
   | --- | --- | --- |
   | 0-30 % | `CLEAR` | publication |
   | 31-60 % | `MODERATE` | publication |
   | 61-85 % | `HIGH` | note de differenciation exigee, sinon validation manuelle |
   | > 85 % | `DUPLICATE` | rejet |

4. **Evaluation** — notation sur six criteres, score global pondere, niveau d'affichage.
5. **Teaser** — generation du texte public, qui ne revele jamais la solution.
6. **Decision** — `PUBLISHED`, `PENDING_REVIEW` (file de moderation) ou `REJECTED`, puis
   notification in-app et email au vendeur.

Le vendeur telecharge a tout moment son **certificat d'anteriorite** en PDF
(`/api/projects/[id]/certificat`) : numero de certificat, empreinte, horodatage UTC, et
mention explicite que le document est un element de preuve et non un titre de propriete
intellectuelle.

## Les trois couches de divulgation

Le filtrage est applique cote serveur dans `src/server/access.ts` : les champs proteges ne
sont jamais serialises vers un client non autorise.

| Couche | Contenu | Condition d'acces |
| --- | --- | --- |
| 1 — publique | titre, accroche, probleme, marche cible, teaser, medias publics | libre |
| 2 — NDA | resume executif, taille de marche, avantage concurrentiel | NDA signe |
| 3 — privee | description complete, solution, modele economique, etapes, ressources, pieces jointes privees | achat finalise |

Le vendeur et l'administration voient l'ensemble. Le **prix de reserve d'une enchere n'est
jamais expose**, meme a l'acquereur : seul le fait qu'il soit atteint ou non est publie.

La signature du NDA enregistre l'identifiant du signataire, son adresse IP, son navigateur
et l'horodatage — elle vaut signature electronique et reste unique par couple
utilisateur/projet.

## Evaluation par IA

Six criteres notes de 0 a 100 puis ponderes (`src/lib/ai/evaluation.ts`) :

| Critere | Poids |
| --- | --- |
| Originalite | 20 % |
| Faisabilite | 20 % |
| Potentiel de marche | 20 % |
| Viabilite economique | 15 % |
| Clarte et completude | 15 % |
| Pertinence pour le marche africain | 10 % |

Le score global determine le badge affiche : **Premium** a partir de 80, **Featured** de 60
a 79, **Standard** de 40 a 59, **Low** en dessous de 40. Un score inferieur a 25 empeche la
publication automatique.

Le prompt est explicitement ancre sur les realites du marche ouest-africain (pouvoir
d'achat, mobile money, secteur informel, logistique, acces a l'energie, cout du capital).

## Encheres

- Increment minimal de 5 % de l'offre courante.
- **Anti-sniping** : toute offre deposee dans les 5 dernieres minutes repousse la fin de
  l'enchere de 5 minutes.
- Depot d'offre execute dans une transaction base de donnees : deux offres simultanees ne
  peuvent pas valider le meme montant.
- Cloture automatique par `/api/cron/close-auctions` (cron Vercel toutes les 10 minutes,
  protege par `CRON_SECRET`) : adjudication si le prix de reserve est atteint, archivage
  sinon, notifications au vendeur, au gagnant et aux perdants.

## Paiements et portefeuille

| Moyen | Etat |
| --- | --- |
| Carte bancaire (Stripe Checkout) | integration complete, webhook signe |
| Portefeuille interne | integration complete, debit immediat |
| Wave, Orange Money, MTN MoMo | **stubs** — contrat d'interface complet, appels reseau non branches |

La commission de plateforme (10 % par defaut, `PLATFORM_FEE_PERCENT`) est prelevee sur la
part du vendeur. Le net est credite sur son portefeuille interne, retirable vers Mobile
Money via `/api/portefeuille/retrait`.

Les moyens Mobile Money proposes a l'achat dependent du pays de l'utilisateur. Pour brancher
un operateur reel, remplacez le corps de `initiate` et `verify` dans
`src/lib/payments/mobile-money.ts` : le reste de l'application est inchange. Le webhook
`/api/webhooks/mobile-money` normalise deja les charges utiles et verifie une signature
HMAC-SHA256.

## Contrats et certificats PDF

`src/lib/pdf.ts` produit deux documents A4 en francais, sans dependance externe :

- **Contrat de cession de droits**, genere a chaque transaction finalisee — parties, objet,
  empreinte et date de depot, prix et repartition, garanties du cedant, confidentialite,
  litiges, blocs de signature electronique.
- **Certificat d'anteriorite**, disponible des la soumission.

Lorsque Supabase Storage est configure, le contrat est archive dans un dossier prive et
distribue par URL signee de 10 minutes ; sinon il est regenere a la volee a chaque
telechargement.

## Messagerie moderee

Deux niveaux (`src/lib/ai/moderation.ts`) :

1. **Regles deterministes**, toujours appliquees : numeros de telephone, adresses email,
   liens externes, messageries tierces, coordonnees bancaires, propositions de transaction
   hors plateforme.
2. **Analyse IA** ensuite, pour le harcelement, les arnaques et les tentatives d'obtenir le
   contenu confidentiel sans contrepartie.

Un message bloque est enregistre et reste visible par son auteur, avec le motif, mais n'est
jamais remis au destinataire ni notifie. La file des messages bloques est consultable dans
l'espace d'administration. Un echec de l'analyse IA ne debloque jamais un message deja
retenu par les regles.

## Temps reel

Le hook `useRealtime` (`src/lib/realtime.ts`) s'abonne aux changements Postgres via Supabase
Realtime pour les encheres, les messages et les notifications. Sans configuration Supabase,
il bascule automatiquement sur un rafraichissement periodique : l'interface reste correcte,
seule la latence change.

Pour activer le temps reel, ajoutez les tables a la publication Supabase :

```sql
alter publication supabase_realtime add table "Bid", "Message", "Notification";
```

## Arborescence

```
prisma/
  schema.prisma          Modele de donnees complet
  seed.ts                Jeu de donnees de demonstration
src/
  app/
    (pages publiques)    accueil, projets, encheres, pages editoriales et legales
    projets/[slug]/      fiche projet a trois couches, tunnel de paiement
    vendre/              assistant de depot en 4 etapes
    tableau-de-bord/     espace membre (projets, ventes, achats, encheres,
                         favoris, messages, notifications, portefeuille, profil)
    admin/               indicateurs et file de moderation
    api/                 routes REST (projets, encheres, paiement, messagerie,
                         notifications, webhooks, cron, administration)
  components/            composants d'interface et composants metier
  lib/
    ai/                  evaluation, similarite, teaser, moderation
    payments/            Stripe, Mobile Money, calcul des commissions
    hash.ts              empreinte SHA-256 du contenu
    anteriority.ts       helpers d'anteriorite utilisables cote client
    pdf.ts               contrat de cession et certificat
    validation.ts        schemas Zod partages client et serveur
  server/                services metier (pipeline, projets, encheres,
                         transactions, messagerie, NDA, acces, administration)
  middleware.ts          protection des espaces authentifies
```

## Deploiement sur Vercel

1. Importez le depot dans Vercel.
2. Renseignez les variables d'environnement (voir `.env.example`). `NEXT_PUBLIC_APP_URL` et
   `AUTH_URL` doivent pointer vers le domaine de production.
3. La commande de build (`prisma generate && next build`) est deja configuree.
4. Appliquez le schema a la base de production : `npx prisma db push` ou
   `npx prisma migrate deploy`.
5. Le cron de cloture des encheres est declare dans `vercel.json` ; definissez `CRON_SECRET`
   pour proteger l'endpoint.
6. Declarez les webhooks : `https://votre-domaine/api/webhooks/stripe` (evenements
   `checkout.session.completed`, `checkout.session.expired`,
   `payment_intent.payment_failed`) et, le cas echeant,
   `https://votre-domaine/api/webhooks/mobile-money`.

## Fonctionnement en mode degrade

| Absent | Consequence |
| --- | --- |
| `ANTHROPIC_API_KEY` | evaluation heuristique (score plafonne a 72), similarite lexicale, teaser construit depuis l'accroche, moderation par regles seules |
| Supabase | pas de televersement de fichiers ; contrats regeneres a la demande ; temps reel remplace par un sondage |
| Stripe | paiement carte masque dans l'interface ; Mobile Money et portefeuille restent disponibles |
| Resend | emails journalises sans envoi ; les notifications in-app fonctionnent |
| Google OAuth | seule la connexion email / mot de passe est proposee |

Aucun de ces cas n'empeche l'application de demarrer ni de fonctionner.

## Verifications

```bash
npm run typecheck   # TypeScript strict, sans erreur
npm run lint        # ESLint, sans avertissement
npm run build       # build de production
```

Le parcours complet a ete valide de bout en bout contre une base PostgreSQL reelle :
inscription et connexion, refus des doublons d'email et des mots de passe faibles,
protection des routes, creation et completion d'un dossier, execution du pipeline
(empreinte, horodatage, similarite, score, teaser), rejet d'un doublon exact, filtrage des
trois couches selon le niveau d'acces, signature du NDA, blocage des coordonnees dans la
messagerie, achat par portefeuille, deblocage de la couche privee, generation du contrat et
du certificat en PDF, refus du rachat d'un projet vendu, encheres (offre trop basse,
increment minimal, prix de reserve masque), et cloture des encheres dans les trois cas
(reserve atteinte, reserve non atteinte, aucune offre).
