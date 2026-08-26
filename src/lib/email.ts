import { Resend } from 'resend';
import { APP_NAME } from '@/lib/constants';
import { env, isEmailConfigured, publicEnv } from '@/lib/env';

let cachedResend: Resend | null = null;

function getResend(): Resend | null {
  if (!isEmailConfigured()) return null;
  if (!cachedResend) cachedResend = new Resend(env.RESEND_API_KEY);
  return cachedResend;
}

export interface EmailPayload {
  to: string;
  subject: string;
  heading: string;
  body: string[];
  cta?: { label: string; url: string };
  footerNote?: string;
}

/** Gabarit HTML unique, aux couleurs de la charte. */
export function renderEmailHtml(payload: EmailPayload): string {
  const paragraphs = payload.body
    .map(
      (line) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1A1A2E;">${escapeHtml(line)}</p>`,
    )
    .join('');

  const cta = payload.cta
    ? `<a href="${payload.cta.url}" style="display:inline-block;background:#E8622A;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px;">${escapeHtml(payload.cta.label)}</a>`
    : '';

  const footer = payload.footerNote
    ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#6B6B7B;">${escapeHtml(payload.footerNote)}</p>`
    : '';

  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:24px;background:#FAFAF7;font-family:'Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:16px;border:1px solid #E6E4DC;">
      <tr>
        <td style="padding:28px 32px 8px;">
          <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#D4A843;font-weight:700;">${APP_NAME}</p>
          <h1 style="margin:12px 0 20px;font-size:22px;line-height:1.3;color:#1A1A2E;">${escapeHtml(payload.heading)}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 28px;">
          ${paragraphs}
          ${cta}
          ${footer}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 24px;border-top:1px solid #E6E4DC;">
          <p style="margin:0;font-size:12px;color:#6B6B7B;">Vous recevez cet email parce que vous avez un compte sur ${APP_NAME}.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Envoie un email transactionnel.
 * L'echec d'envoi n'interrompt jamais le flux metier : il est journalise et
 * la fonction renvoie `false`.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn(`[email] non configure — email "${payload.subject}" non envoye a ${payload.to}`);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      html: renderEmailHtml(payload),
      text: [payload.heading, ...payload.body, payload.cta?.url ?? ''].filter(Boolean).join('\n\n'),
    });
    if (error) {
      console.error('[email] echec Resend :', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[email] exception lors de l envoi :', error);
    return false;
  }
}

export const appUrl = (path = ''): string =>
  `${publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

// --- Emails metier ---

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Bienvenue sur ${APP_NAME}`,
    heading: `Bienvenue ${name} !`,
    body: [
      "Votre compte est cree. Vous pouvez des maintenant explorer les idees en vente ou soumettre la votre.",
      "Chaque idee soumise recoit une empreinte SHA-256 horodatee : votre anteriorite est enregistree des la soumission.",
    ],
    cta: { label: 'Explorer les projets', url: appUrl('/projets') },
  });
}

export async function sendProjectPublishedEmail(
  to: string,
  projectTitle: string,
  slug: string,
  score: number,
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Votre projet "${projectTitle}" est en ligne`,
    heading: 'Votre projet est publie',
    body: [
      `"${projectTitle}" a passe le controle d'unicite et l'evaluation automatique.`,
      `Score d'evaluation : ${score}/100.`,
    ],
    cta: { label: 'Voir mon annonce', url: appUrl(`/projets/${slug}`) },
  });
}

export async function sendProjectRejectedEmail(
  to: string,
  projectTitle: string,
  reason: string,
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Votre projet "${projectTitle}" n'a pas ete publie`,
    heading: 'Publication refusee',
    body: [`Motif : ${reason}`, 'Vous pouvez corriger votre dossier et le soumettre a nouveau.'],
    cta: { label: 'Modifier mon projet', url: appUrl('/tableau-de-bord/projets') },
  });
}

export async function sendOutbidEmail(
  to: string,
  projectTitle: string,
  slug: string,
  newAmount: string,
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Vous avez ete surenchéri sur "${projectTitle}"`,
    heading: 'Votre enchere a ete depassee',
    body: [`La nouvelle meilleure offre sur "${projectTitle}" est de ${newAmount}.`],
    cta: { label: 'Surencherir', url: appUrl(`/projets/${slug}`) },
  });
}

export async function sendAuctionWonEmail(
  to: string,
  projectTitle: string,
  slug: string,
  amount: string,
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Vous remportez l'enchere sur "${projectTitle}"`,
    heading: 'Enchere remportee',
    body: [
      `Felicitations, vous remportez "${projectTitle}" pour ${amount}.`,
      "Finalisez le paiement pour debloquer le dossier complet et le contrat de cession.",
    ],
    cta: { label: 'Finaliser le paiement', url: appUrl(`/projets/${slug}/paiement`) },
  });
}

export async function sendSaleEmail(
  to: string,
  projectTitle: string,
  earnings: string,
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Votre projet "${projectTitle}" est vendu`,
    heading: 'Vente conclue',
    body: [
      `"${projectTitle}" vient d'etre achete.`,
      `Montant credite sur votre portefeuille : ${earnings}.`,
    ],
    cta: { label: 'Voir mon portefeuille', url: appUrl('/tableau-de-bord/portefeuille') },
  });
}

export async function sendPurchaseEmail(
  to: string,
  projectTitle: string,
  slug: string,
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Achat confirme : "${projectTitle}"`,
    heading: 'Achat confirme',
    body: [
      `Le dossier complet de "${projectTitle}" est desormais accessible depuis votre espace.`,
      'Votre contrat de cession de droits est joint a la transaction.',
    ],
    cta: { label: 'Acceder au dossier', url: appUrl(`/projets/${slug}`) },
  });
}
