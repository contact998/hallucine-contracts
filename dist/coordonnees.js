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
export const COORDONNEES_CONTRACT_VERSION = 1;
/** Le chemin de la route, ici et nulle part ailleurs. */
export const COORDONNEES_V1_PATH = "/api/public/v1/coordonnees";
const forme = {
    /** Ligne fixe en E.164 (« +33458212010 ») — pour `href="tel:…"`. */
    tel: z.string(),
    /** La même, formatée pour l'œil (« +33 4 58 21 20 10 »). */
    telDisplay: z.string(),
    /** Ligne WhatsApp Business en E.164 — pour `wa.me/…` (sans le `+`). */
    whatsapp: z.string(),
    /** La même, formatée pour l'œil. */
    whatsappDisplay: z.string(),
    /** Nom de profil WhatsApp Business, SANS `@` (« hallucinecran »). */
    whatsappNom: z.string(),
    /** Le même, tel qu'on l'affiche : « @hallucinecran ». */
    whatsappNomDisplay: z.string(),
    email: z.string(),
    /** Hôte du site public, sans schéma (« www.hallucinecran.fr »). */
    siteWeb: z.string(),
};
/** Les coordonnées telles que le site les lit — clés inconnues ignorées (additif). */
export const coordonneesV1Schema = z.object(forme);
/** Les mêmes, côté producteur — une clé de trop fait échouer l'émission. */
export const coordonneesV1StrictSchema = z.strictObject(forme);
const enveloppeForme = (coordonnees) => ({
    /** Toujours COORDONNEES_CONTRACT_VERSION côté producteur ; le site tolère
     *  les versions SUPÉRIEURES. */
    contractVersion: z.number().int().min(1),
    /** Horodatage ISO de la génération de la réponse. */
    generatedAt: z.string(),
    /** Empreinte stable de `coordonnees` (sha256 hexadécimal côté CRM) — aussi
     *  la valeur de l'en-tête ETag. */
    digest: z.string(),
    coordonnees,
});
/** L'enveloppe complète, côté consommateur (tolérante). */
export const coordonneesEnveloppeV1Schema = z.object(enveloppeForme(coordonneesV1Schema));
/** L'enveloppe complète, côté producteur (stricte, version figée). */
export const coordonneesEnveloppeV1StrictSchema = z.strictObject({
    ...enveloppeForme(coordonneesV1StrictSchema),
    contractVersion: z.literal(COORDONNEES_CONTRACT_VERSION),
});
