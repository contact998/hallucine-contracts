/**
 * Contrat v1 — GET /api/public/v1/media (CRM → site).
 *
 * Le fond d'images du site : le CRM en est le maître, le site le lit sans
 * jamais l'écrire. Ce fichier dit la FORME de ce qui circule — il ne décide
 * pas de ce qui est public : l'allowlist et la projection vivent côté CRM
 * (shared/mediaPublic.ts, verrouillées par server/media-public.test.ts).
 *
 * DEUX SCHÉMAS PAR OBJET, ET C'EST LE CŒUR DU CONTRAT :
 *
 *   - le schéma TOLÉRANT (par défaut) est celui du CONSOMMATEUR. Il ignore
 *     les clés inconnues : un champ ajouté côté CRM ne casse pas un site qui
 *     ne le connaît pas encore. C'est la règle « additif uniquement » rendue
 *     mécanique — et c'est pourquoi le CRM se déploie toujours en premier.
 *   - le schéma STRICT est celui du PRODUCTEUR. Le CRM valide sa propre
 *     réponse avant de l'émettre : une clé de trop est un bug d'allowlist,
 *     et mieux vaut une 500 avec un journal qu'une fuite indexée.
 *
 * Les champs optionnels sont `null`, jamais absents : la projection du CRM
 * écrit toujours les neuf clés. `z.nullable()` et non `z.optional()`.
 */
import { z } from "zod";

/** Version du contrat média. S'incrémente sur rupture — donc en théorie jamais :
 *  la règle est d'ajouter, pas de retirer. Le site la vérifie en réception. */
export const MEDIA_CONTRACT_VERSION = 1;

/**
 * Le chemin de la route, ici et nulle part ailleurs : producteur et
 * consommateur l'importent tous deux — un chemin dupliqué en dur serait la
 * seule pièce du contrat sans alarme de dérive.
 */
export const MEDIA_V1_PATH = "/api/public/v1/media";

const itemForme = {
  id: z.number().int(),
  url: z.string(),
  mimeType: z.string(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  alt: z.string().nullable(),
  titre: z.string().nullable(),
  /**
   * `alt` et `titre` traduits, par locale (en/de/es/it/pt). Le français est la
   * SOURCE et reste dans `alt`/`titre` ; ces cartes ne le contiennent jamais.
   * Une locale absente = pas encore traduite, le site retombe sur le français.
   *
   * Ajouté le 16/08/2026. Jusque-là le site servait le texte alternatif
   * français sur les six domaines : c'est ce que Google lit pour indexer une
   * image, et ce qu'un lecteur d'écran prononce à un visiteur aveugle. Même
   * forme que `designations` du contrat catalogue — un précédent, pas une
   * invention.
   */
  alts: z.record(z.string(), z.string()),
  titres: z.record(z.string(), z.string()),
  posterUrl: z.string().nullable(),
  categorie: z.string(),
};

/** Un média tel que le site le lit — clés inconnues ignorées (additif). */
export const mediaItemV1Schema = z.object(itemForme);
export type MediaItemV1 = z.infer<typeof mediaItemV1Schema>;

/** Le même, côté producteur — une clé de trop fait échouer l'émission. */
export const mediaItemV1StrictSchema = z.strictObject(itemForme);

const collectionForme = <T extends z.ZodType>(item: T) => ({
  /** Toujours MEDIA_CONTRACT_VERSION côté producteur ; le site tolère les
   *  versions SUPÉRIEURES (un contrat v2 additif reste lisible en v1). */
  contractVersion: z.number().int().min(1),
  /** Horodatage ISO de la génération de la réponse. */
  generatedAt: z.string(),
  /** Empreinte stable du tableau `items` (sha256 hexadécimal côté CRM).
   *  Deux réponses au même digest portent exactement les mêmes médias —
   *  c'est aussi la valeur de l'en-tête ETag. */
  digest: z.string(),
  items: z.array(item),
});

/** L'enveloppe complète, côté consommateur (tolérante). */
export const mediaCollectionV1Schema = z.object(collectionForme(mediaItemV1Schema));
export type MediaCollectionV1 = z.infer<typeof mediaCollectionV1Schema>;

/**
 * L'enveloppe complète, côté producteur (stricte). `contractVersion` y est
 * FIGÉE à la version émise par CE paquet : le tolérant accepte l'avenir,
 * le strict n'émet que le présent.
 */
export const mediaCollectionV1StrictSchema = z.strictObject({
  ...collectionForme(mediaItemV1StrictSchema),
  contractVersion: z.literal(MEDIA_CONTRACT_VERSION),
});
