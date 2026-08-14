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
export declare const MEDIA_CONTRACT_VERSION = 1;
/**
 * Le chemin de la route, ici et nulle part ailleurs : producteur et
 * consommateur l'importent tous deux — un chemin dupliqué en dur serait la
 * seule pièce du contrat sans alarme de dérive.
 */
export declare const MEDIA_V1_PATH = "/api/public/v1/media";
/** Un média tel que le site le lit — clés inconnues ignorées (additif). */
export declare const mediaItemV1Schema: z.ZodObject<{
    id: z.ZodNumber;
    url: z.ZodString;
    mimeType: z.ZodString;
    width: z.ZodNullable<z.ZodNumber>;
    height: z.ZodNullable<z.ZodNumber>;
    alt: z.ZodNullable<z.ZodString>;
    titre: z.ZodNullable<z.ZodString>;
    posterUrl: z.ZodNullable<z.ZodString>;
    categorie: z.ZodString;
}, z.core.$strip>;
export type MediaItemV1 = z.infer<typeof mediaItemV1Schema>;
/** Le même, côté producteur — une clé de trop fait échouer l'émission. */
export declare const mediaItemV1StrictSchema: z.ZodObject<{
    id: z.ZodNumber;
    url: z.ZodString;
    mimeType: z.ZodString;
    width: z.ZodNullable<z.ZodNumber>;
    height: z.ZodNullable<z.ZodNumber>;
    alt: z.ZodNullable<z.ZodString>;
    titre: z.ZodNullable<z.ZodString>;
    posterUrl: z.ZodNullable<z.ZodString>;
    categorie: z.ZodString;
}, z.core.$strict>;
/** L'enveloppe complète, côté consommateur (tolérante). */
export declare const mediaCollectionV1Schema: z.ZodObject<{
    contractVersion: z.ZodNumber;
    generatedAt: z.ZodString;
    digest: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        url: z.ZodString;
        mimeType: z.ZodString;
        width: z.ZodNullable<z.ZodNumber>;
        height: z.ZodNullable<z.ZodNumber>;
        alt: z.ZodNullable<z.ZodString>;
        titre: z.ZodNullable<z.ZodString>;
        posterUrl: z.ZodNullable<z.ZodString>;
        categorie: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type MediaCollectionV1 = z.infer<typeof mediaCollectionV1Schema>;
/**
 * L'enveloppe complète, côté producteur (stricte). `contractVersion` y est
 * FIGÉE à la version émise par CE paquet : le tolérant accepte l'avenir,
 * le strict n'émet que le présent.
 */
export declare const mediaCollectionV1StrictSchema: z.ZodObject<{
    contractVersion: z.ZodLiteral<1>;
    generatedAt: z.ZodString;
    digest: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        url: z.ZodString;
        mimeType: z.ZodString;
        width: z.ZodNullable<z.ZodNumber>;
        height: z.ZodNullable<z.ZodNumber>;
        alt: z.ZodNullable<z.ZodString>;
        titre: z.ZodNullable<z.ZodString>;
        posterUrl: z.ZodNullable<z.ZodString>;
        categorie: z.ZodString;
    }, z.core.$strict>>;
}, z.core.$strict>;
