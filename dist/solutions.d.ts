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
export declare const SOLUTIONS_CONTRACT_VERSION = 1;
/** Le chemin de la route — ici et nulle part ailleurs. */
export declare const SOLUTIONS_V1_PATH = "/api/public/v1/solutions";
/** Consommateur (le site) : une clé inconnue est ignorée, jamais une erreur. */
export declare const solutionV1Schema: z.ZodObject<{
    reference: z.ZodString;
    formule: z.ZodNullable<z.ZodString>;
    audience: z.ZodNullable<z.ZodNumber>;
    tailleM: z.ZodNullable<z.ZodNumber>;
    ecranDesignation: z.ZodNullable<z.ZodString>;
    projecteur: z.ZodNullable<z.ZodString>;
    son: z.ZodNullable<z.ZodString>;
    accessoires: z.ZodNullable<z.ZodString>;
    prixHT: z.ZodNumber;
}, z.core.$strip>;
/** Producteur (le CRM) : une clé de trop échoue avant d'être émise. */
export declare const solutionV1StrictSchema: z.ZodObject<{
    reference: z.ZodString;
    formule: z.ZodNullable<z.ZodString>;
    audience: z.ZodNullable<z.ZodNumber>;
    tailleM: z.ZodNullable<z.ZodNumber>;
    ecranDesignation: z.ZodNullable<z.ZodString>;
    projecteur: z.ZodNullable<z.ZodString>;
    son: z.ZodNullable<z.ZodString>;
    accessoires: z.ZodNullable<z.ZodString>;
    prixHT: z.ZodNumber;
}, z.core.$strict>;
export type SolutionV1 = z.infer<typeof solutionV1Schema>;
export declare const solutionsCollectionV1Schema: z.ZodObject<{
    contractVersion: z.ZodNumber;
    generatedAt: z.ZodString;
    digest: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        reference: z.ZodString;
        formule: z.ZodNullable<z.ZodString>;
        audience: z.ZodNullable<z.ZodNumber>;
        tailleM: z.ZodNullable<z.ZodNumber>;
        ecranDesignation: z.ZodNullable<z.ZodString>;
        projecteur: z.ZodNullable<z.ZodString>;
        son: z.ZodNullable<z.ZodString>;
        accessoires: z.ZodNullable<z.ZodString>;
        prixHT: z.ZodNumber;
    }, z.core.$strip> | z.ZodObject<{
        reference: z.ZodString;
        formule: z.ZodNullable<z.ZodString>;
        audience: z.ZodNullable<z.ZodNumber>;
        tailleM: z.ZodNullable<z.ZodNumber>;
        ecranDesignation: z.ZodNullable<z.ZodString>;
        projecteur: z.ZodNullable<z.ZodString>;
        son: z.ZodNullable<z.ZodString>;
        accessoires: z.ZodNullable<z.ZodString>;
        prixHT: z.ZodNumber;
    }, z.core.$strict>>;
}, z.core.$strip>;
export declare const solutionsCollectionV1StrictSchema: z.ZodObject<{
    contractVersion: z.ZodLiteral<1>;
    generatedAt: z.ZodString;
    digest: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        reference: z.ZodString;
        formule: z.ZodNullable<z.ZodString>;
        audience: z.ZodNullable<z.ZodNumber>;
        tailleM: z.ZodNullable<z.ZodNumber>;
        ecranDesignation: z.ZodNullable<z.ZodString>;
        projecteur: z.ZodNullable<z.ZodString>;
        son: z.ZodNullable<z.ZodString>;
        accessoires: z.ZodNullable<z.ZodString>;
        prixHT: z.ZodNumber;
    }, z.core.$strip> | z.ZodObject<{
        reference: z.ZodString;
        formule: z.ZodNullable<z.ZodString>;
        audience: z.ZodNullable<z.ZodNumber>;
        tailleM: z.ZodNullable<z.ZodNumber>;
        ecranDesignation: z.ZodNullable<z.ZodString>;
        projecteur: z.ZodNullable<z.ZodString>;
        son: z.ZodNullable<z.ZodString>;
        accessoires: z.ZodNullable<z.ZodString>;
        prixHT: z.ZodNumber;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type SolutionsCollectionV1 = z.infer<typeof solutionsCollectionV1Schema>;
