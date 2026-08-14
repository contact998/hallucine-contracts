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
/**
 * Longueurs maximales — les varchar réels de la base CRM (prospects/persons).
 * Le producteur les applique en validation ; le consommateur les applique en
 * TRONCATURE. Un dépassement n'est jamais un lead perdu.
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
    /** TEXT MySQL (65 535 octets) — borne large, le configurateur écrit long. */
    notes: 60000,
};
// ─── Le payload ────────────────────────────────────────────────────────────
const champsForme = {
    entreprise: z.string().trim().min(1).max(LEAD_LIMITES.entreprise),
    prenom: z.string().max(LEAD_LIMITES.prenom).optional(),
    personne: z.string().max(LEAD_LIMITES.personne).optional(),
    email: z.string().max(LEAD_LIMITES.email).optional(),
    telephone: z.string().max(LEAD_LIMITES.telephone).optional(),
    siret: z.string().max(LEAD_LIMITES.siret).optional(),
    produit: z.string().max(LEAD_LIMITES.produit).optional(),
    notes: z.string().max(LEAD_LIMITES.notes).optional(),
    ville: z.string().max(LEAD_LIMITES.ville).optional(),
    codePostal: z.string().max(LEAD_LIMITES.codePostal).optional(),
    pays: z.string().max(LEAD_LIMITES.pays).optional(),
    contactType: z.enum(LEAD_CONTACT_TYPES).optional(),
    /** ISO « 2026-06-15 » attendu ; le CRM ignore en silence ce qu'il ne sait pas lire. */
    dateRealisationEnvisagee: z.string().max(30).optional(),
    abandonPartiel: z.boolean().optional(),
    lang: z.enum(LEAD_LANGS),
    requestId: z.string().min(1).max(LEAD_LIMITES.requestId),
    documentType: z.enum(LEAD_DOCUMENT_TYPES).optional(),
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
