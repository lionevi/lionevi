import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { APP_NAME } from '@/lib/constants';
import { anteriorityCertificateNumber } from '@/lib/hash';
import { formatCurrency, formatDate } from '@/lib/utils';

const COLORS = {
  primary: rgb(0.91, 0.38, 0.16), // #E8622A
  secondary: rgb(0.83, 0.66, 0.26), // #D4A843
  text: rgb(0.1, 0.1, 0.18), // #1A1A2E
  muted: rgb(0.42, 0.42, 0.48),
  line: rgb(0.9, 0.89, 0.86),
};

const PAGE = { width: 595.28, height: 841.89, margin: 56 }; // A4 en points

/**
 * Les polices standard PDF utilisent l'encodage WinAnsi : on retire les
 * caracteres hors CP1252 pour eviter une exception a l'ecriture.
 */
function sanitize(text: string): string {
  return text
    .replace(/’/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '');
}

interface Cursor {
  page: PDFPage;
  y: number;
}

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of sanitize(text).split('\n')) {
    let current = '';
    for (const word of paragraph.split(/\s+/)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    lines.push(current);
  }
  return lines;
}

export interface ContractData {
  transactionId: string;
  projectTitle: string;
  projectSlug: string;
  contentHash: string;
  submittedAt: Date;
  soldAt: Date;
  amount: number;
  currency: string;
  platformFee: number;
  sellerEarnings: number;
  paymentMethod: string;
  seller: { name: string; email: string; country: string };
  buyer: { name: string; email: string; country: string };
}

/** Genere le contrat de cession de droits au format PDF (A4, francais). */
export async function generateTransferContract(data: ContractData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Contrat de cession - ${sanitize(data.projectTitle)}`);
  pdf.setAuthor(APP_NAME);
  pdf.setSubject("Contrat de cession de droits sur une idee de projet");
  pdf.setCreationDate(data.soldAt);

  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };

  const contentWidth = PAGE.width - PAGE.margin * 2;
  const cursor: Cursor = { page: pdf.addPage([PAGE.width, PAGE.height]), y: PAGE.height - PAGE.margin };

  const ensureSpace = (needed: number): void => {
    if (cursor.y - needed < PAGE.margin + 40) {
      cursor.page = pdf.addPage([PAGE.width, PAGE.height]);
      cursor.y = PAGE.height - PAGE.margin;
    }
  };

  const writeParagraph = (text: string, size = 10.5, font: PDFFont = fonts.regular): void => {
    const lines = wrapText(text, font, size, contentWidth);
    for (const line of lines) {
      ensureSpace(size + 5);
      cursor.page.drawText(line, {
        x: PAGE.margin,
        y: cursor.y,
        size,
        font,
        color: COLORS.text,
      });
      cursor.y -= size + 5;
    }
    cursor.y -= 6;
  };

  const writeHeading = (text: string): void => {
    ensureSpace(30);
    cursor.y -= 6;
    cursor.page.drawText(sanitize(text), {
      x: PAGE.margin,
      y: cursor.y,
      size: 12,
      font: fonts.bold,
      color: COLORS.primary,
    });
    cursor.y -= 18;
  };

  const writeField = (label: string, value: string): void => {
    ensureSpace(16);
    const labelText = `${sanitize(label)} : `;
    cursor.page.drawText(labelText, {
      x: PAGE.margin,
      y: cursor.y,
      size: 10.5,
      font: fonts.bold,
      color: COLORS.text,
    });
    cursor.page.drawText(sanitize(value), {
      x: PAGE.margin + fonts.bold.widthOfTextAtSize(labelText, 10.5),
      y: cursor.y,
      size: 10.5,
      font: fonts.regular,
      color: COLORS.text,
    });
    cursor.y -= 16;
  };

  // En-tete
  cursor.page.drawRectangle({
    x: 0,
    y: PAGE.height - 8,
    width: PAGE.width,
    height: 8,
    color: COLORS.primary,
  });
  cursor.page.drawText(APP_NAME.toUpperCase(), {
    x: PAGE.margin,
    y: cursor.y,
    size: 11,
    font: fonts.bold,
    color: COLORS.secondary,
  });
  cursor.y -= 28;
  cursor.page.drawText('CONTRAT DE CESSION DE DROITS', {
    x: PAGE.margin,
    y: cursor.y,
    size: 18,
    font: fonts.bold,
    color: COLORS.text,
  });
  cursor.y -= 16;
  cursor.page.drawText(`Reference : ${data.transactionId}`, {
    x: PAGE.margin,
    y: cursor.y,
    size: 9,
    font: fonts.regular,
    color: COLORS.muted,
  });
  cursor.y -= 22;
  cursor.page.drawLine({
    start: { x: PAGE.margin, y: cursor.y },
    end: { x: PAGE.width - PAGE.margin, y: cursor.y },
    thickness: 1,
    color: COLORS.line,
  });
  cursor.y -= 24;

  // Parties
  writeHeading('ENTRE LES SOUSSIGNES');
  writeField('Le Cedant (vendeur)', `${data.seller.name} (${data.seller.email}) - ${data.seller.country}`);
  writeField('Le Cessionnaire (acheteur)', `${data.buyer.name} (${data.buyer.email}) - ${data.buyer.country}`);
  cursor.y -= 8;
  writeParagraph(
    "Il a ete convenu ce qui suit, par l'intermediaire de la plateforme " +
      `${APP_NAME}, agissant en qualite de tiers de confiance et de sequestre des fonds.`,
  );

  // Objet
  writeHeading('ARTICLE 1 - OBJET DE LA CESSION');
  writeField('Intitule du projet', data.projectTitle);
  writeField('Reference publique', `/projets/${data.projectSlug}`);
  writeField(
    "Certificat d'anteriorite",
    anteriorityCertificateNumber(data.contentHash, data.submittedAt),
  );
  writeField('Empreinte SHA-256', data.contentHash);
  writeField('Date de depot', formatDate(data.submittedAt));
  cursor.y -= 4;
  writeParagraph(
    "Le Cedant cede au Cessionnaire, a titre exclusif et definitif, l'integralite des droits " +
      "patrimoniaux attaches au dossier de projet designe ci-dessus : droit d'exploitation, " +
      'de reproduction, d\'adaptation et de commercialisation, pour tous pays et pour la duree ' +
      'legale de protection.',
  );

  // Prix
  writeHeading('ARTICLE 2 - PRIX ET REGLEMENT');
  writeField('Prix de cession', formatCurrency(data.amount, data.currency));
  writeField('Commission plateforme', formatCurrency(data.platformFee, data.currency));
  writeField('Net revenant au Cedant', formatCurrency(data.sellerEarnings, data.currency));
  writeField('Moyen de paiement', data.paymentMethod);
  writeField('Date de la transaction', formatDate(data.soldAt));
  cursor.y -= 4;
  writeParagraph(
    "Le paiement a ete integralement encaisse par la plateforme, qui en assure le reversement " +
      'au Cedant apres deduction de sa commission. Le present contrat vaut quittance.',
  );

  // Garanties
  writeHeading('ARTICLE 3 - GARANTIES DU CEDANT');
  writeParagraph(
    "Le Cedant garantit etre l'auteur original du dossier cede, en detenir la libre disposition, " +
      "et qu'il n'a fait l'objet d'aucune cession anterieure ni d'aucun nantissement. Il garantit " +
      "le Cessionnaire contre tout trouble, revendication ou eviction de la part de tiers.",
  );
  writeParagraph(
    "Le controle d'unicite realise par la plateforme lors du depot ne constitue pas un titre de " +
      "propriete intellectuelle et ne se substitue pas a un depot aupres d'un office competent " +
      '(OAPI, INPI ou equivalent).',
  );

  // Confidentialite
  writeHeading('ARTICLE 4 - CONFIDENTIALITE ET NON-CONCURRENCE');
  writeParagraph(
    "A compter de la signature, le Cedant s'interdit d'exploiter, de ceder a nouveau ou de " +
      'divulguer le contenu du dossier cede. Les elements confidentiels transmis avant la vente ' +
      'restent couverts par les accords de confidentialite signes sur la plateforme.',
  );

  // Litiges
  writeHeading('ARTICLE 5 - LITIGES');
  writeParagraph(
    "Les parties s'engagent a rechercher une solution amiable, le cas echeant par la mediation " +
      `de ${APP_NAME}, avant toute action contentieuse. A defaut d'accord dans un delai de trente ` +
      "jours, le litige releve des juridictions competentes du pays de residence du Cedant.",
  );

  // Signatures
  writeHeading('SIGNATURES ELECTRONIQUES');
  writeParagraph(
    `Contrat genere et horodate automatiquement par ${APP_NAME} le ${formatDate(data.soldAt)}. ` +
      "L'acceptation des conditions de vente et le reglement du prix valent signature electronique " +
      'des deux parties, conformement aux conditions generales de la plateforme.',
  );

  ensureSpace(70);
  const columnWidth = (contentWidth - 24) / 2;
  const boxY = cursor.y - 54;
  for (const [index, party] of [data.seller, data.buyer].entries()) {
    const x = PAGE.margin + index * (columnWidth + 24);
    cursor.page.drawRectangle({
      x,
      y: boxY,
      width: columnWidth,
      height: 54,
      borderColor: COLORS.line,
      borderWidth: 1,
    });
    cursor.page.drawText(index === 0 ? 'Le Cedant' : 'Le Cessionnaire', {
      x: x + 10,
      y: boxY + 36,
      size: 9,
      font: fonts.bold,
      color: COLORS.muted,
    });
    cursor.page.drawText(sanitize(party.name), {
      x: x + 10,
      y: boxY + 20,
      size: 11,
      font: fonts.bold,
      color: COLORS.text,
    });
    cursor.page.drawText(sanitize(party.email), {
      x: x + 10,
      y: boxY + 8,
      size: 8.5,
      font: fonts.regular,
      color: COLORS.muted,
    });
  }

  // Pied de page sur chaque page
  const pages = pdf.getPages();
  pages.forEach((page, index) => {
    page.drawText(
      sanitize(`${APP_NAME} - contrat ${data.transactionId} - page ${index + 1}/${pages.length}`),
      {
        x: PAGE.margin,
        y: PAGE.margin - 24,
        size: 8,
        font: fonts.regular,
        color: COLORS.muted,
      },
    );
  });

  return pdf.save();
}

export interface AnteriorityCertificateData {
  projectTitle: string;
  ownerName: string;
  ownerEmail: string;
  contentHash: string;
  submittedAt: Date;
}

/** Genere le certificat d'anteriorite remis au vendeur des la soumission. */
export async function generateAnteriorityCertificate(
  data: AnteriorityCertificateData,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([PAGE.width, PAGE.height]);
  const certificateNumber = anteriorityCertificateNumber(data.contentHash, data.submittedAt);

  page.drawRectangle({ x: 0, y: PAGE.height - 10, width: PAGE.width, height: 10, color: COLORS.primary });

  let y = PAGE.height - 120;
  page.drawText(APP_NAME.toUpperCase(), {
    x: PAGE.margin, y: PAGE.height - 70, size: 11, font: bold, color: COLORS.secondary,
  });
  page.drawText("CERTIFICAT D'ANTERIORITE", {
    x: PAGE.margin, y: PAGE.height - 96, size: 20, font: bold, color: COLORS.text,
  });

  const field = (label: string, value: string): void => {
    page.drawText(sanitize(label), { x: PAGE.margin, y, size: 9, font: bold, color: COLORS.muted });
    y -= 15;
    for (const line of wrapText(value, regular, 11, PAGE.width - PAGE.margin * 2)) {
      page.drawText(line, { x: PAGE.margin, y, size: 11, font: regular, color: COLORS.text });
      y -= 15;
    }
    y -= 10;
  };

  field('NUMERO DE CERTIFICAT', certificateNumber);
  field('PROJET', data.projectTitle);
  field('DEPOSANT', `${data.ownerName} (${data.ownerEmail})`);
  field('EMPREINTE SHA-256 DU CONTENU', data.contentHash);
  field('HORODATAGE DE DEPOT (UTC)', data.submittedAt.toISOString());

  y -= 10;
  for (const line of wrapText(
    "Ce certificat atteste qu'un contenu correspondant exactement a l'empreinte ci-dessus a ete " +
      `depose sur ${APP_NAME} a la date indiquee. Toute modification ulterieure du contenu produit ` +
      "une empreinte differente. Ce document constitue un element de preuve d'anteriorite ; il ne " +
      "vaut pas titre de propriete intellectuelle et ne remplace pas un depot aupres de l'OAPI, de " +
      "l'INPI ou de tout autre office competent.",
    regular,
    9.5,
    PAGE.width - PAGE.margin * 2,
  )) {
    page.drawText(line, { x: PAGE.margin, y, size: 9.5, font: regular, color: COLORS.muted });
    y -= 14;
  }

  return pdf.save();
}
