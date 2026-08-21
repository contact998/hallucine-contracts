/**
 * Contrat catalogue/tarifs v1 — la frontière CRM → site pour les PRIX.
 *
 * C'est la zone la plus sensible du contrat : de l'autre côté de l'allowlist
 * vivent les prix d'achat, les marges et le sourcing. Ce fichier ne décrit que
 * la FORME publique ; l'allowlist elle-même (CATALOGUE_PUBLIC_KEYS), la
 * projection et le filtre occasion restent côté CRM — un test là-bas compare
 * les clés de ce schéma aux siennes, c'est l'alarme de dérive.
 *
 * Même patron que media.ts, avec deux particularités :
 *
 *   - la route est PARAMÉTRÉE par rôle (?role=…). La liste des rôles publics
 *     fait partie du contrat : le producteur REFUSE tout rôle hors de cette
 *     liste — sans elle, n'importe quel `roleSite` posé un jour en back-office
 *     (y compris `occasion`) deviendrait servable par l'URL ;
 *   - `specs` est un objet imbriqué : le schéma strict doit l'être AUSSI en
 *     profondeur, car z.strictObject ne traverse pas ses enfants — une clé de
 *     coût ajoutée DANS specs passerait un strict de surface.
 *
 * Formes vérifiées sur les valeurs réelles (373 items, 15/08/2026), pas sur
 * les seuls types déclarés : `slugSite` est null sur TOUS les packs et
 * locations, `designations` est {} sur les tentes, `specs` est null hors
 * écrans. Nullable partout, optional nulle part : la projection CRM écrit
 * toujours les 14 clés.
 */
import { z } from "zod";

export const CATALOGUE_CONTRACT_VERSION = 1;

/** Le chemin de la route — ici et nulle part ailleurs (voir MEDIA_V1_PATH). */
export const CATALOGUE_V1_PATH = "/api/public/v1/catalogue";

/**
 * Les rôles servables par la route v1. Miroir du registre ROLES_SITE_PUBLICS
 * du CRM (Gate 14), figé là-bas par test — et un test CRM compare les deux
 * listes. `occasion` n'y entrera jamais.
 */
export const CATALOGUE_V1_ROLES = [
  "ecran_vente",
  "pack",
  "location",
  "tente_vente",
  "mobilier_vente",
] as const;
export type CatalogueRoleV1 = (typeof CATALOGUE_V1_ROLES)[number];

/** L'URL complète pour un rôle — le nom du paramètre appartient au contrat. */
export function urlCatalogueV1(base: string, role: CatalogueRoleV1): string {
  return `${base.replace(/\/+$/, "")}${CATALOGUE_V1_PATH}?role=${encodeURIComponent(role)}`;
}

// ─── Les specs (écrans) — objet imbriqué, strict en profondeur ─────────────

const specsForme = {
  tailleHorsTout: z.string().nullable(),
  toile: z.string().nullable(),
  toileLargeurM: z.number().nullable(),
  poidsPublicKg: z.number().nullable(),
  hauteurBaseImageM: z.number().nullable(),
  montageMinutes: z.number().nullable(),
  personnesMin: z.number().nullable(),
  personnesMax: z.number().nullable(),
  garantieAns: z.number().nullable(),
  driveIn: z.boolean(),
  // Encombrement au sol et capacité — mobilier gonflable (2026-08-20).
  // Null sur les écrans : la clé existe partout, la valeur non.
  largeurCm: z.number().nullable(),
  profondeurCm: z.number().nullable(),
  hauteurCm: z.number().nullable(),
  placesAssises: z.number().nullable(),
  /* Hauteur du COUSSIN, sol → assise — pas la hauteur hors tout. Elle sert au
     site à poser une personne sur un meuble : un pouf de 40 cm et un tabouret
     de 70 cm ne s'assoient pas à la même hauteur, et une valeur unique faisait
     flotter les uns et enfoncer les autres. Null sur ce qui ne s'assoit pas. */
  hauteurAssiseCm: z.number().nullable(),
};

export const catalogueSpecsV1Schema = z.object(specsForme);
export const catalogueSpecsV1StrictSchema = z.strictObject(specsForme);
export type CatalogueSpecsV1 = z.infer<typeof catalogueSpecsV1Schema>;

// ─── Une caractéristique affichée (libellé + valeur) ───────────────────────

const caracteristiqueForme = { libelle: z.string(), valeur: z.string() };
export const catalogueCaracteristiqueV1Schema = z.object(caracteristiqueForme);
const caracteristiqueStricte = z.strictObject(caracteristiqueForme);

// ─── Un item du catalogue — les 14 clés de l'allowlist CRM ─────────────────

const itemForme = (
  specs: typeof catalogueSpecsV1Schema | typeof catalogueSpecsV1StrictSchema,
  caracteristique: typeof catalogueCaracteristiqueV1Schema | typeof caracteristiqueStricte,
) => ({
  id: z.number().int(),
  reference: z.string(),
  slugSite: z.string().nullable(),
  designation: z.string(),
  // Locales OUVERTES (z.record, pas un enum) : la colonne n'impose rien,
  // une locale ajoutée côté CRM ne doit pas casser le parse du site.
  designations: z.record(z.string(), z.string()),
  // number, jamais string : la base rend un DECIMAL "8200.00", c'est la
  // projection CRM qui convertit — un chemin qui la contourne émettrait des
  // strings, et le strict du producteur doit le refuser.
  prixHT: z.number(),
  tauxTVA: z.number(),
  categorie: z.string().nullable(),
  unite: z.string().nullable(),
  specs: specs.nullable(),
  caracteristiques: z.array(caracteristique),
  inclus: z.array(z.string()),
  caracteristiquesTrad: z.record(z.string(), z.array(caracteristique)),
  inclusTrad: z.record(z.string(), z.array(z.string())),
});

/** Côté consommateur (site) : une clé inconnue est IGNORÉE, jamais une erreur. */
export const catalogueItemV1Schema = z.object(
  itemForme(catalogueSpecsV1Schema, catalogueCaracteristiqueV1Schema),
);

/** Côté producteur (CRM) : une clé de trop est un ÉCHEC — strict en profondeur. */
export const catalogueItemV1StrictSchema = z.strictObject(
  itemForme(catalogueSpecsV1StrictSchema, caracteristiqueStricte),
);

export type CatalogueItemV1 = z.infer<typeof catalogueItemV1Schema>;

// ─── L'enveloppe ───────────────────────────────────────────────────────────

const collectionForme = (item: typeof catalogueItemV1Schema | typeof catalogueItemV1StrictSchema) => ({
  contractVersion: z.number().int().min(1),
  generatedAt: z.string(),
  digest: z.string(),
  // Tolérant : string ouverte — un rôle ajouté au contrat demain ne doit pas
  // casser un site pas encore mis à jour. Le strict, lui, n'émet que les
  // rôles d'aujourd'hui.
  role: z.string(),
  items: z.array(item),
});

export const catalogueCollectionV1Schema = z.object(collectionForme(catalogueItemV1Schema));

export const catalogueCollectionV1StrictSchema = z.strictObject({
  ...collectionForme(catalogueItemV1StrictSchema),
  contractVersion: z.literal(CATALOGUE_CONTRACT_VERSION),
  role: z.enum(CATALOGUE_V1_ROLES),
});

export type CatalogueCollectionV1 = z.infer<typeof catalogueCollectionV1Schema>;
