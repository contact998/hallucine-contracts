/**
 * Contrat coordonnées v1 — GET /api/public/v1/coordonnees (CRM → site).
 *
 * Les coordonnées PUBLIQUES de la société : ligne fixe, ligne WhatsApp
 * Business et son nom de profil, email, site web. Le CRM en est le maître
 * (table `parametres`, réglée à l'écran dans Administratif › Notre société) ;
 * le site les lit pour son pied de page, ses boutons de contact, ses données
 * structurées et ses documents — au lieu de les porter en constantes, qui
 * avaient déjà divergé d'un dépôt à l'autre.
 *
 * Ce fichier dit la FORME de ce qui circule. Il n'expose PAS la table des
 * paramètres : la projection côté CRM ne recopie que ces huit clés, et le
 * schéma STRICT du producteur refuse toute clé de plus.
 *
 * Deux valeurs par numéro, pas une : la forme CANONIQUE (E.164, pour les liens
 * `tel:` et `wa.me/`) et la forme AFFICHÉE, dérivée par le CRM d'une seule
 * fonction de formatage. Le site n'a donc pas à porter un formateur de
 * numéros, ni à retaper un affichage à la main.
 *
 * ⚠️ Les deux numéros ne servent pas à la même chose : `tel` est la seule
 * ligne sur laquelle on peut nous appeler ; `whatsapp` est portée par la
 * Cloud API Meta, messages seulement, aucun appel n'y aboutit.
 */
import { z } from "zod";
/** S'incrémente sur rupture — en théorie jamais : on ajoute, on ne retire pas. */
export declare const COORDONNEES_CONTRACT_VERSION = 1;
/** Le chemin de la route, ici et nulle part ailleurs. */
export declare const COORDONNEES_V1_PATH = "/api/public/v1/coordonnees";
/** Les coordonnées telles que le site les lit — clés inconnues ignorées (additif). */
export declare const coordonneesV1Schema: z.ZodObject<{
    tel: z.ZodString;
    telDisplay: z.ZodString;
    whatsapp: z.ZodString;
    whatsappDisplay: z.ZodString;
    whatsappNom: z.ZodString;
    whatsappNomDisplay: z.ZodString;
    email: z.ZodString;
    siteWeb: z.ZodString;
}, z.core.$strip>;
export type CoordonneesV1 = z.infer<typeof coordonneesV1Schema>;
/** Les mêmes, côté producteur — une clé de trop fait échouer l'émission. */
export declare const coordonneesV1StrictSchema: z.ZodObject<{
    tel: z.ZodString;
    telDisplay: z.ZodString;
    whatsapp: z.ZodString;
    whatsappDisplay: z.ZodString;
    whatsappNom: z.ZodString;
    whatsappNomDisplay: z.ZodString;
    email: z.ZodString;
    siteWeb: z.ZodString;
}, z.core.$strict>;
/** L'enveloppe complète, côté consommateur (tolérante). */
export declare const coordonneesEnveloppeV1Schema: z.ZodObject<{
    contractVersion: z.ZodNumber;
    generatedAt: z.ZodString;
    digest: z.ZodString;
    coordonnees: z.ZodObject<{
        tel: z.ZodString;
        telDisplay: z.ZodString;
        whatsapp: z.ZodString;
        whatsappDisplay: z.ZodString;
        whatsappNom: z.ZodString;
        whatsappNomDisplay: z.ZodString;
        email: z.ZodString;
        siteWeb: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type CoordonneesEnveloppeV1 = z.infer<typeof coordonneesEnveloppeV1Schema>;
/** L'enveloppe complète, côté producteur (stricte, version figée). */
export declare const coordonneesEnveloppeV1StrictSchema: z.ZodObject<{
    contractVersion: z.ZodLiteral<1>;
    generatedAt: z.ZodString;
    digest: z.ZodString;
    coordonnees: z.ZodObject<{
        tel: z.ZodString;
        telDisplay: z.ZodString;
        whatsapp: z.ZodString;
        whatsappDisplay: z.ZodString;
        whatsappNom: z.ZodString;
        whatsappNomDisplay: z.ZodString;
        email: z.ZodString;
        siteWeb: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strict>;
