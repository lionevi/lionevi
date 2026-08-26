import type { Metadata } from 'next';
import { APP_NAME, DEFAULT_PLATFORM_FEE_PERCENT } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: `Conditions generales d'utilisation et de vente de ${APP_NAME}.`,
};

const SECTIONS = [
  {
    title: 'Article 1 — Objet',
    body: [
      `${APP_NAME} exploite une place de marche permettant a des porteurs d'idees de mettre en vente des dossiers de projet, et a des acquereurs de s'en porter acquereurs, a prix fixe ou aux encheres.`,
      "La plateforme agit comme intermediaire technique et tiers de confiance. Elle n'est ni l'auteur ni le proprietaire des dossiers deposes.",
    ],
  },
  {
    title: 'Article 2 — Compte utilisateur',
    body: [
      "L'inscription requiert une adresse email valide et des informations exactes. Chaque utilisateur est responsable de la confidentialite de ses identifiants.",
      "Un compte peut etre suspendu en cas de fraude, de contournement des regles de la messagerie, de depot de contenu illicite ou de manquement grave aux presentes conditions.",
    ],
  },
  {
    title: 'Article 3 — Depot et publication',
    body: [
      "Le vendeur garantit etre l'auteur du dossier depose et en avoir la libre disposition. Le depot d'un contenu appartenant a un tiers est interdit.",
      "Chaque dossier est soumis a un controle d'unicite et a une evaluation automatique. La plateforme peut refuser la publication d'un dossier en doublon, insuffisamment documente ou contraire a la loi.",
      "Le depot genere une empreinte SHA-256 horodatee. Ce certificat constitue un element de preuve d'anteriorite et ne vaut pas titre de propriete intellectuelle.",
    ],
  },
  {
    title: 'Article 4 — Confidentialite et NDA',
    body: [
      "L'acces a la couche confidentielle d'un dossier est subordonne a la signature electronique d'un accord de confidentialite, valable cinq ans.",
      "Toute exploitation, divulgation ou reproduction du contenu confidentiel sans acquisition prealable des droits engage la responsabilite de son auteur.",
    ],
  },
  {
    title: 'Article 5 — Transactions et commission',
    body: [
      `La plateforme preleve une commission de ${DEFAULT_PLATFORM_FEE_PERCENT} % sur chaque cession conclue. Cette commission est deduite de la part revenant au vendeur.`,
      "Le paiement est encaisse par la plateforme, qui reverse le net au vendeur sur son portefeuille interne. Les retraits s'effectuent vers un compte Mobile Money.",
      "Un contrat de cession de droits est genere automatiquement pour chaque transaction finalisee. L'acceptation des presentes conditions et le reglement du prix valent signature electronique de ce contrat.",
    ],
  },
  {
    title: 'Article 6 — Encheres',
    body: [
      "Une offre deposee est ferme et irrevocable. Chaque nouvelle offre doit depasser la precedente d'au moins 5 %.",
      "Toute offre deposee dans les cinq dernieres minutes prolonge la vente de cinq minutes. Si le prix de reserve n'est pas atteint, la vente n'est pas conclue.",
      "Le gagnant dispose de 48 heures pour regler. A defaut, la plateforme peut annuler l'adjudication et suspendre le compte.",
    ],
  },
  {
    title: 'Article 7 — Interdictions',
    body: [
      "Sont notamment interdits : le contournement de la plateforme pour conclure une transaction, l'echange de coordonnees directes dans la messagerie avant la vente, le depot de contenus frauduleux, diffamatoires ou illicites, et toute tentative d'obtenir un contenu confidentiel sans contrepartie.",
    ],
  },
  {
    title: 'Article 8 — Responsabilite',
    body: [
      "La plateforme fournit un service d'intermediation. Elle ne garantit ni la rentabilite, ni la faisabilite, ni le succes commercial d'un projet acquis.",
      "L'evaluation automatique est une aide a la decision : elle n'engage pas la plateforme et ne constitue pas un conseil en investissement.",
    ],
  },
  {
    title: 'Article 9 — Litiges',
    body: [
      "Les parties s'engagent a rechercher une solution amiable, le cas echeant par la mediation de la plateforme. A defaut d'accord dans un delai de trente jours, le litige releve des juridictions competentes.",
    ],
  },
] as const;

export default function TermsPage(): React.JSX.Element {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-display text-3xl font-bold">Conditions d&apos;utilisation</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ce document decrit les regles applicables a l&apos;usage de la plateforme. Il doit etre
        revu par un conseil juridique avant toute exploitation commerciale.
      </p>

      <div className="mt-8 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-lg font-bold">{section.title}</h2>
            <div className="prose-fr mt-2">
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
