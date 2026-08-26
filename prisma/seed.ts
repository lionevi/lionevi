/**
 * Jeu de donnees de demonstration.
 *
 * Cree des comptes (dont un administrateur), des projets publies couvrant les
 * differents niveaux d'evaluation, une enchere en cours et une vente
 * finalisee. Idempotent : relancable sans dupliquer les enregistrements.
 *
 *   npm run db:seed
 */
import {
  DisplayLevel,
  PrismaClient,
  ProjectStatus,
  Role,
  SellingMode,
  SimilarityStatus,
  type Prisma,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'IdeaMarket2024';

function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contentHash(parts: string[]): string {
  return createHash('sha256').update(parts.map(normalize).join('|'), 'utf8').digest('hex');
}

function evaluation(score: number, comment: string): Prisma.InputJsonValue {
  const criterion = (value: number) => ({ score: value, comment });
  return {
    scores: {
      originality: criterion(score),
      feasibility: criterion(Math.max(10, score - 5)),
      market_potential: criterion(Math.min(100, score + 4)),
      economic_viability: criterion(Math.max(10, score - 3)),
      clarity: criterion(Math.min(100, score + 2)),
      local_relevance: criterion(Math.min(100, score + 6)),
    },
    strengths: ['Probleme clairement identifie', 'Marche accessible sans capital lourd'],
    weaknesses: ['Concurrence informelle a documenter'],
    recommendations: ['Chiffrer le cout d acquisition client sur les six premiers mois'],
    verdict: score >= 40 ? 'PUBLIER' : 'A_AMELIORER',
    summary: comment,
    global_score: score,
    generated_at: new Date().toISOString(),
    engine: 'demonstration',
  };
}

interface SeedProject {
  slug: string;
  title: string;
  tagline: string;
  category: string;
  sector_tags: string[];
  problem_statement: string;
  target_market: string;
  executive_summary: string;
  market_size: string;
  competitive_advantage: string;
  full_description: string;
  solution_detail: string;
  business_model: string;
  implementation_steps: string[];
  resources_identified: string;
  ai_score: number;
  display_level: DisplayLevel;
  ai_teaser: string;
  selling_mode: SellingMode;
  fixed_price?: number;
  auction_start_price?: number;
  auction_reserve_price?: number;
  auction_days?: number;
  estimated_cost_min: number;
  estimated_cost_max: number;
  implementation_months: number;
  projected_revenue: string;
  status?: ProjectStatus;
}

const PROJECTS: SeedProject[] = [
  {
    slug: 'collecte-plastique-cotonou',
    title: 'Reseau de collecte et de valorisation du plastique a Cotonou',
    tagline: 'Transformer un dechet urbain omnipresent en matiere premiere rentable',
    category: 'Energie & Environnement',
    sector_tags: ['Economie circulaire', 'Impact social', 'Zone urbaine', 'B2B'],
    problem_statement:
      "Cotonou produit chaque jour plusieurs centaines de tonnes de dechets plastiques dont une fraction infime est recyclee. Les canaux de drainage se bouchent, les inondations s aggravent en saison des pluies, et les recycleurs industriels de la sous-region importent une matiere premiere qui est deja disponible sur place, mais dispersee et non collectee.",
    target_market:
      "Trois segments : les menages et petits commerces des quartiers denses de Cotonou (collecte), les collecteurs informels deja actifs (integration), et les transformateurs plastiques du Benin, du Togo et du Nigeria (vente de matiere lavee et broyee).",
    executive_summary:
      "Le projet organise en reseau structure une activite aujourd hui informelle : points d apport volontaire remuneres, collecteurs equipes et formes, unite de tri et de broyage, revente aux transformateurs sous contrat cadre. Le modele repose sur un differentiel de prix documente entre le plastique brut collecte et le plastique lave et broye vendu au kilo.",
    market_size:
      "Estimation prudente : 180 tonnes de PET recuperables par mois sur la zone couverte, pour un prix de revente de 150 a 220 FCFA le kilo apres traitement.",
    competitive_advantage:
      "Les acteurs existants sont soit purement informels (sans capacite de contractualiser avec un industriel), soit institutionnels (sans agilite terrain). Le projet occupe l entre-deux : la logistique fine de l informel avec la fiabilite contractuelle attendue par un acheteur industriel.",
    full_description:
      "Le dossier complet decrit le maillage des points de collecte quartier par quartier, la grille de remuneration des collecteurs, le dimensionnement de l unite de tri, la sequence d equipement et les contrats types negocies avec les transformateurs. Il inclut le plan de tresorerie mois par mois sur vingt-quatre mois, ainsi que les hypotheses de saisonnalite liees a la saison des pluies.",
    solution_detail:
      "Trois briques : un reseau de quarante points d apport remuneres au kilo, une flotte de tricycles motorises pour la collecte de proximite, et une unite centrale de lavage-broyage de 2 tonnes par jour. Le suivi se fait par un carnet numerique simple sur telephone, avec paiement des collecteurs par Mobile Money hebdomadaire.",
    business_model:
      "Achat du plastique brut aux collecteurs, transformation, revente en flocons laves. Marge brute cible de 45 % apres transport. Revenus secondaires : prestation de collecte facturee aux entreprises productrices de dechets plastiques.",
    implementation_steps: [
      'Cartographier les quartiers et negocier quarante emplacements de points d apport',
      'Recruter et former le premier noyau de vingt collecteurs deja actifs dans l informel',
      'Acquerir et installer la ligne de lavage-broyage sur un terrain loue en zone industrielle',
      'Signer deux contrats cadres avec des transformateurs (Benin et Nigeria)',
      'Lancer la collecte sur trois quartiers pilotes puis etendre au rythme de la tresorerie',
      'Mettre en place le suivi numerique et le paiement hebdomadaire par Mobile Money',
    ],
    resources_identified:
      "Fournisseurs d equipement de broyage identifies au Nigeria et en Turquie, avec fourchettes de prix. Deux transformateurs contactes ayant exprime un besoin mensuel superieur a la capacite prevue. Liste des associations de collecteurs par quartier.",
    ai_score: 86,
    display_level: DisplayLevel.PREMIUM,
    ai_teaser:
      "Cotonou jette chaque jour des tonnes de plastique que les industriels de la sous-region importent par ailleurs. Ce dossier structure la chaine manquante entre les deux, avec un modele economique chiffre et des acheteurs deja identifies.",
    selling_mode: SellingMode.FIXED_PRICE,
    fixed_price: 1_250_000,
    estimated_cost_min: 18_000_000,
    estimated_cost_max: 26_000_000,
    implementation_months: 9,
    projected_revenue:
      "Annee 1 : 42 millions FCFA de chiffre d affaires. Annee 2 : 95 millions apres montee en capacite.",
  },
  {
    slug: 'sechoir-solaire-mangue-korhogo',
    title: 'Unite de sechage solaire de mangues pour l export',
    tagline: "Valoriser les pertes post-recolte de la filiere mangue du nord ivoirien",
    category: 'Agriculture & Agroalimentaire',
    sector_tags: ['Export', 'Zone rurale', 'Forte marge', 'B2B'],
    problem_statement:
      "Dans la region de Korhogo, une part importante de la production de mangues est perdue chaque saison faute de debouche immediat et de capacite de conservation. Les producteurs vendent a perte en pleine saison, tandis que le marche europeen de la mangue sechee bio reste sous-approvisionne.",
    target_market:
      "Cooperatives de producteurs de la region de Korhogo en amont ; importateurs et transformateurs europeens de fruits secs bio en aval, ainsi que le marche urbain d Abidjan pour les ecarts de tri.",
    executive_summary:
      "Le projet installe une unite de sechage solaire hybride adossee a une cooperative existante, avec un plan de certification bio et equitable sur dix-huit mois. La rentabilite repose sur l ecart entre le prix d achat en pleine saison et le prix export de la mangue sechee certifiee.",
    market_size:
      "Le marche europeen des fruits secs bio croit regulierement ; un conteneur mensuel de mangue sechee certifiee trouve preneur sans difficulte aupres des importateurs specialises.",
    competitive_advantage:
      "Adossement a une cooperative deja structuree : approvisionnement securise, tracabilite native pour la certification, et cout d acquisition de la matiere premiere inferieur au marche spot.",
    full_description:
      "Le dossier detaille le dimensionnement des sechoirs, le calendrier de la campagne, le processus de certification, la structure de couts par kilogramme sec et les contacts d importateurs, avec les niveaux de prix pratiques.",
    solution_detail:
      "Sechoirs solaires directs a claies avec appoint gaz pour les journees couvertes, atelier de decoupe et de conditionnement sous vide, chambre de stockage. Ratio de 8 kilos de mangue fraiche pour 1 kilo sec, avec courbes de sechage documentees par variete.",
    business_model:
      "Achat en gros aupres de la cooperative pendant le pic de production, transformation, export en vrac conditionne. Marge brute cible de 38 % apres fret. Les ecarts de tri sont ecoules sur le marche national.",
    implementation_steps: [
      'Conventionner avec une cooperative de producteurs sur trois campagnes',
      'Construire les sechoirs et l atelier de conditionnement',
      'Former les operateurs aux courbes de sechage par variete',
      'Engager la certification bio et le suivi de tracabilite',
      'Realiser une campagne pilote et envoyer des echantillons aux importateurs',
      'Signer un contrat annuel avec un importateur europeen',
    ],
    resources_identified:
      "Constructeur de sechoirs identifie au Burkina Faso, organisme certificateur present en Cote d Ivoire, trois importateurs europeens contactes avec leurs exigences techniques.",
    ai_score: 74,
    display_level: DisplayLevel.FEATURED,
    ai_teaser:
      "Chaque saison, une partie de la recolte de mangues du nord ivoirien se perd faute de debouche, pendant que le marche europeen du fruit sec bio reste sous-approvisionne. Ce dossier relie les deux bouts.",
    selling_mode: SellingMode.AUCTION,
    auction_start_price: 400_000,
    auction_reserve_price: 750_000,
    auction_days: 6,
    estimated_cost_min: 12_000_000,
    estimated_cost_max: 17_000_000,
    implementation_months: 12,
    projected_revenue: "Campagne 1 : 28 millions FCFA. Campagne 2 : 51 millions.",
  },
  {
    slug: 'assurance-recolte-indicielle-mobile',
    title: 'Assurance recolte indicielle distribuee par Mobile Money',
    tagline: "Assurer le petit producteur sans expertise terrain, a partir des donnees pluviometriques",
    category: 'Fintech & Services financiers',
    sector_tags: ['Mobile Money', 'B2C', 'Zone rurale', 'Impact social'],
    problem_statement:
      "Le petit producteur ouest-africain n a pratiquement aucun acces a l assurance recolte : l expertise terrain coute plus cher que la prime elle-meme. Une mauvaise saison se traduit donc par un endettement durable, voire par l abandon de l exploitation.",
    target_market:
      "Producteurs de cereales et de coton disposant d un compte Mobile Money actif, atteignables via les cooperatives et les agrodealers, au Benin, au Burkina Faso et au Mali.",
    executive_summary:
      "Le produit repose sur un declencheur indiciel : en dessous d un seuil pluviometrique mesure sur une maille geographique, l indemnisation est versee automatiquement, sans expertise. La distribution passe par les agrodealers et le paiement par Mobile Money.",
    market_size:
      "Plusieurs millions de petits producteurs sur la zone cible ; un taux de penetration de 2 % suffit a atteindre le seuil de rentabilite du portefeuille.",
    competitive_advantage:
      "Le cout de gestion d un sinistre tombe a quasiment zero grace au declenchement indiciel, ce qui rend assurable une population que l assurance classique ne peut pas servir.",
    full_description:
      "Le dossier decrit la construction de l indice, le partenariat avec un assureur porteur de risque, le circuit de distribution par les agrodealers, la grille tarifaire par culture et par zone, et le plan de deploiement pays par pays.",
    solution_detail:
      "Indice construit sur les donnees satellitaires de pluviometrie agregees par maille, seuils calibres par culture et par zone agro-ecologique. Souscription par code USSD, prime prelevee sur le solde Mobile Money, indemnisation poussee automatiquement en fin de fenetre de couverture.",
    business_model:
      "Commission de courtage sur chaque prime collectee, plus une commission de gestion versee par l assureur porteur. Le risque n est pas porte au bilan.",
    implementation_steps: [
      'Selectionner un assureur porteur de risque agree dans la zone UEMOA',
      'Construire et backtester l indice sur dix campagnes passees',
      'Negocier l acces aux canaux USSD avec un operateur Mobile Money',
      'Recruter et former un reseau d agrodealers distributeurs',
      'Lancer une campagne pilote sur une region et une culture',
      'Etendre progressivement aux autres cultures et pays',
    ],
    resources_identified:
      "Fournisseurs de donnees pluviometriques satellitaires identifies, contacts chez deux assureurs regionaux, grille de commissions negociee avec un agregateur Mobile Money.",
    ai_score: 68,
    display_level: DisplayLevel.FEATURED,
    ai_teaser:
      "Assurer un petit producteur coute aujourd hui plus cher que la prime qu il peut payer. Ce dossier retire l expertise terrain de l equation et rend le produit distribuable a grande echelle.",
    selling_mode: SellingMode.FIXED_PRICE,
    fixed_price: 900_000,
    estimated_cost_min: 25_000_000,
    estimated_cost_max: 40_000_000,
    implementation_months: 18,
    projected_revenue: "Annee 2 : 65 millions FCFA de commissions sur un portefeuille de 40 000 polices.",
  },
  {
    slug: 'plateforme-logistique-derniers-kilometres',
    title: 'Mutualisation logistique du dernier kilometre pour commercants de quartier',
    tagline: 'Un seul tricycle pour dix boutiques, au lieu de dix trajets separes',
    category: 'Logistique & Transport',
    sector_tags: ['B2B', 'Zone urbaine', 'Faible capital'],
    problem_statement:
      "Les commercants de quartier s approvisionnent individuellement au marche de gros, chacun perdant une demi-journee et payant un transport plein pour une charge partielle. Le cout unitaire du transport represente une part significative de leur marge.",
    target_market:
      "Boutiques d alimentation generale et petits restaurants des quartiers peripheriques, s approvisionnant plusieurs fois par semaine sur un meme marche de gros.",
    executive_summary:
      "Le service groupe les commandes de plusieurs boutiques d un meme axe sur une tournee unique, avec une commande passee la veille par message vocal ou WhatsApp et une livraison en debut de matinee.",
    market_size:
      "Plusieurs milliers de boutiques par ville sur la zone cible, avec une frequence d approvisionnement de deux a quatre fois par semaine.",
    competitive_advantage:
      "Le gain n est pas technologique mais organisationnel : la densite par axe permet de diviser le cout de transport par boutique tout en degageant une marge sur la tournee.",
    full_description:
      "Le dossier decrit le decoupage des axes, le calcul du point mort par tournee, le protocole de prise de commande et de reglement, et le plan de recrutement des chauffeurs.",
    solution_detail:
      "Prise de commande la veille, consolidation par axe, achat groupe au marche de gros, livraison matinale par tricycle motorise. Reglement a la livraison en especes ou par Mobile Money.",
    business_model:
      "Commission fixe par livraison, plus une marge sur l achat groupe negociee aupres des grossistes.",
    implementation_steps: [
      'Selectionner deux axes a forte densite de boutiques',
      'Recenser les boutiques et mesurer leur frequence d approvisionnement',
      'Louer deux tricycles et recruter les chauffeurs',
      'Negocier des remises volume aupres de trois grossistes',
      'Lancer les tournees et ajuster le decoupage horaire',
    ],
    resources_identified:
      "Loueurs de tricycles identifies, contacts de grossistes ouverts a une remise volume, modele de fiche de tournee.",
    ai_score: 52,
    display_level: DisplayLevel.STANDARD,
    ai_teaser:
      "Dix boutiques d un meme quartier font dix trajets separes vers le meme marche de gros. Ce dossier organise la tournee unique qui remplace les dix.",
    selling_mode: SellingMode.FIXED_PRICE,
    fixed_price: 350_000,
    estimated_cost_min: 4_000_000,
    estimated_cost_max: 7_000_000,
    implementation_months: 5,
    projected_revenue: "Annee 1 : 11 millions FCFA sur quatre axes.",
  },
];

async function main(): Promise<void> {
  console.log('Initialisation du jeu de donnees de demonstration...');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ideamarket.africa' },
    update: {},
    create: {
      email: 'admin@ideamarket.africa',
      name: 'Administration IdeaMarket',
      password_hash: passwordHash,
      role: Role.ADMIN,
      country: 'BJ',
      email_verified: true,
      bio: "Equipe de moderation et de support de la plateforme.",
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'awa@ideamarket.africa' },
    update: {},
    create: {
      email: 'awa@ideamarket.africa',
      name: 'Awa Diallo',
      password_hash: passwordHash,
      role: Role.BOTH,
      country: 'SN',
      phone: '+221770000000',
      email_verified: true,
      bio: "Ingenieure agroalimentaire, dix ans de terrain sur les filieres fruits et legumes en Afrique de l Ouest.",
    },
  });

  const secondSeller = await prisma.user.upsert({
    where: { email: 'kofi@ideamarket.africa' },
    update: {},
    create: {
      email: 'kofi@ideamarket.africa',
      name: 'Kofi Mensah',
      password_hash: passwordHash,
      role: Role.SELLER,
      country: 'CI',
      phone: '+225070000000',
      email_verified: true,
      bio: "Consultant en logistique urbaine, ancien responsable des operations d un distributeur regional.",
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'fatou@ideamarket.africa' },
    update: {},
    create: {
      email: 'fatou@ideamarket.africa',
      name: 'Fatou Kone',
      password_hash: passwordHash,
      role: Role.BUYER,
      country: 'BJ',
      phone: '+229970000000',
      email_verified: true,
      wallet_balance: 2_000_000,
      bio: "Investisseuse, cherche des projets a fort impact local et a capital d amorcage maitrise.",
    },
  });

  const sellers = [seller, secondSeller, seller, secondSeller];

  for (const [index, project] of PROJECTS.entries()) {
    const owner = sellers[index % sellers.length] ?? seller;
    const submittedAt = new Date(Date.now() - (index + 1) * 5 * 24 * 3_600_000);

    const hash = contentHash([
      project.title,
      project.tagline,
      project.category,
      project.problem_statement,
      project.target_market,
      project.executive_summary,
      project.full_description,
      project.solution_detail,
      project.business_model,
      project.implementation_steps.join(' '),
    ]);

    await prisma.project.upsert({
      where: { slug: project.slug },
      update: {},
      create: {
        slug: project.slug,
        title: project.title,
        tagline: project.tagline,
        category: project.category,
        sector_tags: project.sector_tags,
        problem_statement: project.problem_statement,
        target_market: project.target_market,
        executive_summary: project.executive_summary,
        market_size: project.market_size,
        competitive_advantage: project.competitive_advantage,
        full_description: project.full_description,
        solution_detail: project.solution_detail,
        business_model: project.business_model,
        implementation_steps: project.implementation_steps,
        resources_identified: project.resources_identified,
        images: [],
        attachments: [],
        estimated_cost_min: project.estimated_cost_min,
        estimated_cost_max: project.estimated_cost_max,
        implementation_months: project.implementation_months,
        projected_revenue: project.projected_revenue,
        selling_mode: project.selling_mode,
        fixed_price: project.fixed_price ?? null,
        auction_start_price: project.auction_start_price ?? null,
        auction_reserve_price: project.auction_reserve_price ?? null,
        auction_end_date: project.auction_days
          ? new Date(Date.now() + project.auction_days * 24 * 3_600_000)
          : null,
        currency: 'XOF',
        status: project.status ?? ProjectStatus.PUBLISHED,
        display_level: project.display_level,
        ai_score: project.ai_score,
        ai_evaluation: evaluation(project.ai_score, project.ai_teaser),
        ai_teaser: project.ai_teaser,
        content_hash: hash,
        submitted_at: submittedAt,
        similarity_status: SimilarityStatus.CLEAR,
        similar_projects: [],
        views_count: 40 + index * 37,
        saves_count: 3 + index * 4,
        seller_id: owner.id,
      },
    });
  }

  // Une enchere avec deux offres deja deposees.
  const auctionProject = await prisma.project.findUnique({
    where: { slug: 'sechoir-solaire-mangue-korhogo' },
    select: { id: true, auction_start_price: true },
  });

  if (auctionProject && (await prisma.bid.count({ where: { project_id: auctionProject.id } })) === 0) {
    const start = auctionProject.auction_start_price ?? 400_000;
    await prisma.bid.createMany({
      data: [
        { project_id: auctionProject.id, bidder_id: buyer.id, amount: start, status: 'ACTIVE' },
        {
          project_id: auctionProject.id,
          bidder_id: buyer.id,
          amount: Math.round(start * 1.2),
          status: 'WINNING',
        },
      ],
    });
  }

  // Une vente finalisee, pour alimenter le portefeuille et l historique.
  const soldProject = await prisma.project.findUnique({
    where: { slug: 'plateforme-logistique-derniers-kilometres' },
    select: { id: true, seller_id: true, fixed_price: true },
  });

  if (soldProject && !(await prisma.transaction.findUnique({ where: { project_id: soldProject.id } }))) {
    const amount = soldProject.fixed_price ?? 350_000;
    const fee = Math.round(amount * 0.1);

    await prisma.transaction.create({
      data: {
        project_id: soldProject.id,
        buyer_id: buyer.id,
        seller_id: soldProject.seller_id,
        amount,
        platform_fee: fee,
        seller_earnings: amount - fee,
        payment_method: 'WAVE',
        status: 'COMPLETED',
      },
    });

    await prisma.project.update({
      where: { id: soldProject.id },
      data: { status: ProjectStatus.SOLD },
    });

    await prisma.user.update({
      where: { id: soldProject.seller_id },
      data: { wallet_balance: { increment: amount - fee } },
    });
  }

  console.log('Termine.');
  console.log('Comptes de demonstration (mot de passe commun) :');
  console.table([
    { email: admin.email, role: 'ADMIN', 'mot de passe': DEMO_PASSWORD },
    { email: seller.email, role: 'BOTH', 'mot de passe': DEMO_PASSWORD },
    { email: secondSeller.email, role: 'SELLER', 'mot de passe': DEMO_PASSWORD },
    { email: buyer.email, role: 'BUYER', 'mot de passe': DEMO_PASSWORD },
  ]);
}

main()
  .catch((error) => {
    console.error('Echec du seed :', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
