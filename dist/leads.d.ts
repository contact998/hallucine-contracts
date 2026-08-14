/**
 * Contrat lead v1 — le prospect qui traverse du site vers le CRM.
 *
 * LES RÔLES S'INVERSENT ICI : sur les flux média et catalogue, le CRM produit
 * et le site consomme. Un lead va dans l'autre sens — le SITE est le
 * producteur (schéma STRICT avant envoi : un payload hors contrat est un bug
 * d'émetteur à voir en test), le CRM le consommateur (schéma TOLÉRANT).
 *
 * ET LA TOLÉRANCE A UN SENS PLUS GRAVE QU'AILLEURS : un média refusé fait un
 * bloc vide, un lead refusé est UN CLIENT PERDU — le site classe tout 4xx
 * comme définitif, zéro nouvelle tentative. Le schéma consommateur n'exige
 * donc RIEN de plus que ce que la route historique exigeait déjà (entreprise
 * non vide, point) ; les bornes de longueur se règlent par TRONCATURE côté
 * CRM, jamais par rejet — aujourd'hui un champ trop long part en erreur SQL
 * 500, tronquer ferme ce trou sans coûter un seul lead.
 *
 * DÉROGATION ASSUMÉE AU PATRON « nullable jamais absent » : l'émetteur
 * historique OMET les champs vides (il ne les envoie pas à null), et la route
 * legacy le tolère depuis toujours. Le contrat suit l'existant : `optional`,
 * pas `nullable` — changer l'émetteur pour normaliser aurait fait porter un
 * risque au flux le plus précieux pour un bénéfice de symétrie.
 *
 * Les NOTES restent du texte libre : le CRM y détecte des marqueurs
 * (« Téléchargement document site », « Configuration tente X ») pour choisir
 * le modèle d'email automatique. Ce protocole n'est PAS restructuré par ce
 * contrat — le restructurer sans migrer les détections casserait le routage
 * des emails.
 */
import { z } from "zod";
export declare const LEAD_CONTRACT_VERSION = 1;
/** Le chemin de la route — ici et nulle part ailleurs. */
export declare const LEADS_V1_PATH = "/api/integrations/v1/leads";
/** Valeurs admises — miroirs des enums/validations du CRM, figées par test là-bas. */
export declare const LEAD_CONTACT_TYPES: readonly ["appel", "mail", "autre"];
export declare const LEAD_DOCUMENT_TYPES: readonly ["brochure", "technique"];
export declare const LEAD_LANGS: readonly ["fr", "en", "de", "es", "it", "pt"];
/**
 * Longueurs maximales, en OCTETS UTF-8 — l'unité de MySQL, pas celle de
 * JavaScript. « Saint-Étienne » fait 14 caractères et 15 octets : borner en
 * caractères laissait passer des valeurs trop lourdes pour leur colonne.
 *
 * Le producteur les applique en validation, le consommateur en TRONCATURE.
 * Un dépassement n'est jamais un lead perdu.
 */
export declare const LEAD_LIMITES: {
    readonly entreprise: 255;
    readonly prenom: 255;
    readonly personne: 255;
    readonly email: 320;
    readonly telephone: 50;
    readonly siret: 20;
    readonly produit: 255;
    readonly ville: 100;
    readonly codePostal: 10;
    readonly pays: 100;
    readonly lang: 10;
    readonly requestId: 64;
    /** TEXT MySQL = 65 535 OCTETS. Marge gardée pour la ligne « Source » que
     *  le CRM ajoute aux notes après réception. */
    readonly notes: 60000;
};
/**
 * Côté PRODUCTEUR (le site) : strict, bornes appliquées, avant l'envoi.
 * Un échec ici est un bug d'émetteur — à journaliser, jamais à transformer en
 * lead perdu : l'émetteur envoie quand même, le CRM tronquera.
 */
export declare const leadV1ProducteurSchema: z.ZodObject<{
    entreprise: z.ZodIntersection<z.ZodString, z.ZodString>;
    prenom: z.ZodOptional<z.ZodString>;
    personne: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    telephone: z.ZodOptional<z.ZodString>;
    siret: z.ZodOptional<z.ZodString>;
    produit: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    ville: z.ZodOptional<z.ZodString>;
    codePostal: z.ZodOptional<z.ZodString>;
    pays: z.ZodOptional<z.ZodString>;
    contactType: z.ZodOptional<z.ZodEnum<{
        appel: "appel";
        mail: "mail";
        autre: "autre";
    }>>;
    dateRealisationEnvisagee: z.ZodOptional<z.ZodString>;
    abandonPartiel: z.ZodOptional<z.ZodBoolean>;
    lang: z.ZodEnum<{
        fr: "fr";
        en: "en";
        de: "de";
        es: "es";
        it: "it";
        pt: "pt";
    }>;
    requestId: z.ZodIntersection<z.ZodString, z.ZodString>;
    documentType: z.ZodOptional<z.ZodEnum<{
        brochure: "brochure";
        technique: "technique";
    }>>;
}, z.core.$strict>;
/**
 * Côté CONSOMMATEUR (le CRM) : la seule exigence de la route historique —
 * entreprise non vide. Tout le reste passe, clés inconnues comprises : c'est
 * le handler qui normalise, tronque et ignore, comme il l'a toujours fait.
 */
export declare const leadV1ConsommateurSchema: z.ZodObject<{
    entreprise: z.ZodString;
}, z.core.$loose>;
export type LeadV1 = z.infer<typeof leadV1ProducteurSchema>;
/**
 * Tolérant : le site lit `success`, et quand ils existent `duplicate`,
 * `prospect.id` et `emailConfirmationSent`. 201 création / 200 doublon — le
 * code exact n'est pas contractuel, seul `response.ok` l'est.
 */
export declare const leadReponseV1Schema: z.ZodObject<{
    success: z.ZodBoolean;
    duplicate: z.ZodOptional<z.ZodBoolean>;
    prospect: z.ZodOptional<z.ZodObject<{
        id: z.ZodNumber;
        entreprise: z.ZodString;
        column: z.ZodString;
        status: z.ZodString;
    }, z.core.$loose>>;
    emailConfirmationSent: z.ZodOptional<z.ZodBoolean>;
    error: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export type LeadReponseV1 = z.infer<typeof leadReponseV1Schema>;
