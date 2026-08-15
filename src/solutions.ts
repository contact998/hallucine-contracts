/**
 * Contrat solutions v1 — les packs cinéma complets (écran + projecteur + son).
 *
 * POURQUOI UN CONTRAT SÉPARÉ DU CATALOGUE : `catalogue.solutions` ne sort PAS
 * de `toCataloguePublicItem`. C'est un second DTO, assemblé depuis la
 * nomenclature — un pack et ses composants, aplatis en une ligne lisible.
 * L'élargir dans le schéma catalogue aurait fait une allowlist fourre-tout ;
 * la Gate 13 veut une projection par type de sortie, pas une par route.
 *
 * CE QUE LE SITE FAISAIT DE TRAVERS, ET QUE CE CONTRAT TRANCHE : sa copie
 * manuelle du type déclarait `audience: string` (« 50–150 spectateurs »)
 * quand le CRM émet un NOMBRE, et `formule`/`tailleM` non-nullables quand le
 * CRM peut rendre null — ces valeurs sont DÉRIVÉES de la désignation par
 * expression régulière, elles manquent dès qu'un libellé sort du format.
 * Le contrat porte la forme du producteur ; l'affichage reste au site.
 */
import { z } from "zod";

export const SOLUTIONS_CONTRACT_VERSION = 1;

/** Le chemin de la route — ici et nulle part ailleurs. */
export const SOLUTIONS_V1_PATH = "/api/public/v1/solutions";

const solutionForme = {
  reference: z.string(),
  /** « Essentiel » | « Confort » | « Prestige » — dérivé de la désignation, donc nullable. */
  formule: z.string().nullable(),
  /** Nombre de spectateurs (100, 400, 1500…), dérivé lui aussi. NOMBRE, pas libellé. */
  audience: z.number().nullable(),
  /** Largeur de toile de l'écran inclus, en mètres — dérivée de sa référence. */
  tailleM: z.number().nullable(),
  ecranDesignation: z.string().nullable(),
  projecteur: z.string().nullable(),
  son: z.string().nullable(),
  accessoires: z.string().nullable(),
  prixHT: z.number(),
};

/** Consommateur (le site) : une clé inconnue est ignorée, jamais une erreur. */
export const solutionV1Schema = z.object(solutionForme);

/** Producteur (le CRM) : une clé de trop échoue avant d'être émise. */
export const solutionV1StrictSchema = z.strictObject(solutionForme);

export type SolutionV1 = z.infer<typeof solutionV1Schema>;

const collectionForme = (item: typeof solutionV1Schema | typeof solutionV1StrictSchema) => ({
  contractVersion: z.number().int().min(1),
  generatedAt: z.string(),
  digest: z.string(),
  items: z.array(item),
});

export const solutionsCollectionV1Schema = z.object(collectionForme(solutionV1Schema));

export const solutionsCollectionV1StrictSchema = z.strictObject({
  ...collectionForme(solutionV1StrictSchema),
  contractVersion: z.literal(SOLUTIONS_CONTRACT_VERSION),
});

export type SolutionsCollectionV1 = z.infer<typeof solutionsCollectionV1Schema>;
