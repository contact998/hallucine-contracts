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
export const LEAD_CONTRACT_VERSION = 1;
/** Le chemin de la route — ici et nulle part ailleurs. */
export const LEADS_V1_PATH = "/api/integrations/v1/leads";
/** Valeurs admises — miroirs des enums/validations du CRM, figées par test là-bas. */
export const LEAD_CONTACT_TYPES = ["appel", "mail", "autre"];
export const LEAD_DOCUMENT_TYPES = ["brochure", "technique"];
export const LEAD_LANGS = ["fr", "en", "de", "es", "it", "pt"];
/** Les configurateurs du site qui savent décrire ce qu'ils ont composé. */
export const LEAD_CONFIGURATEUR_GAMMES = ["tente", "mobilier", "lounge"];
/**
 * Longueurs maximales, en OCTETS UTF-8 — l'unité de MySQL, pas celle de
 * JavaScript. « Saint-Étienne » fait 14 caractères et 15 octets : borner en
 * caractères laissait passer des valeurs trop lourdes pour leur colonne.
 *
 * Le producteur les applique en validation, le consommateur en TRONCATURE.
 * Un dépassement n'est jamais un lead perdu.
 */
export const LEAD_LIMITES = {
    entreprise: 255,
    prenom: 255,
    personne: 255,
    email: 320,
    telephone: 50,
    siret: 20,
    produit: 255,
    ville: 100,
    codePostal: 10,
    pays: 100,
    lang: 10,
    requestId: 64,
    documentSlug: 100,
    /** TEXT MySQL = 65 535 OCTETS. Marge gardée pour la ligne « Source » que
     *  le CRM ajoute aux notes après réception. */
    notes: 60000,
};
// ─── Le payload ────────────────────────────────────────────────────────────
/**
 * Compte les octets UTF-8 — l'unité des colonnes MySQL.
 *
 * Calculé à la main plutôt qu'avec TextEncoder : ce paquet ne dépend ni du DOM
 * ni des types Node, et doit rester consommable par le serveur comme par le
 * navigateur. Les règles UTF-8 : < 0x80 → 1 octet, < 0x800 → 2, le reste → 3,
 * et une paire de substituts (emoji) → 4 pour deux unités UTF-16.
 */
const octets = (v) => {
    let total = 0;
    for (let i = 0; i < v.length; i++) {
        const code = v.charCodeAt(i);
        if (code < 0x80)
            total += 1;
        else if (code < 0x800)
            total += 2;
        else if (code >= 0xd800 && code <= 0xdbff) {
            total += 4;
            i++; // le substitut bas appartient au même caractère
        }
        else
            total += 3;
    }
    return total;
};
/** Une chaîne bornée en OCTETS, pas en unités UTF-16. */
const texteBorne = (max) => z.string().refine((v) => octets(v) <= max, { message: `dépasse ${max} octets` });
/**
 * ─── La composition d'un configurateur ─────────────────────────────────────
 *
 * Le visiteur qui a composé sa tente, son mobilier ou son lounge décrivait sa
 * configuration en TEXTE, dans les notes. Le commercial la relisait pour la
 * ressaisir en devis. Ce champ la fait voyager en DONNÉES, pour que le CRM
 * fabrique le brouillon de devis lui-même.
 *
 * ⚠️ AUCUN PRIX ne circule ici, et c'est délibéré : le montant d'une ligne se
 * lit dans le catalogue du CRM, à partir du `slug`. Un prix soumis par un
 * formulaire public n'a rien à faire sur un devis — il serait dicté par le
 * client. Le site n'envoie donc que QUOI et COMBIEN.
 *
 * `slug` = le `slugSite` du catalogue, l'identifiant que les deux applications
 * partagent déjà : les configurateurs y lisent leurs prix, et les clés que
 * fabrique `@hallucine/gonflable` (`cleTente`, `cleAuvent`…) SONT ces slugs.
 */
export const LEAD_CONFIGURATEUR_LIMITES = {
    /** Un lounge chargé tient largement dessous ; au-delà c'est un robot. */
    articles: 80,
    slug: 100,
    designation: 300,
    precision: 300,
    lien: 2000,
};
export const articleConfigureSchema = z.strictObject({
    /** `slugSite` du catalogue CRM — c'est lui qui porte le prix et la référence. */
    slug: texteBorne(LEAD_CONFIGURATEUR_LIMITES.slug),
    quantite: z.number().int().positive().max(500),
    /** Ce que le visiteur a lu à l'écran. Sert de désignation quand le slug ne se
     *  résout pas au catalogue — la ligne existe alors quand même, à chiffrer. */
    designation: texteBorne(LEAD_CONFIGURATEUR_LIMITES.designation).optional(),
    /** Habillage, teinte, visuel : ce que l'atelier doit imprimer. */
    precision: texteBorne(LEAD_CONFIGURATEUR_LIMITES.precision).optional(),
});
export const configurateurSchema = z.strictObject({
    gamme: z.enum(LEAD_CONFIGURATEUR_GAMMES),
    /** L'adresse qui rouvre SA scène en 3D (elle porte le code `?c=`). */
    lien: texteBorne(LEAD_CONFIGURATEUR_LIMITES.lien).optional(),
    /** La capture de sa scène, déjà déposée sur R2 par le site. */
    apercuUrl: texteBorne(LEAD_CONFIGURATEUR_LIMITES.lien).optional(),
    articles: z.array(articleConfigureSchema).max(LEAD_CONFIGURATEUR_LIMITES.articles),
});
const champsForme = {
    entreprise: z.string().trim().min(1).and(texteBorne(LEAD_LIMITES.entreprise)),
    prenom: texteBorne(LEAD_LIMITES.prenom).optional(),
    personne: texteBorne(LEAD_LIMITES.personne).optional(),
    email: texteBorne(LEAD_LIMITES.email).optional(),
    telephone: texteBorne(LEAD_LIMITES.telephone).optional(),
    siret: texteBorne(LEAD_LIMITES.siret).optional(),
    produit: texteBorne(LEAD_LIMITES.produit).optional(),
    notes: texteBorne(LEAD_LIMITES.notes).optional(),
    ville: texteBorne(LEAD_LIMITES.ville).optional(),
    codePostal: texteBorne(LEAD_LIMITES.codePostal).optional(),
    pays: texteBorne(LEAD_LIMITES.pays).optional(),
    contactType: z.enum(LEAD_CONTACT_TYPES).optional(),
    /** ISO « 2026-06-15 » attendu ; le CRM ignore en silence ce qu'il ne sait pas lire. */
    dateRealisationEnvisagee: z.string().max(30).optional(),
    abandonPartiel: z.boolean().optional(),
    lang: z.enum(LEAD_LANGS),
    requestId: z.string().min(1).and(texteBorne(LEAD_LIMITES.requestId)),
    documentType: z.enum(LEAD_DOCUMENT_TYPES).optional(),
    /**
     * QUEL document a été téléchargé — le slug stable de la brochure
     * (« ecran-etanche »), jamais son titre affiché, qui est traduit dans la
     * langue du visiteur. `documentType` dit la NATURE (brochure ou technique)
     * et choisit la réponse automatique ; ce champ dit le PRODUIT, et c'est lui
     * qui permet au CRM de préparer un devis. Le CRM ignore un slug qu'il ne
     * connaît pas : ce n'est jamais un lead refusé.
     */
    documentSlug: texteBorne(LEAD_LIMITES.documentSlug).optional(),
    configurateur: configurateurSchema.optional(),
};
/**
 * Côté PRODUCTEUR (le site) : strict, bornes appliquées, avant l'envoi.
 * Un échec ici est un bug d'émetteur — à journaliser, jamais à transformer en
 * lead perdu : l'émetteur envoie quand même, le CRM tronquera.
 */
export const leadV1ProducteurSchema = z.strictObject(champsForme);
/**
 * Côté CONSOMMATEUR (le CRM) : la seule exigence de la route historique —
 * entreprise non vide. Tout le reste passe, clés inconnues comprises : c'est
 * le handler qui normalise, tronque et ignore, comme il l'a toujours fait.
 */
export const leadV1ConsommateurSchema = z.looseObject({
    entreprise: z.string().trim().min(1),
});
// ─── La réponse du CRM ─────────────────────────────────────────────────────
/**
 * Tolérant : le site lit `success`, et quand ils existent `duplicate`,
 * `prospect.id` et `emailConfirmationSent`. 201 création / 200 doublon — le
 * code exact n'est pas contractuel, seul `response.ok` l'est.
 */
export const leadReponseV1Schema = z.looseObject({
    success: z.boolean(),
    duplicate: z.boolean().optional(),
    prospect: z
        .looseObject({
        id: z.number().int(),
        entreprise: z.string(),
        column: z.string(),
        status: z.string(),
    })
        .optional(),
    emailConfirmationSent: z.boolean().optional(),
    error: z.string().optional(),
});
