import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Politique de confidentialite',
  description: `Traitement des donnees personnelles sur ${APP_NAME}.`,
};

const SECTIONS = [
  {
    title: 'Donnees collectees',
    body: [
      "Donnees de compte : nom, adresse email, pays, telephone, photo de profil, mot de passe hache (bcrypt) ou identifiant du fournisseur OAuth.",
      "Donnees d'usage : projets deposes, empreintes de contenu, encheres, transactions, messages, notifications, favoris.",
      "Donnees de preuve : lors de la signature d'un NDA, l'adresse IP et le navigateur sont enregistres — ils constituent la signature electronique.",
    ],
  },
  {
    title: 'Finalites',
    body: [
      "Fournir le service : publication des projets, mise en relation, encheres, paiements et generation des contrats.",
      "Assurer la securite : prevention de la fraude, moderation de la messagerie, preuve d'anteriorite en cas de litige.",
      "Communiquer : notifications in-app et emails transactionnels lies a votre activite.",
    ],
  },
  {
    title: 'Sous-traitants',
    body: [
      "Hebergement et base de donnees : Vercel et Supabase. Paiements : Stripe et les operateurs Mobile Money concernes. Emails : Resend. Evaluation et moderation automatiques : API Anthropic (Claude).",
      "Le contenu des dossiers transmis a l'API d'evaluation n'est utilise que pour produire le score, l'analyse de similarite et le teaser.",
    ],
  },
  {
    title: 'Conservation',
    body: [
      "Les donnees de compte sont conservees tant que le compte est actif. Les empreintes, horodatages, transactions et contrats sont conserves au-dela, en tant que preuves comptables et d'anteriorite.",
    ],
  },
  {
    title: 'Vos droits',
    body: [
      "Vous disposez d'un droit d'acces, de rectification, d'effacement, de limitation et de portabilite sur vos donnees. Les informations modifiables le sont directement depuis votre profil.",
      "Pour toute demande, ecrivez-nous depuis la page de contact. Une reponse est apportee sous trente jours.",
    ],
  },
  {
    title: 'Cookies',
    body: [
      "La plateforme depose un cookie de session necessaire a l'authentification. Aucun cookie publicitaire n'est utilise.",
    ],
  },
] as const;

export default function PrivacyPage(): React.JSX.Element {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-display text-3xl font-bold">Politique de confidentialite</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ce document decrit le traitement des donnees personnelles. Il doit etre adapte a la
        legislation applicable a votre pays d&apos;exploitation avant mise en production.
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
