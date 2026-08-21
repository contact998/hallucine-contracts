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
export declare const CATALOGUE_CONTRACT_VERSION = 1;
/** Le chemin de la route — ici et nulle part ailleurs (voir MEDIA_V1_PATH). */
export declare const CATALOGUE_V1_PATH = "/api/public/v1/catalogue";
/**
 * Les rôles servables par la route v1. Miroir du registre ROLES_SITE_PUBLICS
 * du CRM (Gate 14), figé là-bas par test — et un test CRM compare les deux
 * listes. `occasion` n'y entrera jamais.
 */
export declare const CATALOGUE_V1_ROLES: readonly ["ecran_vente", "pack", "location", "tente_vente", "mobilier_vente"];
export type CatalogueRoleV1 = (typeof CATALOGUE_V1_ROLES)[number];
/** L'URL complète pour un rôle — le nom du paramètre appartient au contrat. */
export declare function urlCatalogueV1(base: string, role: CatalogueRoleV1): string;
export declare const catalogueSpecsV1Schema: z.ZodObject<{
    tailleHorsTout: z.ZodNullable<z.ZodString>;
    toile: z.ZodNullable<z.ZodString>;
    toileLargeurM: z.ZodNullable<z.ZodNumber>;
    poidsPublicKg: z.ZodNullable<z.ZodNumber>;
    hauteurBaseImageM: z.ZodNullable<z.ZodNumber>;
    montageMinutes: z.ZodNullable<z.ZodNumber>;
    personnesMin: z.ZodNullable<z.ZodNumber>;
    personnesMax: z.ZodNullable<z.ZodNumber>;
    garantieAns: z.ZodNullable<z.ZodNumber>;
    driveIn: z.ZodBoolean;
    largeurCm: z.ZodNullable<z.ZodNumber>;
    profondeurCm: z.ZodNullable<z.ZodNumber>;
    hauteurCm: z.ZodNullable<z.ZodNumber>;
    placesAssises: z.ZodNullable<z.ZodNumber>;
    hauteurAssiseCm: z.ZodNullable<z.ZodNumber>;
}, z.core.$strip>;
export declare const catalogueSpecsV1StrictSchema: z.ZodObject<{
    tailleHorsTout: z.ZodNullable<z.ZodString>;
    toile: z.ZodNullable<z.ZodString>;
    toileLargeurM: z.ZodNullable<z.ZodNumber>;
    poidsPublicKg: z.ZodNullable<z.ZodNumber>;
    hauteurBaseImageM: z.ZodNullable<z.ZodNumber>;
    montageMinutes: z.ZodNullable<z.ZodNumber>;
    personnesMin: z.ZodNullable<z.ZodNumber>;
    personnesMax: z.ZodNullable<z.ZodNumber>;
    garantieAns: z.ZodNullable<z.ZodNumber>;
    driveIn: z.ZodBoolean;
    largeurCm: z.ZodNullable<z.ZodNumber>;
    profondeurCm: z.ZodNullable<z.ZodNumber>;
    hauteurCm: z.ZodNullable<z.ZodNumber>;
    placesAssises: z.ZodNullable<z.ZodNumber>;
    hauteurAssiseCm: z.ZodNullable<z.ZodNumber>;
}, z.core.$strict>;
export type CatalogueSpecsV1 = z.infer<typeof catalogueSpecsV1Schema>;
export declare const catalogueCaracteristiqueV1Schema: z.ZodObject<{
    libelle: z.ZodString;
    valeur: z.ZodString;
}, z.core.$strip>;
/** Côté consommateur (site) : une clé inconnue est IGNORÉE, jamais une erreur. */
export declare const catalogueItemV1Schema: z.ZodObject<{
    id: z.ZodNumber;
    reference: z.ZodString;
    slugSite: z.ZodNullable<z.ZodString>;
    designation: z.ZodString;
    designations: z.ZodRecord<z.ZodString, z.ZodString>;
    prixHT: z.ZodNumber;
    tauxTVA: z.ZodNumber;
    categorie: z.ZodNullable<z.ZodString>;
    unite: z.ZodNullable<z.ZodString>;
    specs: z.ZodNullable<z.ZodObject<{
        tailleHorsTout: z.ZodNullable<z.ZodString>;
        toile: z.ZodNullable<z.ZodString>;
        toileLargeurM: z.ZodNullable<z.ZodNumber>;
        poidsPublicKg: z.ZodNullable<z.ZodNumber>;
        hauteurBaseImageM: z.ZodNullable<z.ZodNumber>;
        montageMinutes: z.ZodNullable<z.ZodNumber>;
        personnesMin: z.ZodNullable<z.ZodNumber>;
        personnesMax: z.ZodNullable<z.ZodNumber>;
        garantieAns: z.ZodNullable<z.ZodNumber>;
        driveIn: z.ZodBoolean;
        largeurCm: z.ZodNullable<z.ZodNumber>;
        profondeurCm: z.ZodNullable<z.ZodNumber>;
        hauteurCm: z.ZodNullable<z.ZodNumber>;
        placesAssises: z.ZodNullable<z.ZodNumber>;
        hauteurAssiseCm: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strip>>;
    caracteristiques: z.ZodArray<z.ZodObject<{
        libelle: z.ZodString;
        valeur: z.ZodString;
    }, z.core.$strip> | z.ZodObject<{
        libelle: z.ZodString;
        valeur: z.ZodString;
    }, z.core.$strict>>;
    inclus: z.ZodArray<z.ZodString>;
    caracteristiquesTrad: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
        libelle: z.ZodString;
        valeur: z.ZodString;
    }, z.core.$strip> | z.ZodObject<{
        libelle: z.ZodString;
        valeur: z.ZodString;
    }, z.core.$strict>>>;
    inclusTrad: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
/** Côté producteur (CRM) : une clé de trop est un ÉCHEC — strict en profondeur. */
export declare const catalogueItemV1StrictSchema: z.ZodObject<{
    id: z.ZodNumber;
    reference: z.ZodString;
    slugSite: z.ZodNullable<z.ZodString>;
    designation: z.ZodString;
    designations: z.ZodRecord<z.ZodString, z.ZodString>;
    prixHT: z.ZodNumber;
    tauxTVA: z.ZodNumber;
    categorie: z.ZodNullable<z.ZodString>;
    unite: z.ZodNullable<z.ZodString>;
    specs: z.ZodNullable<z.ZodObject<{
        tailleHorsTout: z.ZodNullable<z.ZodString>;
        toile: z.ZodNullable<z.ZodString>;
        toileLargeurM: z.ZodNullable<z.ZodNumber>;
        poidsPublicKg: z.ZodNullable<z.ZodNumber>;
        hauteurBaseImageM: z.ZodNullable<z.ZodNumber>;
        montageMinutes: z.ZodNullable<z.ZodNumber>;
        personnesMin: z.ZodNullable<z.ZodNumber>;
        personnesMax: z.ZodNullable<z.ZodNumber>;
        garantieAns: z.ZodNullable<z.ZodNumber>;
        driveIn: z.ZodBoolean;
        largeurCm: z.ZodNullable<z.ZodNumber>;
        profondeurCm: z.ZodNullable<z.ZodNumber>;
        hauteurCm: z.ZodNullable<z.ZodNumber>;
        placesAssises: z.ZodNullable<z.ZodNumber>;
        hauteurAssiseCm: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strip>>;
    caracteristiques: z.ZodArray<z.ZodObject<{
        libelle: z.ZodString;
        valeur: z.ZodString;
    }, z.core.$strip> | z.ZodObject<{
        libelle: z.ZodString;
        valeur: z.ZodString;
    }, z.core.$strict>>;
    inclus: z.ZodArray<z.ZodString>;
    caracteristiquesTrad: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
        libelle: z.ZodString;
        valeur: z.ZodString;
    }, z.core.$strip> | z.ZodObject<{
        libelle: z.ZodString;
        valeur: z.ZodString;
    }, z.core.$strict>>>;
    inclusTrad: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export type CatalogueItemV1 = z.infer<typeof catalogueItemV1Schema>;
export declare const catalogueCollectionV1Schema: z.ZodObject<{
    contractVersion: z.ZodNumber;
    generatedAt: z.ZodString;
    digest: z.ZodString;
    role: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        reference: z.ZodString;
        slugSite: z.ZodNullable<z.ZodString>;
        designation: z.ZodString;
        designations: z.ZodRecord<z.ZodString, z.ZodString>;
        prixHT: z.ZodNumber;
        tauxTVA: z.ZodNumber;
        categorie: z.ZodNullable<z.ZodString>;
        unite: z.ZodNullable<z.ZodString>;
        specs: z.ZodNullable<z.ZodObject<{
            tailleHorsTout: z.ZodNullable<z.ZodString>;
            toile: z.ZodNullable<z.ZodString>;
            toileLargeurM: z.ZodNullable<z.ZodNumber>;
            poidsPublicKg: z.ZodNullable<z.ZodNumber>;
            hauteurBaseImageM: z.ZodNullable<z.ZodNumber>;
            montageMinutes: z.ZodNullable<z.ZodNumber>;
            personnesMin: z.ZodNullable<z.ZodNumber>;
            personnesMax: z.ZodNullable<z.ZodNumber>;
            garantieAns: z.ZodNullable<z.ZodNumber>;
            driveIn: z.ZodBoolean;
            largeurCm: z.ZodNullable<z.ZodNumber>;
            profondeurCm: z.ZodNullable<z.ZodNumber>;
            hauteurCm: z.ZodNullable<z.ZodNumber>;
            placesAssises: z.ZodNullable<z.ZodNumber>;
            hauteurAssiseCm: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strip>>;
        caracteristiques: z.ZodArray<z.ZodObject<{
            libelle: z.ZodString;
            valeur: z.ZodString;
        }, z.core.$strip> | z.ZodObject<{
            libelle: z.ZodString;
            valeur: z.ZodString;
        }, z.core.$strict>>;
        inclus: z.ZodArray<z.ZodString>;
        caracteristiquesTrad: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
            libelle: z.ZodString;
            valeur: z.ZodString;
        }, z.core.$strip> | z.ZodObject<{
            libelle: z.ZodString;
            valeur: z.ZodString;
        }, z.core.$strict>>>;
        inclusTrad: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>;
    }, z.core.$strip> | z.ZodObject<{
        id: z.ZodNumber;
        reference: z.ZodString;
        slugSite: z.ZodNullable<z.ZodString>;
        designation: z.ZodString;
        designations: z.ZodRecord<z.ZodString, z.ZodString>;
        prixHT: z.ZodNumber;
        tauxTVA: z.ZodNumber;
        categorie: z.ZodNullable<z.ZodString>;
        unite: z.ZodNullable<z.ZodString>;
        specs: z.ZodNullable<z.ZodObject<{
            tailleHorsTout: z.ZodNullable<z.ZodString>;
            toile: z.ZodNullable<z.ZodString>;
            toileLargeurM: z.ZodNullable<z.ZodNumber>;
            poidsPublicKg: z.ZodNullable<z.ZodNumber>;
            hauteurBaseImageM: z.ZodNullable<z.ZodNumber>;
            montageMinutes: z.ZodNullable<z.ZodNumber>;
            personnesMin: z.ZodNullable<z.ZodNumber>;
            personnesMax: z.ZodNullable<z.ZodNumber>;
            garantieAns: z.ZodNullable<z.ZodNumber>;
            driveIn: z.ZodBoolean;
            largeurCm: z.ZodNullable<z.ZodNumber>;
            profondeurCm: z.ZodNullable<z.ZodNumber>;
            hauteurCm: z.ZodNullable<z.ZodNumber>;
            placesAssises: z.ZodNullable<z.ZodNumber>;
            hauteurAssiseCm: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strip>>;
        caracteristiques: z.ZodArray<z.ZodObject<{
            libelle: z.ZodString;
            valeur: z.ZodString;
        }, z.core.$strip> | z.ZodObject<{
            libelle: z.ZodString;
            valeur: z.ZodString;
        }, z.core.$strict>>;
        inclus: z.ZodArray<z.ZodString>;
        caracteristiquesTrad: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
            libelle: z.ZodString;
            valeur: z.ZodString;
        }, z.core.$strip> | z.ZodObject<{
            libelle: z.ZodString;
            valeur: z.ZodString;
        }, z.core.$strict>>>;
        inclusTrad: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
}, z.core.$strip>;
export declare const catalogueCollectionV1StrictSchema: z.ZodObject<{
    contractVersion: z.ZodLiteral<1>;
    role: z.ZodEnum<{
        ecran_vente: "ecran_vente";
        pack: "pack";
        location: "location";
        tente_vente: "tente_vente";
        mobilier_vente: "mobilier_vente";
    }>;
    generatedAt: z.ZodString;
    digest: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        reference: z.ZodString;
        slugSite: z.ZodNullable<z.ZodString>;
        designation: z.ZodString;
        designations: z.ZodRecord<z.ZodString, z.ZodString>;
        prixHT: z.ZodNumber;
        tauxTVA: z.ZodNumber;
        categorie: z.ZodNullable<z.ZodString>;
        unite: z.ZodNullable<z.ZodString>;
        specs: z.ZodNullable<z.ZodObject<{
            tailleHorsTout: z.ZodNullable<z.ZodString>;
            toile: z.ZodNullable<z.ZodString>;
            toileLargeurM: z.ZodNullable<z.ZodNumber>;
            poidsPublicKg: z.ZodNullable<z.ZodNumber>;
            hauteurBaseImageM: z.ZodNullable<z.ZodNumber>;
            montageMinutes: z.ZodNullable<z.ZodNumber>;
            personnesMin: z.ZodNullable<z.ZodNumber>;
            personnesMax: z.ZodNullable<z.ZodNumber>;
            garantieAns: z.ZodNullable<z.ZodNumber>;
            driveIn: z.ZodBoolean;
            largeurCm: z.ZodNullable<z.ZodNumber>;
            profondeurCm: z.ZodNullable<z.ZodNumber>;
            hauteurCm: z.ZodNullable<z.ZodNumber>;
            placesAssises: z.ZodNullable<z.ZodNumber>;
            hauteurAssiseCm: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strip>>;
        caracteristiques: z.ZodArray<z.ZodObject<{
            libelle: z.ZodString;
            valeur: z.ZodString;
        }, z.core.$strip> | z.ZodObject<{
            libelle: z.ZodString;
            valeur: z.ZodString;
        }, z.core.$strict>>;
        inclus: z.ZodArray<z.ZodString>;
        caracteristiquesTrad: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
            libelle: z.ZodString;
            valeur: z.ZodString;
        }, z.core.$strip> | z.ZodObject<{
            libelle: z.ZodString;
            valeur: z.ZodString;
        }, z.core.$strict>>>;
        inclusTrad: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>;
    }, z.core.$strip> | z.ZodObject<{
        id: z.ZodNumber;
        reference: z.ZodString;
        slugSite: z.ZodNullable<z.ZodString>;
        designation: z.ZodString;
        designations: z.ZodRecord<z.ZodString, z.ZodString>;
        prixHT: z.ZodNumber;
        tauxTVA: z.ZodNumber;
        categorie: z.ZodNullable<z.ZodString>;
        unite: z.ZodNullable<z.ZodString>;
        specs: z.ZodNullable<z.ZodObject<{
            tailleHorsTout: z.ZodNullable<z.ZodString>;
            toile: z.ZodNullable<z.ZodString>;
            toileLargeurM: z.ZodNullable<z.ZodNumber>;
            poidsPublicKg: z.ZodNullable<z.ZodNumber>;
            hauteurBaseImageM: z.ZodNullable<z.ZodNumber>;
            montageMinutes: z.ZodNullable<z.ZodNumber>;
            personnesMin: z.ZodNullable<z.ZodNumber>;
            personnesMax: z.ZodNullable<z.ZodNumber>;
            garantieAns: z.ZodNullable<z.ZodNumber>;
            driveIn: z.ZodBoolean;
            largeurCm: z.ZodNullable<z.ZodNumber>;
            profondeurCm: z.ZodNullable<z.ZodNumber>;
            hauteurCm: z.ZodNullable<z.ZodNumber>;
            placesAssises: z.ZodNullable<z.ZodNumber>;
            hauteurAssiseCm: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strip>>;
        caracteristiques: z.ZodArray<z.ZodObject<{
            libelle: z.ZodString;
            valeur: z.ZodString;
        }, z.core.$strip> | z.ZodObject<{
            libelle: z.ZodString;
            valeur: z.ZodString;
        }, z.core.$strict>>;
        inclus: z.ZodArray<z.ZodString>;
        caracteristiquesTrad: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
            libelle: z.ZodString;
            valeur: z.ZodString;
        }, z.core.$strip> | z.ZodObject<{
            libelle: z.ZodString;
            valeur: z.ZodString;
        }, z.core.$strict>>>;
        inclusTrad: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type CatalogueCollectionV1 = z.infer<typeof catalogueCollectionV1Schema>;
